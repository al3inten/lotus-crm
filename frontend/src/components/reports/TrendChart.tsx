import { motion } from "framer-motion";
import { VIZ } from "./vizTheme";
import type { TrendPoint } from "../../api/reports.api";

// Categorical slots validated via the dataviz palette validator (blue/aqua/red pass;
// aqua is sub-3:1 on the light surface, so the endpoint is direct-labeled and every
// value is reachable via each bar group's tooltip — the relief rule).
const SERIES = [
  { key: "total" as const, label: "Total Enquiries", color: VIZ.series1 },
  { key: "converted" as const, label: "Converted", color: VIZ.series2 },
  { key: "lost" as const, label: "Lost", color: VIZ.series6 },
];

function formatBucket(bucket: string) {
  const d = new Date(bucket);
  return d.toLocaleDateString(undefined, { month: "short", day: "2-digit" });
}

export function TrendChart({ points }: { points: TrendPoint[] }) {
  if (points.length === 0) {
    return <p className="text-sm text-slate-400">No data in this range.</p>;
  }

  const max = Math.max(1, ...points.map((p) => p.total));
  const chartHeight = 180;
  const lastPoint = points[points.length - 1];
  const reduce =
    typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  return (
    <div>
      <div className="mb-3 flex gap-4 text-xs" style={{ color: VIZ.inkSecondary }}>
        {SERIES.map((s) => (
          <span key={s.key} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: s.color }} />
            {s.label}
          </span>
        ))}
      </div>
      <div className="flex items-end gap-3 overflow-x-auto pb-1" style={{ minHeight: chartHeight + 24 }}>
        {points.map((point, idx) => {
          const isLast = point === lastPoint;
          return (
            <div
              key={point.bucket}
              className="group flex flex-col items-center gap-1 rounded-lg px-1 pt-1 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40"
              style={{ minWidth: 52 }}
              title={`${formatBucket(point.bucket)} — Total: ${point.total}, Converted: ${point.converted}, Lost: ${point.lost}`}
            >
              {isLast && (
                <span className="text-[10px] font-medium tabular-nums" style={{ color: VIZ.inkSecondary }}>
                  {point.total}
                </span>
              )}
              <div className="flex items-end gap-0.5" style={{ height: chartHeight }}>
                {SERIES.map((s) => {
                  const value = point[s.key];
                  const height = Math.round((value / max) * chartHeight);
                  return (
                    <motion.div
                      key={s.key}
                      initial={reduce ? false : { scaleY: 0 }}
                      animate={{ scaleY: 1 }}
                      transition={{ duration: 0.5, delay: idx * 0.03, ease: [0.22, 1, 0.36, 1] }}
                      style={{
                        height: Math.max(height, value > 0 ? 2 : 0),
                        backgroundColor: s.color,
                        width: 12,
                        borderRadius: "4px 4px 0 0",
                        transformOrigin: "bottom",
                      }}
                    />
                  );
                })}
              </div>
              <span className="text-[10px]" style={{ color: VIZ.inkMuted }}>
                {formatBucket(point.bucket)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
