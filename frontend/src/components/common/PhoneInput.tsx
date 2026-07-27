import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  AsYouType,
  getCountries,
  getCountryCallingCode,
  getExampleNumber,
  parsePhoneNumberFromString,
} from "libphonenumber-js";
import type { CountryCode } from "libphonenumber-js";
import examples from "libphonenumber-js/examples.mobile.json";
import { ChevronDown } from "lucide-react";
import clsx from "clsx";
import { FieldWrapper } from "./Input";

export const DEFAULT_COUNTRY: CountryCode = "IN";

const displayNames =
  typeof Intl !== "undefined" && "DisplayNames" in Intl
    ? new Intl.DisplayNames(["en"], { type: "region" })
    : undefined;

function countryLabel(country: CountryCode) {
  return displayNames?.of(country) ?? country;
}

/** Countries sorted by name, with India pinned first since it's the dealership's home market. */
function useCountryOptions() {
  return useMemo(() => {
    const rest = getCountries()
      .filter((c) => c !== DEFAULT_COUNTRY)
      .map((c) => ({ country: c, label: `${countryLabel(c)} +${getCountryCallingCode(c)}` }))
      .sort((a, b) => a.label.localeCompare(b.label));
    return [
      { country: DEFAULT_COUNTRY, label: `${countryLabel(DEFAULT_COUNTRY)} +${getCountryCallingCode(DEFAULT_COUNTRY)}` },
      ...rest,
    ];
  }, []);
}

/** Placeholder showing what a real mobile number looks like in the selected country. */
function nationalExample(country: CountryCode) {
  return getExampleNumber(country, examples)?.formatNational() ?? "";
}

/** The country a complete E.164 value belongs to, or undefined while it's still being typed. */
function countryOf(value: string | undefined): CountryCode | undefined {
  if (!value) return undefined;
  return parsePhoneNumberFromString(value.startsWith("+") ? value : `+${value}`)?.country;
}

/**
 * The digits the user actually edits: the value minus the selected country's calling code.
 * Done by prefix rather than by parsing, because a half-typed number ("+919") doesn't parse
 * yet — and falling back to the raw digits there would show the "91" inside the field.
 */
function nationalPart(value: string | undefined, country: CountryCode) {
  const digits = (value ?? "").replace(/\D/g, "");
  const callingCode = getCountryCallingCode(country);
  return digits.startsWith(callingCode) ? digits.slice(callingCode.length) : digits;
}

interface PhoneInputProps {
  label?: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  /** E.164, e.g. "+919876543210". Empty string when nothing has been typed yet. */
  value: string | undefined;
  onChange: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

/**
 * Country-code picker + national number field, backed by libphonenumber-js so the digits
 * are grouped the way the selected country writes them (98765 43210 for India, (555)
 * 123-4567 for the US, …). The value handed to the form is always E.164, which is what
 * the API normalizes and dedupes on.
 */
export function PhoneInput({
  label,
  required,
  error,
  disabled,
  autoFocus,
  value,
  onChange,
  onKeyDown,
}: PhoneInputProps) {
  const options = useCountryOptions();
  // The picker's own state: while a number is incomplete the value can't say which country
  // it belongs to, so the component has to remember what the user chose.
  const [country, setCountry] = useState<CountryCode>(() => countryOf(value) ?? DEFAULT_COUNTRY);
  const national = nationalPart(value, country);
  const inputRef = useRef<HTMLInputElement>(null);
  // How many digits sit left of the caret after the current edit. Grouping characters move
  // around when the value is reformatted, so the digit count — not the raw offset — is the
  // stable thing to restore the caret to.
  const caretDigitsRef = useRef<number | null>(null);

  // AsYouType formats as the user types; we store the machine-readable E.164 form and
  // only ever render the formatted string.
  const formatted = national ? new AsYouType(country).input(national) : "";

  // A value set from outside (a pre-filled customer profile, a resumed draft) carries its
  // own country — move the picker to it.
  useEffect(() => {
    const parsedCountry = countryOf(value);
    // Compared by calling code, not by country: several countries share one code (+1 for
    // US/CA, +7 for RU/KZ), and flipping the picker between them mid-typing would be noise.
    if (parsedCountry && getCountryCallingCode(parsedCountry) !== getCountryCallingCode(country)) {
      setCountry(parsedCountry);
    }
  }, [value, country]);

  const emit = (nextCountry: CountryCode, nextNational: string) => {
    const digits = nextNational.replace(/\D/g, "");
    onChange(digits ? `+${getCountryCallingCode(nextCountry)}${digits}` : "");
  };

  // React writes the reformatted string back into the input, which parks the caret at the
  // end — put it back where the user was typing before the browser paints.
  useLayoutEffect(() => {
    const el = inputRef.current;
    const targetDigits = caretDigitsRef.current;
    caretDigitsRef.current = null;
    if (!el || targetDigits === null || document.activeElement !== el) return;

    let seen = 0;
    let offset = el.value.length;
    for (let i = 0; i < el.value.length; i++) {
      if (seen === targetDigits) {
        offset = i;
        break;
      }
      if (/\d/.test(el.value[i])) seen++;
    }
    // Land after any grouping characters that directly follow the caret's digit, so typing
    // continues in the next group rather than before its separator.
    while (offset < el.value.length && !/\d/.test(el.value[offset])) offset++;
    el.setSelectionRange(offset, offset);
    // Deliberately runs after every render, not just when `formatted` changes: an edit that
    // leaves the digits unchanged (deleting a grouping space) still gets the DOM value
    // rewritten by React, and that alone sends the caret to the end.
  });

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const caret = e.target.selectionStart ?? e.target.value.length;
    caretDigitsRef.current = e.target.value.slice(0, caret).replace(/\D/g, "").length;
    emit(country, e.target.value);
  };

  return (
    <FieldWrapper label={label} error={error} required={required}>
      <div
        className={clsx(
          "flex rounded-lg border shadow-sm transition-all focus-within:ring-2 focus-within:ring-primary-500/50",
          error ? "border-red-400 dark:border-red-500/50" : "border-slate-300 dark:border-slate-700",
          disabled && "opacity-60"
        )}
      >
        <div className="relative shrink-0">
          <select
            aria-label="Country code"
            disabled={disabled}
            value={country}
            onChange={(e) => {
              const next = e.target.value as CountryCode;
              setCountry(next);
              emit(next, national);
            }}
            className="h-full max-w-[10rem] appearance-none truncate rounded-l-lg border-r border-slate-200 bg-slate-50 py-2.5 pl-3 pr-7 text-sm font-medium text-slate-700 focus:outline-none disabled:cursor-not-allowed dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
          >
            {options.map((o) => (
              <option key={o.country} value={o.country}>
                {o.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400"
          />
        </div>
        <input
          type="tel"
          inputMode="tel"
          autoFocus={autoFocus}
          disabled={disabled}
          value={formatted}
          placeholder={nationalExample(country)}
          ref={inputRef}
          onChange={onInputChange}
          onKeyDown={onKeyDown}
          className="w-full rounded-r-lg bg-white px-3 py-2.5 text-sm text-slate-900 focus:outline-none disabled:cursor-not-allowed dark:bg-slate-950 dark:text-white"
        />
      </div>
    </FieldWrapper>
  );
}
