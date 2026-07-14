import clsx from "clsx";
import { scoreTier } from "./leadUtils";

export function ScoreRing({ score }: { score: number }) {
  const r = 34;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - score / 100);
  const tier = scoreTier(score);
  const gradId = "leadScoreGrad";
  return (
    <div className="relative h-16 w-16 shrink-0">
      <div
        className="pointer-events-none absolute inset-1 animate-pulse rounded-full blur-xl"
        style={{ backgroundColor: tier.glow, animationDuration: "3s" }}
      />
      <svg viewBox="0 0 80 80" className="relative h-16 w-16 -rotate-90" aria-hidden>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={tier.stops[0]} />
            <stop offset="100%" stopColor={tier.stops[1]} />
          </linearGradient>
        </defs>
        <circle cx="40" cy="40" r={r} fill="none" strokeWidth="7" className="stroke-slate-200 dark:stroke-slate-700" />
        <circle
          cx="40"
          cy="40"
          r={r}
          fill="none"
          strokeWidth="7"
          stroke={`url(#${gradId})`}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: "stroke-dashoffset 0.8s cubic-bezier(0.22, 1, 0.36, 1)",
            filter: `drop-shadow(0 0 5px ${tier.glow})`,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={clsx("bg-gradient-to-br bg-clip-text text-lg font-extrabold tabular-nums text-transparent", tier.text)}>{score}</span>
        <span className="text-[9px] font-semibold uppercase tracking-widest text-slate-400">score</span>
      </div>
    </div>
  );
}
