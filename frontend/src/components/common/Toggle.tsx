import clsx from "clsx";

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
}

export function Toggle({ checked, onChange, label, description, disabled }: ToggleProps) {
  return (
    <label className={clsx("flex items-center justify-between gap-3", disabled ? "opacity-50" : "cursor-pointer")}>
      {(label || description) && (
        <span className="min-w-0">
          {label && <span className="block text-sm font-medium text-gray-800">{label}</span>}
          {description && <span className="block text-xs text-gray-500">{description}</span>}
        </span>
      )}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={clsx(
          "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1",
          checked ? "bg-blue-600" : "bg-gray-300"
        )}
      >
        <span
          className={clsx(
            "inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-6" : "translate-x-1"
          )}
          style={{ height: 18, width: 18 }}
        />
      </button>
    </label>
  );
}
