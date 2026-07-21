import { memo } from "react";
import { CountUp } from "../common/CountUp";
import { ACCENT } from "./DashboardPrimitives";

/* ── Win-rate ring — thin stroke, tick marks, one accent ────────────────── */

function ConversionRingImpl({ rate }: { rate: number }) {
  const r = 56;
  const c = 2 * Math.PI * r;
  const clamped = Math.min(100, Math.max(0, rate));
  const off = c * (1 - clamped / 100);
  return (
    <div className="relative mx-auto flex h-44 w-44 items-center justify-center">
      <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90">
        {/* tick marks every 10% */}
        {Array.from({ length: 10 }).map((_, i) => {
          const a = (i / 10) * 2 * Math.PI;
          const x1 = 70 + Math.cos(a) * 64;
          const y1 = 70 + Math.sin(a) * 64;
          const x2 = 70 + Math.cos(a) * 67;
          const y2 = 70 + Math.sin(a) * 67;
          return (
            <line
              key={i}
              x1={x1} y1={y1} x2={x2} y2={y2}
              className="stroke-slate-200 dark:stroke-white/10"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          );
        })}
        <circle cx="70" cy="70" r={r} fill="none" strokeWidth="5" className="stroke-slate-100 dark:stroke-white/[0.06]" />
        <circle
          cx="70" cy="70" r={r}
          fill="none"
          strokeWidth="5"
          stroke={ACCENT}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={off}
          style={{ transition: "stroke-dashoffset 1.4s cubic-bezier(0.16, 1, 0.3, 1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[34px] font-semibold leading-none tracking-[-0.02em] tabular-nums text-slate-900 dark:text-white">
          <CountUp value={rate} />
          <span className="text-[18px] text-slate-400 dark:text-slate-500">%</span>
        </span>
        <span className="mt-1.5 text-[11px] font-medium tracking-wide text-slate-400 dark:text-slate-500">
          of enquiries won
        </span>
      </div>
    </div>
  );
}

export const ConversionRing = memo(ConversionRingImpl);
