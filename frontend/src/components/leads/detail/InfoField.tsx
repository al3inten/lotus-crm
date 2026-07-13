import type { ReactNode } from "react";

export function InfoField({ icon, label, value, className }: { icon: ReactNode; label: string; value?: ReactNode; className?: string }) {
  return (
    <div className={className}>
      <p className="mb-1 flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
        {icon}
        {label}
      </p>
      <p className="text-sm font-semibold text-slate-900 dark:text-white">{value ?? "—"}</p>
    </div>
  );
}
