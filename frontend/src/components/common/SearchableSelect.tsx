import { forwardRef, useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import clsx from "clsx";
import { ChevronDown, Search, X } from "lucide-react";
import { FieldWrapper } from "./Input";

export interface SearchableSelectOption {
  value: string;
  label: string;
  hint?: string;
}

interface SearchableSelectProps {
  label?: string;
  error?: string;
  required?: boolean;
  placeholder?: string;
  value?: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  options: SearchableSelectOption[];
  disabled?: boolean;
  emptyMessage?: string;
}

/** Combobox: text input that filters a floating option list. Built in-house since
 * this codebase has no combobox/autocomplete dependency (no react-select/cmdk/downshift). */
export const SearchableSelect = forwardRef<HTMLInputElement, SearchableSelectProps>(function SearchableSelect(
  { label, error, required, placeholder = "Search…", value, onChange, onBlur, options, disabled, emptyMessage = "No matches found" },
  ref
) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);
  const filtered = query.trim() ? options.filter((o) => o.label.toLowerCase().includes(query.trim().toLowerCase())) : options;

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

  const commit = (opt: SearchableSelectOption) => {
    onChange(opt.value);
    setQuery("");
    setOpen(false);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "Enter") setOpen(true);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(filtered.length - 1, h + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(0, h - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[highlight]) commit(filtered[highlight]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <FieldWrapper label={label} error={error} required={required}>
      <div className={clsx("relative", open && "z-40")} ref={rootRef}>
        <div
          className={clsx(
            "flex h-11 items-center gap-2 rounded-lg border px-3 text-sm shadow-sm transition-all bg-white dark:bg-slate-950",
            error ? "border-red-400 dark:border-red-500/50" : "border-slate-300 dark:border-slate-700",
            open && "ring-2 ring-primary-500/50",
            disabled && "cursor-not-allowed opacity-60"
          )}
        >
          <Search size={14} className="shrink-0 text-slate-400" />
          <input
            ref={ref}
            type="text"
            disabled={disabled}
            value={open ? query : (selected?.label ?? "")}
            placeholder={selected ? selected.label : placeholder}
            onFocus={() => {
              setOpen(true);
              setQuery("");
              setHighlight(0);
            }}
            onChange={(e) => {
              setQuery(e.target.value);
              setHighlight(0);
            }}
            onKeyDown={onKeyDown}
            className="w-full min-w-0 truncate bg-transparent text-slate-900 placeholder:text-slate-400 focus:outline-none dark:text-white"
          />
          {selected && !disabled && (
            <button
              type="button"
              tabIndex={-1}
              onClick={() => {
                onChange("");
                setQuery("");
              }}
              className="shrink-0 text-slate-300 hover:text-slate-500 dark:hover:text-slate-300"
              aria-label="Clear selection"
            >
              <X size={13} />
            </button>
          )}
          <ChevronDown size={14} className="shrink-0 text-slate-400" />
        </div>

        {open && !disabled && (
          <div className="absolute z-40 mt-1.5 max-h-56 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-xl dark:border-slate-700 dark:bg-slate-900">
            {filtered.length === 0 ? (
              <p className="px-3 py-2 text-sm text-slate-400">{emptyMessage}</p>
            ) : (
              filtered.map((opt, i) => (
                <button
                  // Index-suffixed so a caller passing two options with the same value
                  // (e.g. vehicle variants sharing a name) can't produce duplicate keys.
                  key={`${opt.value}-${i}`}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => commit(opt)}
                  className={clsx(
                    "flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm transition-colors",
                    i === highlight
                      ? "bg-primary-50 text-primary-700 dark:bg-primary-500/15 dark:text-primary-300"
                      : "text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                  )}
                >
                  <span>{opt.label}</span>
                  {opt.hint && <span className="text-xs text-slate-400">{opt.hint}</span>}
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </FieldWrapper>
  );
});
