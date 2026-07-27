import { VIZ } from "./vizTheme";

export interface HBarRow {
  label: string;
  value: number;
  /** Bar length as a fraction of the longest bar (0–1). */
  fraction: number;
  /** Text rendered at the bar end (e.g. "42 (12.5%)" or "3.2d"). */
  valueLabel: string;
}

/**
 * Horizontal bar list — single hue (magnitude comparison), thin marks, 4px rounded
 * data-end, labels in ink (never the series color), value direct-labeled at each
 * bar end since bars are few. Used for funnel, lost reasons, and time-in-stage.
 */
export function HBarList({ rows, color = VIZ.series1 }: { rows: HBarRow[]; color?: string }) {
  if (rows.length === 0) {
    return <p className="text-sm text-gray-400 dark:text-slate-500">No data in this range.</p>;
  }

  return (
    <div className="flex flex-col gap-2.5">
      {rows.map((row) => (
        <div key={row.label} className="grid grid-cols-[10rem_1fr] items-center gap-3" title={`${row.label}: ${row.valueLabel}`}>
          <span className="truncate text-right text-xs text-gray-600 dark:text-slate-400">{row.label}</span>
          <div className="flex items-center gap-2">
            <div className="h-4 flex-1 rounded-r bg-gray-100 dark:bg-slate-800/60" style={{ maxWidth: "100%" }}>
              <div
                className="h-4 rounded-r transition-[width] duration-300"
                style={{
                  width: `${Math.max(row.fraction * 100, row.value > 0 ? 1.5 : 0)}%`,
                  backgroundColor: color,
                }}
              />
            </div>
            <span className="w-24 shrink-0 text-xs tabular-nums text-gray-700 dark:text-slate-300">{row.valueLabel}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
