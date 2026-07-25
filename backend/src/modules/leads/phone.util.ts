import { parsePhoneNumberFromString } from "libphonenumber-js";
import { ValidationError } from "../../lib/errors";

/**
 * Canonicalizes a phone number into the dedupe key stored on Lead.phoneNormalized.
 *
 * Indian numbers keep their historical bare-10-digit form ("9876543210", "+91 98765 43210"
 * and "098765-43210" all collapse to the same key) so every row already in the database
 * still matches. Numbers from any other country normalize to their E.164 digits with the
 * country code kept, which is what makes them distinguishable.
 */
export function normalizePhone(raw: string): string {
  const parsed = parsePhoneNumberFromString(raw, "IN");

  if (parsed?.isValid()) {
    return parsed.country === "IN" ? parsed.nationalNumber : parsed.number.replace(/^\+/, "");
  }

  // Fallback for loosely-formatted Indian numbers that libphonenumber rejects (e.g. test
  // fixtures and older imported rows) — same rules this helper has always applied.
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
