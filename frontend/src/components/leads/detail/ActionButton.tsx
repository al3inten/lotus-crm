import type { ReactNode } from "react";
import clsx from "clsx";

export const ACTION_TONES = {
  default: "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white",
  call: "text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-500/10",
  whatsapp: "text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-500/10",
  primary: "bg-blue-600 text-white shadow-sm shadow-blue-600/25 hover:bg-blue-500",
} as const;

export function ActionButton({
  icon,
  label,
  onClick,
  href,
  external,
  tone = "default",
  disabled,
}: {
  icon: ReactNode;
  label: string;
  onClick?: () => void;
  href?: string;
  external?: boolean;
  tone?: keyof typeof ACTION_TONES;
  disabled?: boolean;
}) {
  const cls = clsx(
    "inline-flex h-11 min-w-11 items-center justify-center gap-1.5 rounded-xl px-3 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50",
    ACTION_TONES[tone],
    disabled && "pointer-events-none opacity-40"
  );
  const inner = (
    <>
      {icon}
      <span className="hidden md:inline">{label}</span>
    </>
  );
  if (href && !disabled) {
    return (
      <a href={href} aria-label={label} className={cls} {...(external ? { target: "_blank", rel: "noreferrer" } : {})}>
        {inner}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} aria-label={label} disabled={disabled} className={cls}>
      {inner}
    </button>
  );
}
