import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Calendar } from "lucide-react";
import clsx from "clsx";
import { FieldWrapper } from "./Input";

interface DateTimePickerProps {
  label?: string;
  error?: string;
  value?: string;
  onChange: (value: string | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function DateTimePicker({ label, error, value, onChange, placeholder, disabled }: DateTimePickerProps) {
  const selected = value ? new Date(value) : null;

  return (
    <FieldWrapper label={label} error={error}>
      <DatePicker
        selected={selected}
        onChange={(date: Date | null) => onChange(date ? date.toISOString() : undefined)}
        showTimeSelect
        timeIntervals={15}
        dateFormat="dd-MM-yyyy h:mm aa"
        placeholderText={placeholder ?? "dd-mm-yyyy --:--"}
        disabled={disabled}
        isClearable
        showIcon
        icon={<Calendar size={15} />}
        toggleCalendarOnIconClick
        wrapperClassName="w-full"
        className={clsx(
          "w-full rounded-md border px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500",
          error ? "border-red-400" : "border-gray-300"
        )}
      />
    </FieldWrapper>
  );
}
