export interface StackedBarSegment {
  key: string;
  label: string;
  value: number;
  color: string;
}

export interface StackedBarRow {
  label: string;
  total: number;
  segments: StackedBarSegment[];
}

export interface StackedLegendItem {
  key: string;
  label: string;
  color: string;
}

/**
 * Horizontal stacked bar list — one row per primary-dimension value, each bar divided
 * into colored segments for the secondary ("split by") dimension. Bar length is scaled
 * against the largest row total so rows stay comparable at a glance; segment widths
 * within a bar are proportional to that segment's share of the row.
 */
export function StackedHBarList({ rows, legend }: { rows: StackedBarRow[]; legend: StackedLegendItem[] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-gray-400 dark:text-slate-500">No data in this range.</p>;
  }

  const maxTotal = Math.max(1, ...rows.map((r) => r.total));

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-x-4 gap-y-1.5">
        {legend.map((item) => (
          <span key={item.key} className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-slate-400">
            <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: item.color }} />
            {item.label}
          </span>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        {rows.map((row) => (
          <div key={row.label} className="grid grid-cols-[10rem_1fr_3.5rem] items-center gap-3">
            <span className="truncate text-right text-xs text-gray-600 dark:text-slate-400" title={row.label}>
              {row.label}
            </span>
            <div className="flex h-4 flex-1 overflow-hidden rounded-r bg-gray-100 dark:bg-slate-800/60" style={{ maxWidth: "100%" }}>
              {row.segments.map(
                (seg) =>
                  seg.value > 0 && (
                    <div
                      key={seg.key}
                      title={`${seg.label}: ${seg.value.toLocaleString()}`}
                      style={{
                        width: `${(seg.value / maxTotal) * 100}%`,
                        backgroundColor: seg.color,
                      }}
                    />
                  )
              )}
            </div>
            <span className="shrink-0 text-xs tabular-nums text-gray-700 dark:text-slate-300">{row.total.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
