import { VIZ, CATEGORICAL } from "./vizTheme";

export interface DonutSlice {
  label: string;
  value: number;
  /** Formatted value shown in the legend (e.g. "142" or "23%"). */
  valueLabel: string;
}

const SIZE = 180;
const STROKE = 26;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
// 2px surface gap between segments — the spacer rule from the dataviz marks spec.
const GAP = 2;

/**
 * Part-to-whole donut for the Chart Builder. Categorical hues assigned by fixed slot
 * order (never cycled); a legend carries every label + value so identity is never
 * color-alone — this is the "relief" for the sub-3:1 categorical slots. Only valid for
 * measures that sum to a meaningful whole (counts), not rates.
 */
export function DonutChart({ slices }: { slices: DonutSlice[] }) {
  const total = slices.reduce((sum, s) => sum + s.value, 0);

  if (slices.length === 0 || total === 0) {
    return <p className="text-sm text-gray-400">No data in this range.</p>;
  }

  let offset = 0;
  const arcs = slices.map((slice, i) => {
    const fraction = slice.value / total;
    const len = Math.max(fraction * CIRCUMFERENCE - GAP, 0);
    const arc = {
      slice,
      color: CATEGORICAL.light[i % CATEGORICAL.light.length],
      dash: `${len} ${CIRCUMFERENCE - len}`,
      // Negative offset walks clockwise from 12 o'clock.
      dashOffset: -offset,
      percent: Math.round(fraction * 100),
    };
    offset += fraction * CIRCUMFERENCE;
    return arc;
  });

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:justify-center sm:gap-8">
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="shrink-0" role="img" aria-label="Breakdown donut chart">
        <g transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}>
          {arcs.map((arc) => (
            <circle
              key={arc.slice.label}
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              fill="none"
              stroke={arc.color}
              strokeWidth={STROKE}
              strokeDasharray={arc.dash}
              strokeDashoffset={arc.dashOffset}
            >
              <title>{`${arc.slice.label}: ${arc.slice.valueLabel} (${arc.percent}%)`}</title>
            </circle>
          ))}
        </g>
        <text
          x="50%"
          y="47%"
          textAnchor="middle"
          className="tabular-nums"
          style={{ fontSize: 22, fontWeight: 700, fill: VIZ.inkPrimary }}
        >
          {total.toLocaleString()}
        </text>
        <text x="50%" y="60%" textAnchor="middle" style={{ fontSize: 11, fill: VIZ.inkMuted }}>
          Total
        </text>
      </svg>

      <ul className="flex w-full max-w-xs flex-col gap-1.5 sm:w-auto">
        {arcs.map((arc) => (
          <li key={arc.slice.label} className="flex items-center gap-2 text-xs">
            <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: arc.color }} />
            <span className="flex-1 truncate text-gray-700" title={arc.slice.label}>
              {arc.slice.label}
            </span>
            <span className="shrink-0 tabular-nums text-gray-500">
              {arc.slice.valueLabel} · {arc.percent}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
