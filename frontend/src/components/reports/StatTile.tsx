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
}

export function StatTile({ label, value, suffix, delta, deltaLabel, upIsGood = true }: StatTileProps) {
  const deltaColor =
    delta == null || delta === 0 ? VIZ.inkMuted : (delta > 0) === upIsGood ? VIZ.deltaGood : VIZ.deltaBad;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-gray-900">
        {typeof value === "number" ? formatCompact(value) : value}
        {suffix && <span className="ml-0.5 text-base font-medium text-gray-500">{suffix}</span>}
      </p>
      {delta !== undefined && (
        <p className="mt-1 text-xs" style={{ color: deltaColor }}>
          {delta == null ? "no prior data" : `${delta > 0 ? "+" : ""}${delta}%`}
          {delta != null && deltaLabel && <span className="text-gray-400"> {deltaLabel}</span>}
        </p>
      )}
    </div>
  );
}
