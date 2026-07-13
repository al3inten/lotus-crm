export function scoreColor(score: number): string {
  if (score >= 70) return "#059669";
  if (score >= 45) return "#2563eb";
  if (score >= 25) return "#d97706";
  return "#dc2626";
}

export function ScoreRing({ score }: { score: number }) {
  const r = 34;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - score / 100);
  return (
    <div className="relative h-24 w-24 shrink-0">
      <svg viewBox="0 0 80 80" className="h-24 w-24 -rotate-90" aria-hidden>
        <circle cx="40" cy="40" r={r} fill="none" strokeWidth="7" className="stroke-slate-200 dark:stroke-slate-700" />
        <circle
          cx="40"
          cy="40"
          r={r}
          fill="none"
          strokeWidth="7"
          stroke={scoreColor(score)}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(0.22, 1, 0.36, 1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold tabular-nums text-slate-900 dark:text-white">{score}</span>
        <span className="text-[10px] font-medium uppercase tracking-wide text-slate-400">score</span>
      </div>
    </div>
  );
}
