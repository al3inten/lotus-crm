import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Calendar, Clock } from "lucide-react";
import clsx from "clsx";
import { format, parse } from "date-fns";
import { FieldWrapper } from "./Input";

/** Shared input styling so every picker matches the app's other form fields
 * (rounded, theme-aware) instead of react-datepicker's default look. */
const inputClass = (error?: string) =>
  clsx(
    "w-full rounded-xl border bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/15 disabled:cursor-not-allowed disabled:bg-slate-50 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500 dark:disabled:bg-slate-800/50",
    error ? "border-red-400 dark:border-red-500/60" : "border-slate-200 dark:border-slate-700"
  );

interface BaseProps {
  label?: string;
  error?: string;
  value?: string;
  onChange: (value: string | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
}

/** Date + time (12-hour, AM/PM). Value is an ISO string. */
export function DateTimePicker({ label, error, value, onChange, placeholder, disabled }: BaseProps) {
  const selected = value ? new Date(value) : null;
  return (
    <FieldWrapper label={label} error={error}>
      <DatePicker
        selected={selected}
        onChange={(date: Date | null) => onChange(date ? date.toISOString() : undefined)}
        showTimeSelect
        timeIntervals={15}
        timeCaption="Time"
        dateFormat="dd-MM-yyyy h:mm aa"
        placeholderText={placeholder ?? "dd-mm-yyyy --:--"}
        disabled={disabled}
        isClearable
        showIcon
        icon={<Calendar size={15} />}
        toggleCalendarOnIconClick
        showPopperArrow={false}
        wrapperClassName="w-full"
        calendarClassName="lotus-datepicker"
        popperClassName="lotus-datepicker-popper"
        className={inputClass(error)}
      />
    </FieldWrapper>
  );
}

/** Date only (no time). Value is a `yyyy-MM-dd` string. */
export function DatePickerField({ label, error, value, onChange, placeholder, disabled }: BaseProps) {
  const selected = value ? parse(value, "yyyy-MM-dd", new Date()) : null;
  return (
    <FieldWrapper label={label} error={error}>
      <DatePicker
        selected={selected}
        onChange={(date: Date | null) => onChange(date ? format(date, "yyyy-MM-dd") : undefined)}
        dateFormat="dd-MM-yyyy"
        placeholderText={placeholder ?? "dd-mm-yyyy"}
        disabled={disabled}
        isClearable
        showIcon
        icon={<Calendar size={15} />}
        toggleCalendarOnIconClick
        showPopperArrow={false}
        wrapperClassName="w-full"
        calendarClassName="lotus-datepicker"
        popperClassName="lotus-datepicker-popper"
        className={inputClass(error)}
      />
    </FieldWrapper>
  );
}

/** Time only, 12-hour (AM/PM). Value is a `HH:mm` (24h) string for storage. */
export function TimePicker({ label, error, value, onChange, placeholder, disabled }: BaseProps) {
  const selected = value ? parse(value, "HH:mm", new Date()) : null;
  return (
    <FieldWrapper label={label} error={error}>
      <DatePicker
        selected={selected}
        onChange={(date: Date | null) => onChange(date ? format(date, "HH:mm") : undefined)}
        showTimeSelect
        showTimeSelectOnly
        timeIntervals={15}
        timeCaption="Time"
        dateFormat="h:mm aa"
        placeholderText={placeholder ?? "--:-- --"}
        disabled={disabled}
        isClearable
        showIcon
        icon={<Clock size={15} />}
        toggleCalendarOnIconClick
        showPopperArrow={false}
        wrapperClassName="w-full"
        popperClassName="lotus-datepicker-popper"
        className={inputClass(error)}
      />
    </FieldWrapper>
  );
}

interface YearPickerProps {
  label?: string;
  error?: string;
  value?: number | string;
  onChange: (value: number | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
}

/** Year only — calendar shows a grid of years. Value/onChange are the year number. */
export function YearPicker({ label, error, value, onChange, placeholder, disabled }: YearPickerProps) {
  const selected = value ? new Date(Number(value), 0, 1) : null;
  return (
    <FieldWrapper label={label} error={error}>
      <DatePicker
        selected={selected}
        onChange={(date: Date | null) => onChange(date ? date.getFullYear() : undefined)}
        showYearPicker
        dateFormat="yyyy"
        placeholderText={placeholder ?? "yyyy"}
        disabled={disabled}
        isClearable
        showIcon
        icon={<Calendar size={15} />}
        toggleCalendarOnIconClick
        showPopperArrow={false}
        wrapperClassName="w-full"
        calendarClassName="lotus-datepicker"
        popperClassName="lotus-datepicker-popper"
        className={inputClass(error)}
      />
    </FieldWrapper>
  );
}
