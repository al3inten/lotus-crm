import { useMemo, useState } from "react";
import { Calendar as CalendarIcon, Clock, X } from "lucide-react";
import { format, parse, isValid, setHours, setMinutes, startOfDay } from "date-fns";
import { FieldWrapper } from "./Input";
import { Calendar } from "../ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { cn } from "../../lib/utils";

/**
 * Date/time pickers built on Radix Popover + react-day-picker (shadcn pattern),
 * replacing react-datepicker. The exported API is unchanged so existing forms
 * keep working: every picker takes { label, error, value, onChange, placeholder,
 * disabled } and emits a string (or number, for YearPicker).
 */

/** Trigger styled to match the app's other form fields (see Input.tsx). */
const triggerClass = (error?: string, disabled?: boolean) =>
  cn(
    "flex w-full items-center gap-2 rounded-xl border bg-white py-2.5 pl-9 pr-9 text-left text-sm text-slate-900 shadow-sm transition-colors",
    "focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/15",
    "dark:bg-slate-900 dark:text-white",
    error ? "border-red-400 dark:border-red-500/60" : "border-slate-200 dark:border-slate-700",
    disabled && "cursor-not-allowed bg-slate-50 dark:bg-slate-800/50"
  );

interface BaseProps {
  label?: string;
  error?: string;
  required?: boolean;
  value?: string;
  onChange: (value: string | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
}

/** Shared shell: icon + trigger button + clear affordance inside a FieldWrapper. */
function PickerShell({
  label,
  error,
  required,
  disabled,
  icon,
  text,
  placeholder,
  hasValue,
  onClear,
  children,
}: {
  label?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  icon: React.ReactNode;
  text: string | null;
  placeholder: string;
  hasValue: boolean;
  onClear: () => void;
  /** Render prop so pickers can close the popover themselves once a selection is complete. */
  children: (close: () => void) => React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <FieldWrapper label={label} error={error} required={required}>
      <Popover open={open} onOpenChange={setOpen}>
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-slate-400">
            {icon}
          </span>
          <PopoverTrigger disabled={disabled} className={triggerClass(error, disabled)}>
            {text ? (
              <span className="truncate">{text}</span>
            ) : (
              <span className="truncate text-slate-400 dark:text-slate-500">{placeholder}</span>
            )}
          </PopoverTrigger>
          {hasValue && !disabled && (
            <button
              type="button"
              aria-label="Clear"
              onClick={(e) => {
                e.stopPropagation();
                onClear();
              }}
              className="absolute right-2.5 top-1/2 z-10 -translate-y-1/2 rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            >
              <X size={14} />
            </button>
          )}
        </div>
        <PopoverContent onOpenAutoFocus={(e) => e.preventDefault()}>{children(() => setOpen(false))}</PopoverContent>
      </Popover>
    </FieldWrapper>
  );
}

/** 15-minute increments, matching the previous react-datepicker configuration. */
function useTimeOptions() {
  return useMemo(() => {
    const out: { value: string; label: string }[] = [];
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 15) {
        const d = setMinutes(setHours(new Date(), h), m);
        out.push({ value: format(d, "HH:mm"), label: format(d, "h:mm aa") });
      }
    }
    return out;
  }, []);
}

function TimeColumn({ selected, onSelect }: { selected: string | null; onSelect: (t: string) => void }) {
  const options = useTimeOptions();
  return (
    <div className="flex max-h-[268px] w-28 flex-col overflow-y-auto border-l border-slate-200 pl-2 dark:border-slate-700">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onSelect(opt.value)}
          className={cn(
            "shrink-0 rounded-lg px-2 py-1.5 text-left text-sm font-medium transition-colors",
            selected === opt.value
              ? "bg-blue-600 text-white dark:bg-blue-500"
              : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

/** Date + time (12-hour, AM/PM). Value is an ISO string. */
export function DateTimePicker({ label, error, required, value, onChange, placeholder, disabled }: BaseProps) {
  const selected = value && isValid(new Date(value)) ? new Date(value) : null;

  const commitDate = (date: Date | undefined) => {
    if (!date) return onChange(undefined);
    // Keep the already-chosen time when only the day changes; default to 09:00.
    const base = selected ?? setHours(startOfDay(date), 9);
    const next = setMinutes(setHours(startOfDay(date), base.getHours()), base.getMinutes());
    onChange(next.toISOString());
  };

  const commitTime = (time: string) => {
    const [h, m] = time.split(":").map(Number);
    const base = selected ?? new Date();
    onChange(setMinutes(setHours(base, h), m).toISOString());
  };

  return (
    <PickerShell
      label={label}
      error={error}
      required={required}
      disabled={disabled}
      icon={<CalendarIcon size={15} />}
      text={selected ? format(selected, "dd-MM-yyyy h:mm aa") : null}
      placeholder={placeholder ?? "dd-mm-yyyy --:--"}
      hasValue={!!selected}
      onClear={() => onChange(undefined)}
    >
      {(close) => (
        <div className="flex gap-2">
          <Calendar mode="single" selected={selected ?? undefined} onSelect={commitDate} defaultMonth={selected ?? undefined} />
          <TimeColumn
            selected={selected ? format(selected, "HH:mm") : null}
            onSelect={(t) => {
              commitTime(t);
              close();
            }}
          />
        </div>
      )}
    </PickerShell>
  );
}

/** Date only (no time). Value is a `yyyy-MM-dd` string. */
export function DatePickerField({ label, error, required, value, onChange, placeholder, disabled }: BaseProps) {
  const parsed = value ? parse(value, "yyyy-MM-dd", new Date()) : null;
  const selected = parsed && isValid(parsed) ? parsed : null;

  return (
    <PickerShell
      label={label}
      error={error}
      required={required}
      disabled={disabled}
      icon={<CalendarIcon size={15} />}
      text={selected ? format(selected, "dd-MM-yyyy") : null}
      placeholder={placeholder ?? "dd-mm-yyyy"}
      hasValue={!!selected}
      onClear={() => onChange(undefined)}
    >
      {(close) => (
        <Calendar
          mode="single"
          selected={selected ?? undefined}
          defaultMonth={selected ?? undefined}
          onSelect={(d) => {
            onChange(d ? format(d, "yyyy-MM-dd") : undefined);
            close();
          }}
        />
      )}
    </PickerShell>
  );
}

/** Time only, 12-hour (AM/PM). Value is a `HH:mm` (24h) string for storage. */
export function TimePicker({ label, error, required, value, onChange, placeholder, disabled }: BaseProps) {
  const parsed = value ? parse(value, "HH:mm", new Date()) : null;
  const selected = parsed && isValid(parsed) ? parsed : null;

  return (
    <PickerShell
      label={label}
      error={error}
      required={required}
      disabled={disabled}
      icon={<Clock size={15} />}
      text={selected ? format(selected, "h:mm aa") : null}
      placeholder={placeholder ?? "--:-- --"}
      hasValue={!!selected}
      onClear={() => onChange(undefined)}
    >
      {(close) => (
        <TimeColumn
          selected={selected ? format(selected, "HH:mm") : null}
          onSelect={(t) => {
            onChange(t);
            close();
          }}
        />
      )}
    </PickerShell>
  );
}

interface YearPickerProps {
  label?: string;
  error?: string;
  required?: boolean;
  value?: number | string;
  onChange: (value: number | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
}

const DECADE_SIZE = 12;

/** Year only — a paged grid of years. Value/onChange are the year number. */
export function YearPicker({ label, error, required, value, onChange, placeholder, disabled }: YearPickerProps) {
  const selectedYear = value ? Number(value) : undefined;
  const [pageStart, setPageStart] = useState(() => {
    const anchor = selectedYear ?? new Date().getFullYear();
    return anchor - (anchor % DECADE_SIZE);
  });

  const years = Array.from({ length: DECADE_SIZE }, (_, i) => pageStart + i);

  return (
    <PickerShell
      label={label}
      error={error}
      required={required}
      disabled={disabled}
      icon={<CalendarIcon size={15} />}
      text={selectedYear ? String(selectedYear) : null}
      placeholder={placeholder ?? "yyyy"}
      hasValue={!!selectedYear}
      onClear={() => onChange(undefined)}
    >
      {(close) => (
        <div className="w-60">
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setPageStart((s) => s - DECADE_SIZE)}
              className="rounded-lg px-2 py-1 text-slate-500 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              ‹
            </button>
            <span className="text-sm font-semibold text-slate-900 dark:text-white">
              {pageStart} – {pageStart + DECADE_SIZE - 1}
            </span>
            <button
              type="button"
              onClick={() => setPageStart((s) => s + DECADE_SIZE)}
              className="rounded-lg px-2 py-1 text-slate-500 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              ›
            </button>
          </div>
          <div className="grid grid-cols-3 gap-1">
            {years.map((year) => (
              <button
                key={year}
                type="button"
                onClick={() => {
                  onChange(year);
                  close();
                }}
                className={cn(
                  "rounded-lg px-2 py-2 text-sm font-medium transition-colors",
                  year === selectedYear
                    ? "bg-blue-600 text-white dark:bg-blue-500"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                )}
              >
                {year}
              </button>
            ))}
          </div>
        </div>
      )}
    </PickerShell>
  );
}
