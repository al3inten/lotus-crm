import clsx from "clsx";

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
}

export function Switch({ checked, onChange, label, description, disabled }: SwitchProps) {
  return (
    <div
      className={clsx(
        "flex items-center justify-between gap-4 rounded-xl border px-4 py-3 transition-colors",
        checked
          ? "border-primary-200 bg-primary-50/60 dark:border-primary-500/30 dark:bg-primary-500/10"
          : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-950",
        disabled && "opacity-60"
      )}
    >
      {(label || description) && (
        <span className="flex flex-col">
          {label && <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{label}</span>}
          {description && <span className="text-xs text-slate-400 dark:text-slate-500">{description}</span>}
        </span>
      )}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={clsx(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50 disabled:cursor-not-allowed",
          checked ? "bg-primary-600" : "bg-slate-300 dark:bg-slate-600"
        )}
      >
        <span
          className={clsx(
            "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform",
            checked && "translate-x-5"
          )}
        />
      </button>
    </div>
  );
}
