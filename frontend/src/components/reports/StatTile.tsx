import type { ReactNode } from "react";
import clsx from "clsx";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { VIZ, formatCompact } from "./vizTheme";
import { CountUp } from "@/components/common/CountUp";
import { Sparkline } from "@/components/common/Sparkline";

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
  /** Optional mini trend series shown top-right. */
  sparkline?: number[];
  /** Hex color for the sparkline stroke/fill. */
  sparkColor?: string;
}

export function StatTile({
  label,
  value,
  suffix,
  delta,
  deltaLabel,
  upIsGood = true,
  icon,
  iconClassName = "bg-primary-500/10 text-primary-600 dark:bg-primary-500/20 dark:text-primary-400",
  sparkline,
  sparkColor = VIZ.series1,
}: StatTileProps) {
  const deltaColor =
    delta == null || delta === 0 ? VIZ.inkMuted : (delta > 0) === upIsGood ? VIZ.deltaGood : VIZ.deltaBad;

  return (
    <div
      className={clsx(
        "group relative overflow-hidden rounded-2xl p-5 transition-all duration-300 glass-panel",
        "shadow-[0_1px_2px_rgb(0,0,0,0.04),0_8px_24px_-12px_rgb(0,0,0,0.12)]",
        "dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)]",
        "hover:-translate-y-1 hover:border-primary-200/50 hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)]",
        "dark:hover:border-primary-500/30 dark:hover:shadow-[0_20px_40px_rgb(0,0,0,0.4)]"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        {icon && (
          <span
            className={clsx(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-105",
              iconClassName
            )}
          >
            {icon}
          </span>
        )}
        {sparkline && sparkline.length > 1 && (
          <Sparkline data={sparkline} color={sparkColor} className="mt-0.5 opacity-90" />
        )}
      </div>

      <p className="mt-4 truncate text-[13px] font-medium text-slate-500 dark:text-slate-400">{label}</p>

      <p className="mt-1 text-[1.75rem] font-bold leading-none tracking-tight text-slate-900 tabular-nums dark:text-white">
        {typeof value === "number" ? (
          <CountUp value={value} format={(n) => formatCompact(Math.round(n))} />
        ) : (
          value
        )}
        {suffix && (
          <span className="ml-0.5 text-base font-semibold text-slate-400 dark:text-slate-500">{suffix}</span>
        )}
      </p>

      {delta !== undefined && (
        <p className="mt-2.5 flex items-center gap-1 text-xs font-medium" style={{ color: deltaColor }}>
          {delta != null &&
            delta !== 0 &&
            (delta > 0 ? (
              <ArrowUpRight size={13} strokeWidth={2.5} />
            ) : (
              <ArrowDownRight size={13} strokeWidth={2.5} />
            ))}
          {delta == null ? "no prior data" : `${delta > 0 ? "+" : ""}${delta}%`}
          {delta != null && deltaLabel && (
            <span className="font-normal text-slate-400 dark:text-slate-500"> {deltaLabel}</span>
          )}
        </p>
      )}
    </div>
  );
}
