import type { ReactNode } from "react";

export function MetaPill({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-slate-700/60 dark:text-slate-300">
      {icon}
      {children}
    </span>
  );
}
