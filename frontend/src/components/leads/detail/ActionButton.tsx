import type { ReactNode } from "react";
import clsx from "clsx";

export const ACTION_TONES = {
  default: "bg-slate-50 text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700",
  call: "bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500/20",
  whatsapp: "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20",
  primary: "bg-[#a5b4fc] text-white hover:bg-[#818cf8] dark:bg-indigo-500 dark:hover:bg-indigo-400 shadow-sm shadow-[#a5b4fc]/30",
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
    "inline-flex h-9 min-w-9 items-center justify-center gap-1.5 rounded-full px-3.5 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50",
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
