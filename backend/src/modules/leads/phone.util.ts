import { ValidationError } from "../../lib/errors";

/**
 * Canonicalizes an Indian phone number to a bare 10-digit string so
 * "9876543210", "+91 98765 43210", and "098765-43210" all dedupe to the same key.
 */
export function normalizePhone(raw: string): string {
  let digits = raw.replace(/[^\d+]/g, "");
  digits = digits.replace(/^\+/, "");

  if (digits.startsWith("91") && digits.length === 12) {
    digits = digits.slice(2);
  } else if (digits.startsWith("0") && digits.length === 11) {
    digits = digits.slice(1);
  }

  if (digits.length !== 10) {
    throw new ValidationError(`Invalid phone number: ${raw}`);
  }

  return digits;
}
