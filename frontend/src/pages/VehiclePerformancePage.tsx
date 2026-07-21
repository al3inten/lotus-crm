import { useMemo, useState } from "react";
import { Car, Star, Percent, ClipboardList } from "lucide-react";
import { useBranches } from "../hooks/useBranches";
import { useVehiclePerformanceReport } from "../hooks/useReports";
import { StatTile } from "../components/reports/StatTile";
import { Select } from "../components/common/Input";
import type { VehiclePerformanceRow } from "../api/reports.api";

const DATE_PRESETS = [
  { key: "30d", label: "Last 30 days", days: 30 },
  { key: "90d", label: "Last 90 days", days: 90 },
  { key: "ytd", label: "This year", days: null },
  { key: "all", label: "All time", days: -1 },
] as const;

type PresetKey = (typeof DATE_PRESETS)[number]["key"];

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <h2 className="text-sm font-semibold text-gray-900 dark:text-slate-100">{title}</h2>
      {subtitle && <p className="mb-3 text-xs text-gray-500 dark:text-slate-400">{subtitle}</p>}
      {!subtitle && <div className="mb-3" />}
      {children}
    </div>
  );
}

function RatingCell({ rating }: { rating: number | null }) {
  if (rating == null) return <span className="text-slate-300 dark:text-slate-600">—</span>;
  return (
    <span className="inline-flex items-center gap-1 font-medium text-amber-600 dark:text-amber-400">
      <Star size={12} className="fill-current" />
      {rating.toFixed(1)}
    </span>
  );
}

function ConversionBar({ percent }: { percent: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div
          className="h-full rounded-full bg-blue-500"
          style={{ width: `${Math.min(100, percent)}%` }}
        />
      </div>
      <span className="tabular-nums text-slate-700 dark:text-slate-300">{percent}%</span>
    </div>
  );
}

/** "Model mix" report — which vehicles actually sell vs. which just attract enquiries,
 * with test-drive and quotation activity joined in so a manager can spot gaps like
 * "high interest, low conversion" per model. */
export function VehiclePerformancePage() {
  const [preset, setPreset] = useState<PresetKey>("ytd");
  const [branchId, setBranchId] = useState<string>("");

  const filters = useMemo(() => {
    const base: { branchId?: string; dateFrom?: string } = { branchId: branchId || undefined };
    const now = new Date();
    const presetDef = DATE_PRESETS.find((p) => p.key === preset)!;
    if (presetDef.key === "ytd") {
      base.dateFrom = new Date(now.getFullYear(), 0, 1).toISOString();
    } else if (presetDef.days !== null && presetDef.days > 0) {
      base.dateFrom = new Date(now.getTime() - presetDef.days * 24 * 3600 * 1000).toISOString();
    }
    return base;
  }, [preset, branchId]);

  const { data: branches } = useBranches();
  const { data: rows, isLoading } = useVehiclePerformanceReport(filters);

  const totals = useMemo(() => {
    const list = rows ?? [];
    const enquiries = list.reduce((s, r) => s + r.enquiries, 0);
    const booked = list.reduce((s, r) => s + r.booked, 0);
    const testDrives = list.reduce((s, r) => s + r.testDrives, 0);
    const ratedDrives = list.filter((r) => r.avgTestDriveRating != null);
    const avgRating =
      ratedDrives.length > 0
        ? ratedDrives.reduce((s, r) => s + (r.avgTestDriveRating ?? 0), 0) / ratedDrives.length
        : null;
    return {
      enquiries,
      booked,
      conversionRate: enquiries > 0 ? Number(((booked / enquiries) * 100).toFixed(1)) : 0,
      testDrives,
      avgRating,
    };
  }, [rows]);

  const sortedRows: VehiclePerformanceRow[] = rows ?? [];

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 px-6 py-8 shadow-xl dark:bg-slate-950 sm:px-8 sm:py-10">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-[10%] -top-[50%] h-[200%] w-[50%] rounded-full bg-violet-600/30 blur-[100px] dark:bg-violet-600/20" />
          <div className="absolute -right-[20%] top-[-20%] h-[150%] w-[60%] rounded-full bg-blue-500/20 blur-[120px] dark:bg-blue-500/10" />
        </div>
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center rounded-full bg-violet-500/10 px-2.5 py-0.5 text-xs font-medium text-violet-300 ring-1 ring-inset ring-violet-500/20 backdrop-blur-md sm:text-sm">
            Analytics & Insights
          </span>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">Vehicle Performance</h1>
          <p className="mt-2 text-sm text-slate-300 sm:text-base">
            Which models attract interest vs. which actually convert — test drives, quotations, and bookings by vehicle.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-4 rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <Select label="Date range" value={preset} onChange={(e) => setPreset(e.target.value as PresetKey)} className="min-w-[150px]">
          {DATE_PRESETS.map((p) => (
            <option key={p.key} value={p.key}>
              {p.label}
            </option>
          ))}
        </Select>
        <Select label="Branch" value={branchId} onChange={(e) => setBranchId(e.target.value)} className="min-w-[180px]">
          <option value="">All Branches</option>
          {branches?.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatTile label="Total Enquiries" value={totals.enquiries} icon={<ClipboardList size={20} />} iconClassName="bg-blue-50 text-blue-600" />
        <StatTile label="Booked" value={totals.booked} icon={<Car size={20} />} iconClassName="bg-emerald-50 text-emerald-600" />
        <StatTile label="Conversion Rate" value={totals.conversionRate} suffix="%" icon={<Percent size={20} />} iconClassName="bg-violet-50 text-violet-600" />
        <StatTile
          label="Avg Test Drive Rating"
          value={totals.avgRating != null ? totals.avgRating.toFixed(1) : "—"}
          icon={<Star size={20} />}
          iconClassName="bg-amber-50 text-amber-600"
        />
      </div>

      <Section title="Model Mix" subtitle="Every model with at least one enquiry in this range, ranked by enquiry volume">
        {isLoading ? (
          <p className="text-sm text-gray-400">Loading…</p>
        ) : sortedRows.length === 0 ? (
          <p className="text-sm text-gray-400">No enquiries in this range.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-slate-800">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs font-medium text-gray-500 dark:bg-slate-800/50 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-2">Model</th>
                  <th className="px-4 py-2">Enquiries</th>
                  <th className="px-4 py-2">Booked</th>
                  <th className="px-4 py-2">Conversion</th>
                  <th className="px-4 py-2">Test Drives</th>
                  <th className="px-4 py-2">TD Completion</th>
                  <th className="px-4 py-2">Avg Rating</th>
                  <th className="px-4 py-2">TD → Booking</th>
                  <th className="px-4 py-2">Quotations</th>
                  <th className="px-4 py-2">Avg Discount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {sortedRows.map((row) => (
                  <tr key={row.carModel} className="hover:bg-gray-50/60 dark:hover:bg-slate-800/30">
                    <td className="px-4 py-2 font-medium text-gray-900 dark:text-slate-100">{row.carModel}</td>
                    <td className="px-4 py-2 tabular-nums text-gray-700 dark:text-slate-300">{row.enquiries}</td>
                    <td className="px-4 py-2 tabular-nums text-gray-700 dark:text-slate-300">{row.booked}</td>
                    <td className="px-4 py-2">
                      <ConversionBar percent={row.conversionRate} />
                    </td>
                    <td className="px-4 py-2 tabular-nums text-gray-700 dark:text-slate-300">{row.testDrives}</td>
                    <td className="px-4 py-2 tabular-nums text-gray-700 dark:text-slate-300">
                      {row.testDrives > 0 ? `${row.testDriveCompletionRate}%` : "—"}
                    </td>
                    <td className="px-4 py-2">
                      <RatingCell rating={row.avgTestDriveRating} />
                    </td>
                    <td className="px-4 py-2 tabular-nums text-gray-700 dark:text-slate-300">
                      {row.testDrives > 0 ? `${row.testDriveToBookingRate}%` : "—"}
                    </td>
                    <td className="px-4 py-2 tabular-nums text-gray-700 dark:text-slate-300">{row.quotations}</td>
                    <td className="px-4 py-2 tabular-nums text-gray-700 dark:text-slate-300">
                      {row.avgDiscountPercent != null ? `${row.avgDiscountPercent}%` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </div>
  );
}
