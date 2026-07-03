export function int16ArrayToBase64(data: Int16Array): string {
  return Buffer.from(data.buffer, data.byteOffset, data.byteLength).toString("base64");
}

export function base64ToInt16Array(base64: string): Int16Array {
  const buffer = Buffer.from(base64, "base64");
  return new Int16Array(buffer.buffer, buffer.byteOffset, buffer.length / 2);
}

/** Simple linear-interpolation resampler — used only for mixing the recording (not the live bridge, which uses LiveKit's own resampling). */
export function resampleLinear(input: Int16Array, fromRate: number, toRate: number): Int16Array {
  if (fromRate === toRate) return input;
  const ratio = fromRate / toRate;
  const outLength = Math.floor(input.length / ratio);
  const output = new Int16Array(outLength);
  for (let i = 0; i < outLength; i++) {
    const srcPos = i * ratio;
    const srcIndex = Math.floor(srcPos);
    const frac = srcPos - srcIndex;
    const a = input[srcIndex] ?? 0;
    const b = input[srcIndex + 1] ?? a;
    output[i] = Math.round(a + (b - a) * frac);
  }
  return output;
}
