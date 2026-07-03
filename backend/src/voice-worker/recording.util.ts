import { Readable } from "stream";
import { resampleLinear } from "./audio.util";
import { configureCloudinary } from "../modules/integrations/integrations.service";

const RECORDING_SAMPLE_RATE = 16000;

function writeWavHeader(dataLength: number, sampleRate: number, numChannels: number): Buffer {
  const header = Buffer.alloc(44);
  const byteRate = sampleRate * numChannels * 2;
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + dataLength, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(numChannels * 2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(dataLength, 40);
  return header;
}

/**
 * Accumulates both legs of a call (caller + agent) as they stream in, and produces a
 * stereo WAV at call end — left channel is the caller, right channel is the agent, so a
 * reviewer can tell who said what without needing to mix/separate voices after the fact.
 */
export class CallRecorder {
  private callerChunks: Int16Array[] = [];
  private agentChunks: Int16Array[] = [];

  addCallerFrame(data: Int16Array, sampleRate: number) {
    this.callerChunks.push(sampleRate === RECORDING_SAMPLE_RATE ? data : resampleLinear(data, sampleRate, RECORDING_SAMPLE_RATE));
  }

  addAgentFrame(data: Int16Array, sampleRate: number) {
    this.agentChunks.push(sampleRate === RECORDING_SAMPLE_RATE ? data : resampleLinear(data, sampleRate, RECORDING_SAMPLE_RATE));
  }

  private concat(chunks: Int16Array[]): Int16Array {
    const total = chunks.reduce((sum, c) => sum + c.length, 0);
    const result = new Int16Array(total);
    let offset = 0;
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }
    return result;
  }

  toWavBuffer(): Buffer {
    const caller = this.concat(this.callerChunks);
    const agent = this.concat(this.agentChunks);
    const length = Math.max(caller.length, agent.length);

    const pcm = Buffer.alloc(length * 4); // stereo, 16-bit
    for (let i = 0; i < length; i++) {
      pcm.writeInt16LE(caller[i] ?? 0, i * 4);
      pcm.writeInt16LE(agent[i] ?? 0, i * 4 + 2);
    }

    return Buffer.concat([writeWavHeader(pcm.length, RECORDING_SAMPLE_RATE, 2), pcm]);
  }
}

export async function uploadRecording(wavBuffer: Buffer, callLogId: string): Promise<string> {
  const cloudinary = await configureCloudinary();
  const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { resource_type: "video", folder: "lotus-crm/call-recordings", public_id: callLogId },
      (error, res) => (error || !res ? reject(error ?? new Error("Upload failed")) : resolve(res))
    );
    Readable.from(wavBuffer).pipe(uploadStream);
  });
  return result.secure_url;
}
