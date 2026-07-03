import crypto from "crypto";

/**
 * Verifies Meta's X-Hub-Signature-256 header against the raw request body.
 * Must run against the exact raw bytes Meta signed — never the re-serialized JSON,
 * since key ordering/whitespace differences would break the HMAC comparison.
 */
export function verifyMetaSignature(rawBody: Buffer | undefined, signatureHeader: string | undefined, appSecret: string): boolean {
  if (!rawBody || !signatureHeader) return false;
  const [algo, providedDigest] = signatureHeader.split("=");
  if (algo !== "sha256" || !providedDigest) return false;

  const expectedDigest = crypto.createHmac("sha256", appSecret).update(rawBody).digest("hex");

  const provided = Buffer.from(providedDigest, "hex");
  const expected = Buffer.from(expectedDigest, "hex");
  if (provided.length !== expected.length) return false;

  return crypto.timingSafeEqual(provided, expected);
}
