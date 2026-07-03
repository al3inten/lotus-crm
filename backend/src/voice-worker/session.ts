import { Room, RoomEvent, AudioStream, AudioSource, AudioFrame, LocalAudioTrack, RemoteAudioTrack } from "@livekit/rtc-node";
import { TrackPublishOptions, TrackSource, TrackKind } from "@livekit/rtc-ffi-bindings";
import { AccessToken } from "livekit-server-sdk";
import { GoogleGenAI, Modality, Session as LiveSession } from "@google/genai";
import { AgentConfig } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { logger } from "../lib/logger";
import * as integrationsService from "../modules/integrations/integrations.service";
import { base64ToInt16Array, int16ArrayToBase64 } from "./audio.util";
import { CallRecorder, uploadRecording } from "./recording.util";

const AGENT_INPUT_SAMPLE_RATE = 16000;
const AGENT_OUTPUT_SAMPLE_RATE = 24000;
const CALL_TIMEOUT_MS = 10 * 60 * 1000; // hard cap so a stuck call can't run forever

const DISCLOSURE_TEXT =
  "Hi, this is Lotus Motors calling regarding your recent enquiry. Please note this call may be recorded for quality and training purposes.";

async function getLivekitConnectionDetails() {
  const creds = await integrationsService.getLivekitCredentials();
  return creds;
}

async function buildBotToken(roomName: string, livekitApiKey: string, livekitApiSecret: string) {
  const token = new AccessToken(livekitApiKey, livekitApiSecret, { identity: "lotus-voice-agent" });
  token.addGrant({ roomJoin: true, room: roomName, canPublish: true, canSubscribe: true });
  return token.toJwt();
}

interface CallOutcome {
  status: "COMPLETED" | "NO_ANSWER" | "FAILED";
  durationSeconds: number;
  recordingUrl?: string;
  summary?: string;
}

/**
 * Joins the LiveKit room created for one outbound call, bridges the SIP caller's audio to
 * Gemini's Live API and back, and records + transcribes the whole exchange. Runs until the
 * caller hangs up (or CALL_TIMEOUT_MS elapses), then resolves with the call outcome.
 */
export async function runCallSession(roomName: string, conversationId: string, agentConfig: AgentConfig): Promise<CallOutcome> {
  const startedAt = Date.now();
  const livekit = await getLivekitConnectionDetails();
  const gemini = await integrationsService.getGeminiCredentials();
  const botToken = await buildBotToken(roomName, livekit.apiKey, livekit.apiSecret);

  const room = new Room();
  const recorder = new CallRecorder();
  const ai = new GoogleGenAI({ apiKey: gemini.apiKey });

  let liveSession: LiveSession | undefined;
  let audioSource: AudioSource | undefined;
  let callerJoined = false;
  let resolved = false;

  return new Promise<CallOutcome>((resolve) => {
    const finish = async (status: CallOutcome["status"]) => {
      if (resolved) return;
      resolved = true;
      clearTimeout(timeoutHandle);

      liveSession?.close();
      let recordingUrl: string | undefined;
      try {
        const wav = recorder.toWavBuffer();
        if (wav.length > 44) {
          recordingUrl = await uploadRecording(wav, `${roomName}-recording`);
        }
      } catch (err) {
        logger.error("Failed to upload call recording", { roomName, message: err instanceof Error ? err.message : String(err) });
      }

      await room.disconnect().catch(() => {});

      resolve({
        status,
        durationSeconds: Math.round((Date.now() - startedAt) / 1000),
        recordingUrl,
      });
    };

    const timeoutHandle = setTimeout(() => finish(callerJoined ? "COMPLETED" : "NO_ANSWER"), CALL_TIMEOUT_MS);

    async function logTranscript(direction: "INBOUND" | "OUTBOUND", text: string) {
      if (!text.trim()) return;
      await prisma.chatMessage.create({ data: { conversationId, direction, body: text } });
    }

    async function startLiveSession() {
      liveSession = await ai.live.connect({
        model: agentConfig.model,
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: agentConfig.systemPrompt,
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          ...(agentConfig.voiceName
            ? { speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: agentConfig.voiceName } } } }
            : {}),
        },
        callbacks: {
          onmessage: (message) => {
            const content = message.serverContent;
            if (!content) return;

            const audioParts = content.modelTurn?.parts?.filter((p) => p.inlineData?.data) ?? [];
            for (const part of audioParts) {
              const pcm = base64ToInt16Array(part.inlineData!.data!);
              recorder.addAgentFrame(pcm, AGENT_OUTPUT_SAMPLE_RATE);
              const frame = new AudioFrame(pcm, AGENT_OUTPUT_SAMPLE_RATE, 1, pcm.length);
              audioSource?.captureFrame(frame).catch(() => {});
            }

            if (content.inputTranscription?.text) void logTranscript("INBOUND", content.inputTranscription.text);
            if (content.outputTranscription?.text) void logTranscript("OUTBOUND", content.outputTranscription.text);
          },
          onerror: (event) => logger.error("Gemini Live session error", { roomName, error: String(event) }),
          onclose: () => logger.info("Gemini Live session closed", { roomName }),
        },
      });

      // Force the mandatory recording-disclosure line to open every call, verbatim,
      // before the model proceeds with its configured system-prompt persona.
      liveSession.sendClientContent({
        turns: [{ role: "user", parts: [{ text: `Say exactly this, word for word, as your first sentence: "${DISCLOSURE_TEXT}" Then continue the conversation naturally per your instructions.` }] }],
        turnComplete: true,
      });
    }

    async function bridgeCallerAudio(track: RemoteAudioTrack) {
      const stream = new AudioStream(track, AGENT_INPUT_SAMPLE_RATE, 1);
      const reader = stream.getReader();
      while (true) {
        const { value: frame, done } = await reader.read();
        if (done || resolved) break;
        recorder.addCallerFrame(frame.data, AGENT_INPUT_SAMPLE_RATE);
        liveSession?.sendRealtimeInput({
          audio: { data: int16ArrayToBase64(frame.data), mimeType: `audio/pcm;rate=${AGENT_INPUT_SAMPLE_RATE}` },
        });
      }
    }

    room.on(RoomEvent.TrackSubscribed, (track) => {
      if (track.kind !== TrackKind.KIND_AUDIO) return;
      callerJoined = true;
      void bridgeCallerAudio(track as RemoteAudioTrack);
    });

    room.on(RoomEvent.ParticipantDisconnected, () => finish("COMPLETED"));
    room.on(RoomEvent.Disconnected, () => finish(callerJoined ? "COMPLETED" : "FAILED"));

    room
      .connect(livekit.serverUrl, botToken)
      .then(async () => {
        audioSource = new AudioSource(AGENT_OUTPUT_SAMPLE_RATE, 1);
        const track = LocalAudioTrack.createAudioTrack("agent-audio", audioSource);
        await room.localParticipant?.publishTrack(track, new TrackPublishOptions({ source: TrackSource.SOURCE_MICROPHONE }));
        await startLiveSession();
      })
      .catch((err) => {
        logger.error("Failed to connect voice worker to LiveKit room", { roomName, message: err instanceof Error ? err.message : String(err) });
        void finish("FAILED");
      });
  });
}
