import { useMemo, useState } from "react";
import clsx from "clsx";
import { TrendingUp, Building2 } from "lucide-react";
import { Card, CardHeader } from "../common/Card";
import { Select } from "../common/Input";
import { DatePickerField } from "../common/DateTimePicker";
import { useBranchRollupReport } from "../../hooks/useReports";
import { HAIRLINE, Delta } from "./DashboardPrimitives";
import { BranchDrilldownModal } from "./BranchDrilldownModal";

const PERIOD_PRESETS = [
  { key: "thisMonth", label: "This month" },
  { key: "lastMonth", label: "Last month" },
  { key: "thisWeek", label: "This week" },
  { key: "lastWeek", label: "Last week" },
  { key: "custom", label: "Custom range" },
] as const;

type PresetKey = (typeof PERIOD_PRESETS)[number]["key"];

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function startOfWeek(d: Date): Date {
  const copy = new Date(d);
  const day = copy.getDay(); // 0 = Sunday
  const diff = (day + 6) % 7; // days since Monday
  copy.setDate(copy.getDate() - diff);
  return copy;
}

/** Resolves a preset key to concrete from/to calendar dates (yyyy-MM-dd), recomputed
 * fresh each render so "This month" always tracks today rather than freezing at mount. */
function resolvePreset(preset: PresetKey, customFrom: string, customTo: string): { from: string; to: string } {
  const now = new Date();
  switch (preset) {
    case "thisMonth":
      return { from: toIsoDate(new Date(now.getFullYear(), now.getMonth(), 1)), to: toIsoDate(now) };
    case "lastMonth": {
      const from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const to = new Date(now.getFullYear(), now.getMonth(), 0);
      return { from: toIsoDate(from), to: toIsoDate(to) };
    }
    case "thisWeek":
      return { from: toIsoDate(startOfWeek(now)), to: toIsoDate(now) };
    case "lastWeek": {
      const thisWeekStart = startOfWeek(now);
      const from = new Date(thisWeekStart);
      from.setDate(from.getDate() - 7);
      const to = new Date(thisWeekStart);
      to.setDate(to.getDate() - 1);
      return { from: toIsoDate(from), to: toIsoDate(to) };
    }
    case "custom":
      return { from: customFrom, to: customTo };
  }
}

function toReportFilters(range: { from: string; to: string }, branchId: string) {
  return {
    branchId: branchId || undefined,
    dateFrom: range.from ? new Date(range.from).toISOString() : undefined,
    dateTo: range.to ? new Date(`${range.to}T23:59:59.999`).toISOString() : undefined,
  };
}

/** Won/Lost/Closed-Temp/Pending split derived from the same statusCounts branch-rollup
 * already returns — Delivered is the only true "Won" (RETAIL_DONE is further back in the
 * pipeline and can still fall through to Lost/Closed Temp before delivery). */
function splitCounts(statusCounts: Record<string, number>, total: number) {
  const won = statusCounts["DELIVERED"] ?? 0;
  const lost = statusCounts["LOST"] ?? 0;
  const closedTemp = statusCounts["CLOSED_TEMP"] ?? 0;
  const pending = total - won - lost - closedTemp;
  const conversionRate = total > 0 ? Number(((won / total) * 100).toFixed(1)) : 0;
  return { total, won, lost, closedTemp, pending, conversionRate };
}

/** Plain signed difference (Period A minus Period B) — easier for a non-technical
 * dashboard viewer to read at a glance than a relative "% change" figure. */
function diff(a: number, b: number): number {
  return Number((a - b).toFixed(1));
}

function PeriodPicker({
  label,
  preset,
  setPreset,
  from,
  setFrom,
  to,
  setTo,
}: {
  label: string;
  preset: PresetKey;
  setPreset: (p: PresetKey) => void;
  from: string;
  setFrom: (v: string) => void;
  to: string;
  setTo: (v: string) => void;
}) {
  return (
    <div className="flex flex-1 flex-col gap-2 min-w-[220px]">
      <span className="text-[11px] font-medium uppercase tracking-[0.1em] text-slate-400 dark:text-slate-500">{label}</span>
      <div className="flex flex-wrap items-end gap-2">
        <Select value={preset} onChange={(e) => setPreset(e.target.value as PresetKey)} className="min-w-[140px]">
          {PERIOD_PRESETS.map((p) => (
            <option key={p.key} value={p.key}>
              {p.label}
            </option>
          ))}
        </Select>
        {preset === "custom" && (
          <>
            <DatePickerField label="From" value={from} onChange={(v) => setFrom(v ?? "")} />
            <DatePickerField label="To" value={to} onChange={(v) => setTo(v ?? "")} />
          </>
        )}
      </div>
    </div>
  );
}

export function SalesPerformancePanel({ branches }: { branches?: { id: string; name: string }[] }) {
  const [branchId, setBranchId] = useState("");

  // Off by default cost nothing here — comparison is opt-in, so a plain "how did this
  // month look" check isn't cluttered with a second period and vs/diff figures.
  const [compare, setCompare] = useState(false);

  const [presetA, setPresetA] = useState<PresetKey>("thisMonth");
  const [customFromA, setCustomFromA] = useState("");
  const [customToA, setCustomToA] = useState("");

  const [presetB, setPresetB] = useState<PresetKey>("lastMonth");
  const [customFromB, setCustomFromB] = useState("");
  const [customToB, setCustomToB] = useState("");

  const rangeA = useMemo(() => resolvePreset(presetA, customFromA, customToA), [presetA, customFromA, customToA]);
  const rangeB = useMemo(() => resolvePreset(presetB, customFromB, customToB), [presetB, customFromB, customToB]);

  const filtersA = useMemo(() => toReportFilters(rangeA, branchId), [rangeA, branchId]);
  const filtersB = useMemo(() => toReportFilters(rangeB, branchId), [rangeB, branchId]);

  const { data: rollupA, isLoading: loadingA } = useBranchRollupReport(filtersA);
  const { data: rollupB } = useBranchRollupReport(filtersB, compare);

  const [drilldown, setDrilldown] = useState<{ branchId: string; branchName: string } | null>(null);

  const rows = useMemo(() => {
    const mapA = new Map((rollupA ?? []).map((r) => [r.branchId, r]));
    const mapB = new Map((rollupB ?? []).map((r) => [r.branchId, r]));
    const branchIds = new Set([...mapA.keys(), ...mapB.keys()]);

    const built = [...branchIds].map((id) => {
      const a = mapA.get(id);
      const b = mapB.get(id);
      const metricsA = splitCounts(a?.statusCounts ?? {}, a?.total ?? 0);
      const metricsB = splitCounts(b?.statusCounts ?? {}, b?.total ?? 0);
      return {
        branchId: id,
        branchName: a?.branchName ?? b?.branchName ?? "Unknown",
        a: metricsA,
        b: metricsB,
      };
    });

    // Org-wide total row, summed straight from the per-branch metrics above.
    const totalA = built.reduce(
      (sum, r) => ({
        total: sum.total + r.a.total,
        won: sum.won + r.a.won,
        lost: sum.lost + r.a.lost,
        closedTemp: sum.closedTemp + r.a.closedTemp,
        pending: sum.pending + r.a.pending,
      }),
      { total: 0, won: 0, lost: 0, closedTemp: 0, pending: 0 }
    );
    const totalB = built.reduce(
      (sum, r) => ({
        total: sum.total + r.b.total,
        won: sum.won + r.b.won,
        lost: sum.lost + r.b.lost,
        closedTemp: sum.closedTemp + r.b.closedTemp,
        pending: sum.pending + r.b.pending,
      }),
      { total: 0, won: 0, lost: 0, closedTemp: 0, pending: 0 }
    );

    return {
      branches: built.sort((x, y) => y.a.total - x.a.total),
      total: {
        branchName: "All branches",
        a: { ...totalA, conversionRate: totalA.total > 0 ? Number(((totalA.won / totalA.total) * 100).toFixed(1)) : 0 },
        b: { ...totalB, conversionRate: totalB.total > 0 ? Number(((totalB.won / totalB.total) * 100).toFixed(1)) : 0 },
      },
    };
  }, [rollupA, rollupB]);

  // With comparison off, just the plain value for whichever single period is selected —
  // no second period to show "vs", so showing one anyway would be meaningless clutter.
  // upIsGood=false for Lost/Closed Temp/Pending — a rise there is bad news, so it should
  // color red even though the arrow still points up (more leads lost/stuck, not fewer).
  const metricCell = (value: number, compareTo: number, upIsGood = true, suffix = "") =>
    !compare ? (
      <td className="px-4 py-2.5 tabular-nums font-medium text-slate-900 dark:text-slate-100">
        {value}
        {suffix}
      </td>
    ) : (
      <td className="px-4 py-2.5 tabular-nums text-slate-700 dark:text-slate-300">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1 text-[13px]">
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {value}
              {suffix}
            </span>
            <span className="text-slate-400 dark:text-slate-500">vs</span>
            <span className="text-slate-500 dark:text-slate-400">
              {compareTo}
              {suffix}
            </span>
          </div>
          <Delta delta={diff(value, compareTo)} unit="" upIsGood={upIsGood} />
        </div>
      </td>
    );

  const conversionCell = (value: number, compareTo: number) =>
    !compare ? (
      <td className="px-4 py-2.5 tabular-nums font-medium text-slate-900 dark:text-slate-100">{value}%</td>
    ) : (
      <td className="px-4 py-2.5 tabular-nums text-slate-700 dark:text-slate-300">
        <div className="flex items-center gap-2">
          <span className="font-medium text-slate-900 dark:text-slate-100">{value}%</span>
          <Delta delta={diff(value, compareTo)} unit="" />
        </div>
      </td>
    );

  return (
    <Card className="flex flex-col gap-4">
      <CardHeader
        icon={<TrendingUp size={18} />}
        iconClassName="bg-primary-50 text-primary-600 dark:bg-primary-500/20 dark:text-primary-400"
        title="Sales Performance"
        subtitle="Branch-wise sales, conversion, closed and pending — compare any two periods"
      />

      <div className={clsx("flex flex-wrap items-end gap-4 border-b pb-4", HAIRLINE)}>
        {branches && branches.length > 1 && (
          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-medium uppercase tracking-[0.1em] text-slate-400 dark:text-slate-500">Branch</span>
            <Select value={branchId} onChange={(e) => setBranchId(e.target.value)} className="min-w-[160px]">
              <option value="">All branches</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </Select>
          </div>
        )}
        <PeriodPicker
          label={compare ? "Period A" : "Month / range"}
          preset={presetA}
          setPreset={setPresetA}
          from={customFromA}
          setFrom={setCustomFromA}
          to={customToA}
          setTo={setCustomToA}
        />

        <label className="flex cursor-pointer items-center gap-2 pb-2 text-[13px] font-medium text-slate-600 dark:text-slate-300">
          <input
            type="checkbox"
            checked={compare}
            onChange={(e) => setCompare(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500 dark:border-slate-600"
          />
          Compare with another period
        </label>

        {compare && (
          <PeriodPicker
            label="Period B (comparison)"
            preset={presetB}
            setPreset={setPresetB}
            from={customFromB}
            setFrom={setCustomFromB}
            to={customToB}
            setTo={setCustomToB}
          />
        )}
      </div>

      {loadingA ? (
        <p className="py-6 text-center text-sm text-slate-400 dark:text-slate-500">Loading…</p>
      ) : rows.branches.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-400 dark:text-slate-500">No enquiries in Period A.</p>
      ) : (
        <>
          {compare && (
            <p className="text-[12px] text-slate-400 dark:text-slate-500">
              Each cell shows <span className="font-medium text-slate-600 dark:text-slate-300">Period A vs Period B</span>, with the
              plain difference below.
            </p>
          )}
          <div className={clsx("overflow-x-auto rounded-xl border", HAIRLINE)}>
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-2.5">Branch</th>
                  <th className="px-4 py-2.5">Total</th>
                  <th className="px-4 py-2.5">Won</th>
                  <th className="px-4 py-2.5">Lost</th>
                  <th className="px-4 py-2.5">Closed Temp</th>
                  <th className="px-4 py-2.5">Pending</th>
                  <th className="px-4 py-2.5">Conversion %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                <tr className="bg-slate-50/60 font-medium dark:bg-white/[0.02]">
                  <td className="px-4 py-2.5 text-slate-900 dark:text-slate-100">
                    <button
                      type="button"
                      onClick={() => setDrilldown({ branchId, branchName: "All branches" })}
                      className="flex items-center gap-1.5 underline decoration-dotted underline-offset-2 hover:text-primary-600 dark:hover:text-primary-400"
                    >
                      <Building2 size={13} className="text-slate-400" />
                      {rows.total.branchName}
                    </button>
                  </td>
                  {metricCell(rows.total.a.total, rows.total.b.total)}
                  {metricCell(rows.total.a.won, rows.total.b.won)}
                  {metricCell(rows.total.a.lost, rows.total.b.lost, false)}
                  {metricCell(rows.total.a.closedTemp, rows.total.b.closedTemp, false)}
                  {metricCell(rows.total.a.pending, rows.total.b.pending, false)}
                  {conversionCell(rows.total.a.conversionRate, rows.total.b.conversionRate)}
                </tr>
                {rows.branches.map((row) => (
                  <tr key={row.branchId} className="transition-colors hover:bg-primary-50/60 dark:hover:bg-primary-500/[0.06]">
                    <td className="px-4 py-2.5 font-medium text-slate-900 dark:text-slate-100">
                      <button
                        type="button"
                        onClick={() => setDrilldown({ branchId: row.branchId, branchName: row.branchName })}
                        className="underline decoration-dotted underline-offset-2 hover:text-primary-600 dark:hover:text-primary-400"
                      >
                        {row.branchName}
                      </button>
                    </td>
                    {metricCell(row.a.total, row.b.total)}
                    {metricCell(row.a.won, row.b.won)}
                    {metricCell(row.a.lost, row.b.lost, false)}
                    {metricCell(row.a.closedTemp, row.b.closedTemp, false)}
                    {metricCell(row.a.pending, row.b.pending, false)}
                    {conversionCell(row.a.conversionRate, row.b.conversionRate)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {drilldown && (
        <BranchDrilldownModal
          isOpen={!!drilldown}
          onClose={() => setDrilldown(null)}
          branchId={drilldown.branchId}
          branchName={drilldown.branchName}
          baseFilters={{ dateFrom: filtersA.dateFrom, dateTo: filtersA.dateTo }}
        />
      )}
    </Card>
  );
}
