import type { ReactNode } from "react";
import clsx from "clsx";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { VIZ, formatCompact } from "./vizTheme";

interface StatTileProps {
  label: string;
  value: number | string;
  suffix?: string;
  /** Signed % change vs the named period; null when there's no base period to compare against. */
  delta?: number | null;
  deltaLabel?: string;
  /** Whether an increase is good (sales up = good; lost up = bad). Drives delta color. */
  upIsGood?: boolean;
  /** Optional lucide icon rendered in a tinted badge. */
  icon?: ReactNode;
  iconClassName?: string;
}

export function StatTile({
  label,
  value,
  suffix,
  delta,
  deltaLabel,
  upIsGood = true,
  icon,
  iconClassName = "bg-blue-50 text-blue-600",
}: StatTileProps) {
  const deltaColor =
    delta == null || delta === 0 ? VIZ.inkMuted : (delta > 0) === upIsGood ? VIZ.deltaGood : VIZ.deltaBad;

  return (
    <div className={clsx(
      "relative overflow-hidden rounded-2xl bg-white p-5 transition-all duration-300",
      "border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]",
      "dark:border-slate-800 dark:bg-slate-900 dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)]",
      "hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-0.5 dark:hover:shadow-[0_8px_30px_rgb(0,0,0,0.3)]"
    )}>
      <div className="flex items-start gap-3">
        {icon && (
          <span
            className={clsx(
              "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
              iconClassName
            )}
          >
            {icon}
          </span>
        )}
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-1 text-[1.65rem] font-bold leading-none tracking-tighter text-slate-900 tabular-nums dark:text-white">
            {typeof value === "number" ? formatCompact(value) : value}
            {suffix && <span className="ml-0.5 text-base font-semibold text-slate-500 dark:text-slate-400">{suffix}</span>}
          </p>
          {delta !== undefined && (
            <p className="mt-2 flex items-center gap-1 text-xs font-medium" style={{ color: deltaColor }}>
              {delta != null &&
                delta !== 0 &&
                (delta > 0 ? <ArrowUpRight size={12} strokeWidth={2.5} /> : <ArrowDownRight size={12} strokeWidth={2.5} />)}
              {delta == null ? "no prior data" : `${delta > 0 ? "+" : ""}${delta}%`}
              {delta != null && deltaLabel && <span className="font-normal text-slate-400 dark:text-slate-500"> {deltaLabel}</span>}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
