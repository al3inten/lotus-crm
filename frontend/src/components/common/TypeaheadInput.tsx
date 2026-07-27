import { forwardRef, useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { FieldWrapper } from "./Input";

export interface TypeaheadOption {
  value: string;
  label: string;
  hint?: string;
}

interface TypeaheadInputProps {
  label?: string;
  error?: string;
  required?: boolean;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  suggestions: TypeaheadOption[];
  disabled?: boolean;
  name?: string;
}

/** Free-text input with a small suggestions dropdown underneath — unlike a native
 * `<datalist>` (whose popup size/style the browser controls and can't be themed), this stays
 * compact and matches the app's own dropdown styling. Typing a value the CR already knows is
 * always allowed; picking a suggestion just fills it in faster. */
export const TypeaheadInput = forwardRef<HTMLInputElement, TypeaheadInputProps>(function TypeaheadInput(
  { label, error, required, placeholder, value, onChange, onBlur, suggestions, disabled, name },
  ref
) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
        onBlur?.();
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open, onBlur]);

  const showDropdown = open && !disabled && suggestions.length > 0;

  return (
    <FieldWrapper label={label} error={error} required={required}>
      <div className={clsx("relative", showDropdown && "z-30")} ref={rootRef}>
        <input
          ref={ref}
          name={name}
          type="text"
          disabled={disabled}
          value={value}
          placeholder={placeholder}
          onFocus={() => setOpen(true)}
          onChange={(e) => onChange(e.target.value)}
          className={clsx(
            "w-full rounded-lg border px-3 py-2.5 text-sm shadow-sm transition-all bg-white text-slate-900 dark:bg-slate-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 disabled:cursor-not-allowed disabled:opacity-60",
            error ? "border-red-400 dark:border-red-500/50" : "border-slate-300 dark:border-slate-700"
          )}
        />

        {showDropdown && (
          <div className="absolute z-30 mt-1 max-h-32 w-full overflow-y-auto rounded-md border border-slate-200 bg-white py-0.5 text-xs shadow-lg dark:border-slate-700 dark:bg-slate-900">
            {suggestions.map((opt, i) => (
              <button
                key={`${opt.value}-${i}`}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className="flex w-full items-center justify-between gap-2 px-2.5 py-1.5 text-left text-slate-700 transition-colors hover:bg-primary-50 hover:text-primary-700 dark:text-slate-300 dark:hover:bg-primary-500/15 dark:hover:text-primary-300"
              >
                <span>{opt.label}</span>
                {opt.hint && <span className="text-[10px] text-slate-400">{opt.hint}</span>}
              </button>
            ))}
          </div>
        )}
      </div>
    </FieldWrapper>
  );
});
