import type { ReactNode } from "react";
import clsx from "clsx";

export const ACTION_TONES = {
  default:
    "bg-slate-100 text-slate-700 hover:bg-slate-200/80 dark:bg-white/[0.06] dark:text-slate-200 dark:hover:bg-white/[0.12]",
  call: "bg-blue-100/70 text-blue-700 hover:bg-blue-100 dark:bg-blue-500/15 dark:text-blue-300 dark:hover:bg-blue-500/25",
  whatsapp:
    "bg-emerald-100/70 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-300 dark:hover:bg-emerald-500/25",
  primary:
    "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm shadow-blue-600/25 ring-1 ring-inset ring-white/25 hover:from-blue-500 hover:to-indigo-500",
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
    "inline-flex h-9 min-w-9 items-center justify-center gap-1.5 rounded-full px-3.5 text-sm font-semibold backdrop-blur-sm shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md active:scale-95 active:translate-y-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50",
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
