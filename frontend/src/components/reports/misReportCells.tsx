import clsx from "clsx";
import type { MisPeriodCounts } from "../../api/reports.api";

/** Green/red %Gr chip matching the source MIS sheet's conditional formatting. */
export function GrowthCell({ value }: { value: number | null }) {
  if (value == null) return <td className="border-b border-slate-100 px-3 py-2 text-center text-slate-300 dark:border-slate-800/80 dark:text-slate-600">—</td>;
  const positive = value >= 0;
  return (
    <td
      className={clsx(
        "border-b border-slate-100 px-3 py-2 text-center text-xs font-semibold tabular-nums dark:border-slate-800/80",
        positive ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400" : "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400"
      )}
    >
      {positive ? "+" : ""}
      {value}%
    </td>
  );
}

export function NumCell({ value, bold = false }: { value: number; bold?: boolean }) {
  return (
    <td
      className={clsx(
        "border-b border-slate-100 px-3 py-2 text-center tabular-nums text-slate-700 dark:border-slate-800/80 dark:text-slate-300",
        bold && "font-semibold text-slate-900 dark:text-slate-100"
      )}
    >
      {value}
    </td>
  );
}

export function PctCell({ value }: { value: number }) {
  return (
    <td className="border-b border-slate-100 px-3 py-2 text-center tabular-nums text-slate-700 dark:border-slate-800/80 dark:text-slate-300">
      {value}%
    </td>
  );
}

/** Target-achievement %, color-banded so a manager can scan for shortfalls without reading
 * every number: on/above target reads green, close (75-99%) amber, well short reads red. */
export function AchievementCell({ value, bold = false }: { value: number; bold?: boolean }) {
  const tone =
    value >= 100
      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
      : value >= 75
        ? "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
        : "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400";
  return (
    <td className={clsx("border-b border-slate-100 px-3 py-2 text-center text-xs tabular-nums dark:border-slate-800/80", tone, bold && "font-bold")}>
      {value}%
    </td>
  );
}

/** The recurring 5-column group: CY, LY, LM, %LY, %LM. */
export function PeriodCells({ counts }: { counts: MisPeriodCounts }) {
  return (
    <>
      <NumCell value={counts.cy} bold />
      <NumCell value={counts.ly} />
      <NumCell value={counts.lm} />
      <GrowthCell value={counts.growthLY} />
      <GrowthCell value={counts.growthLM} />
    </>
  );
}

/** Tinted section header used to visually separate column groups (Enquiries/Booking/Retail/…)
 * across a wide MIS table — same palette as the rest of the app's colored icon badges. */
export const GROUP_TINTS = {
  slate: "bg-slate-50 text-slate-500 dark:bg-slate-800/60 dark:text-slate-400",
  primary: "bg-primary-50 text-primary-700 dark:bg-primary-500/10 dark:text-primary-300",
  emerald: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
  violet: "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300",
  amber: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
  cyan: "bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-300",
} as const;

export function GroupHeader({ tint, children, colSpan }: { tint: keyof typeof GROUP_TINTS; children: React.ReactNode; colSpan: number }) {
  return (
    <th colSpan={colSpan} className={clsx("border-b border-slate-100 px-3 py-2 text-center text-[11px] font-bold uppercase tracking-wider dark:border-slate-800", GROUP_TINTS[tint])}>
      {children}
    </th>
  );
}
