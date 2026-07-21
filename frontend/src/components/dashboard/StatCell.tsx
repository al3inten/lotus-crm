import { memo, type ReactNode } from "react";
import { CountUp } from "../common/CountUp";
import { Sparkline } from "../common/Sparkline";
import { ACCENT, Delta } from "./DashboardPrimitives";

/* ── Signature element: one continuous stat ledger ──────────────────────
   Instead of four floating cards, a single surface divided by hairlines —
   the way Stripe and Vercel present headline metrics. Sparklines sit as
   quiet baselines under each number.                                       */

function StatCellImpl({
  label, value, suffix, icon, series, delta, upIsGood = true,
}: {
  label: string;
  value: number;
  suffix?: string;
  icon: ReactNode;
  series?: number[];
  delta?: number | null;
  upIsGood?: boolean;
}) {
  return (
    <div className="group relative flex flex-col gap-4 p-5 lg:p-6 transition-colors hover:bg-slate-50/60 dark:hover:bg-white/[0.02]">
      <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500">
        <span className="[&>svg]:h-[15px] [&>svg]:w-[15px]">{icon}</span>
        <span className="text-[12px] font-medium text-slate-500 dark:text-slate-400">{label}</span>
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[28px] font-semibold leading-none tracking-[-0.02em] text-slate-900 tabular-nums dark:text-white">
          <CountUp value={value} />
          {suffix}
        </span>
        <Delta delta={delta} upIsGood={upIsGood} />
      </div>

      {series && series.length > 1 ? (
        <div className="h-6 opacity-40 transition-opacity duration-300 group-hover:opacity-90">
          <Sparkline data={series} color={ACCENT} width={140} height={24} className="w-full" />
        </div>
      ) : (
        <div className="h-6" />
      )}
    </div>
  );
}

export const StatCell = memo(StatCellImpl);
