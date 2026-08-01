import { Conversation } from "@prisma/client";
import OpenAI from "openai";
import { prisma } from "../../lib/prisma";
import { logger } from "../../lib/logger";
import { normalizePhone } from "../leads/phone.util";
import { getOpenAiCredentials } from "./integrations.service";

const RECORDING_LIFETIME_MS = 30 * 24 * 60 * 60 * 1000;

export interface FasterqCallPayload {
  callId: string;
  phone: string;
  answered?: boolean;
  inbound?: boolean;
  duration?: number;
  startTime?: string;
  createdAt?: string;
  recordingUrl?: string | null;
}

/**
 * Resolves the FasterQ call's customer phone number to an existing Lead and returns/creates
 * the VOICE conversation used to group all calls with that person — same lookup the outbound
 * dialer (voice-worker/dialer.ts) and WhatsApp webhook use. Returns null when no lead matches,
 * since there's nothing in the CRM to attach an unknown number's call to.
 */
export async function resolveConversationForPhone(rawPhone: string): Promise<Conversation | null> {
  let phoneNormalized: string;
  try {
    phoneNormalized = normalizePhone(rawPhone);
  } catch {
    return null;
  }

  const lead = await prisma.lead.findUnique({ where: { phoneNormalized } });
  if (!lead) return null;

  return prisma.conversation.upsert({
    where: { channel_externalContactId: { channel: "VOICE", externalContactId: phoneNormalized } },
    create: { channel: "VOICE", externalContactId: phoneNormalized, leadId: lead.id, contactName: lead.name },
    update: { leadId: lead.id },
  });
}

export async function upsertCallLogFromFasterq(conversation: Conversation, payload: FasterqCallPayload) {
  const startedAt = payload.startTime ? new Date(payload.startTime) : payload.createdAt ? new Date(payload.createdAt) : new Date();
  const recordingUrl = payload.recordingUrl || null;
  const inbound = payload.inbound ?? true;

  const data = {
    conversationId: conversation.id,
    fromNumber: inbound ? payload.phone : "FASTERQ",
    toNumber: inbound ? "FASTERQ" : payload.phone,
    status: payload.answered ? ("COMPLETED" as const) : ("NO_ANSWER" as const),
    startedAt,
    durationSeconds: payload.duration ? Math.round(payload.duration) : undefined,
    recordingUrl,
    recordingExpiresAt: recordingUrl ? new Date(startedAt.getTime() + RECORDING_LIFETIME_MS) : null,
    transcriptStatus: recordingUrl ? ("PENDING" as const) : ("NONE" as const),
  };

  return prisma.callLog.upsert({
    where: { externalCallId: payload.callId },
    create: { ...data, externalCallId: payload.callId },
    update: data,
  });
}

/**
 * Transcribes a FasterQ recording via OpenAI Whisper and saves the text, so the call stays
 * reviewable in our own DB after FasterQ's 30-day recording URL expires. Safe to call
 * repeatedly — no-ops once a transcript already exists.
 */
export async function transcribeIfNeeded(callLogId: string) {
  const callLog = await prisma.callLog.findUnique({ where: { id: callLogId } });
  if (!callLog || !callLog.recordingUrl || callLog.transcript) return;

  try {
    const creds = await getOpenAiCredentials();
    const client = new OpenAI({ apiKey: creds.apiKey });

    const audioResponse = await fetch(callLog.recordingUrl);
    if (!audioResponse.ok) throw new Error(`Failed to download recording: ${audioResponse.status}`);
    const audioBuffer = Buffer.from(await audioResponse.arrayBuffer());
    const audioFile = new File([audioBuffer], "recording.mp3", { type: "audio/mpeg" });

    const result = await client.audio.transcriptions.create({ file: audioFile, model: "whisper-1" });

    await prisma.callLog.update({
      where: { id: callLogId },
      data: { transcript: result.text, transcriptStatus: "DONE" },
    });
  } catch (err) {
    logger.error("FasterQ transcription failed", {
      callLogId,
      error: err instanceof Error ? err.message : String(err),
    });
    await prisma.callLog.update({ where: { id: callLogId }, data: { transcriptStatus: "FAILED" } });
  }
}

/** Applies one FasterQ call payload end-to-end: resolve lead, upsert CallLog, kick off transcription if ready. */
export async function applyFasterqCall(payload: FasterqCallPayload) {
  const conversation = await resolveConversationForPhone(payload.phone);
  if (!conversation) {
    logger.info("FasterQ call has no matching lead, skipping", { callId: payload.callId, phone: payload.phone });
    return;
  }

  const callLog = await upsertCallLogFromFasterq(conversation, payload);

  if (callLog.recordingUrl && !callLog.transcript) {
    transcribeIfNeeded(callLog.id).catch((err) =>
      logger.error("FasterQ background transcription failed", {
        callLogId: callLog.id,
        error: err instanceof Error ? err.message : String(err),
      })
    );
  }

  return callLog;
}
