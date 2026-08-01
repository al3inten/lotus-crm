import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { Car, Star, Percent, ClipboardList, LayoutGrid, ChevronLeft, ChevronRight, Download } from "lucide-react";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { useVehiclePerformanceReport } from "../hooks/useReports";
import { downloadEnquiriesXlsx } from "../api/reports.api";
import { StatTile } from "../components/reports/StatTile";
import { DonutChart } from "../components/reports/DonutChart";
import type { DonutSlice } from "../components/reports/DonutChart";
import { ChartTableToggle } from "../components/reports/ChartTableToggle";
import { Select } from "../components/common/Input";
import { LocationBranchSelect } from "../components/common/LocationBranchSelect";
import { Button } from "../components/common/Button";
import { Card, CardHeader } from "../components/common/Card";
import type { VehiclePerformanceRow } from "../api/reports.api";

const DATE_PRESETS = [
  { key: "30d", label: "Last 30 days", days: 30 },
  { key: "90d", label: "Last 90 days", days: 90 },
  { key: "ytd", label: "This year", days: null },
  { key: "all", label: "All time", days: -1 },
] as const;

type PresetKey = (typeof DATE_PRESETS)[number]["key"];

const PAGE_SIZE = 10;

/** Compact page-number list with ellipses (1 … 4 5 6 … 20) — same pattern as the leads table. */
function getPageNumbers(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const out: (number | "ellipsis")[] = [1];
  const left = Math.max(2, current - 1);
  const right = Math.min(total - 1, current + 1);
  if (left > 2) out.push("ellipsis");
  for (let i = left; i <= right; i++) out.push(i);
  if (right < total - 1) out.push("ellipsis");
  out.push(total);
  return out;
}

/** Ten skeleton rows shaped like the real table — shown while the report loads instead
 * of a bare "Loading…" line, so the page doesn't visually jump once data arrives. */
function TableSkeleton() {
  return (
    <tbody>
      {Array.from({ length: 6 }).map((_, i) => (
        <tr key={i} className="border-b border-slate-100 dark:border-slate-800/80">
          {Array.from({ length: 12 }).map((_, j) => (
            <td key={j} className="px-4 py-3.5">
              <div
                className="h-4 animate-pulse rounded bg-slate-200 dark:bg-slate-800"
                style={{ animationDelay: `${(i * 10 + j) * 20}ms`, width: j === 0 ? "80%" : "50%" }}
              />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
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
          className="h-full rounded-full bg-primary-500"
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
  const [locationId, setLocationId] = useState<string | undefined>(undefined);
  const [branchId, setBranchId] = useState<string>("");
  const [page, setPage] = useState(1);

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

  const { data: rows, isLoading } = useVehiclePerformanceReport(filters);

  const [downloadingModel, setDownloadingModel] = useState<string | null>(null);
  const handleDownloadModel = async (carModel: string) => {
    setDownloadingModel(carModel);
    try {
      const blob = await downloadEnquiriesXlsx({ ...filters, carModel });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `lotus-crm-customers-${carModel.toLowerCase().replace(/\s+/g, "-")}-${new Date().toISOString().slice(0, 10)}.xlsx`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("Customer list exported");
    } catch (err) {
      let message = "Something went wrong";
      if (isAxiosError(err) && err.response?.data instanceof Blob) {
        try {
          message = (JSON.parse(await err.response.data.text()) as { error?: string }).error ?? message;
        } catch {
          // leave the generic message
        }
      }
      toast.error(message);
    } finally {
      setDownloadingModel(null);
    }
  };

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
  const totalPages = Math.max(1, Math.ceil(sortedRows.length / PAGE_SIZE));

  // Filters changing (date range/branch) reshuffles which page 1 even means — snap back to it.
  useEffect(() => {
    setPage(1);
  }, [preset, branchId]);

  const pageRows = sortedRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <div className="relative overflow-hidden rounded-3xl bg-[#0B0F19] px-6 py-8 shadow-2xl shadow-primary-900/10 ring-1 ring-slate-900/5 dark:bg-slate-950 dark:ring-white/10 sm:px-9 sm:py-9">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h1v1H0V0zm23 23h1v1h-1v-1z' fill='white'/%3E%3C/svg%3E\")", backgroundSize: "24px 24px" }}
        />
        <div className="pointer-events-none absolute -left-20 -top-20 h-[300px] w-[300px] rounded-full bg-primary-500/10 blur-[80px]" />
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center rounded-full bg-primary-500/10 px-2.5 py-0.5 text-xs font-medium text-primary-300 ring-1 ring-inset ring-primary-500/20 backdrop-blur-md sm:text-sm">
            Analytics & Insights
          </span>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">Vehicle Performance</h1>
          <p className="mt-2 text-sm text-slate-300 sm:text-base">
            Which models attract interest vs. which actually convert — test drives, quotations, and bookings by vehicle.
          </p>
        </div>
      </div>

      <Card>
        <div className="flex flex-wrap items-end gap-4">
          <Select label="Date range" value={preset} onChange={(e) => setPreset(e.target.value as PresetKey)} className="min-w-[150px]">
            {DATE_PRESETS.map((p) => (
              <option key={p.key} value={p.key}>
                {p.label}
              </option>
            ))}
          </Select>
          <LocationBranchSelect
            locationId={locationId}
            branchId={branchId || undefined}
            onChange={({ locationId: nextLocationId, branchId: nextBranchId }) => {
              setLocationId(nextLocationId);
              setBranchId(nextBranchId ?? "");
            }}
          />
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatTile label="Total Enquiries" value={totals.enquiries} icon={<ClipboardList size={20} />} iconClassName="bg-primary-50 text-primary-600 dark:bg-primary-500/20 dark:text-primary-400" />
        <StatTile label="Booking" value={totals.booked} icon={<Car size={20} />} iconClassName="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400" />
        <StatTile label="Conversion Rate" value={totals.conversionRate} suffix="%" icon={<Percent size={20} />} iconClassName="bg-violet-50 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400" />
        <StatTile
          label="Avg Test Drive Rating"
          value={totals.avgRating != null ? totals.avgRating.toFixed(1) : "—"}
          icon={<Star size={20} />}
          iconClassName="bg-amber-50 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400"
        />
      </div>

      <Card padded={false} className="overflow-hidden">
        <div className="p-6 pb-0">
          <CardHeader
            icon={<LayoutGrid size={20} />}
            title="Model Mix"
            subtitle="Every model with at least one enquiry in this range, ranked by enquiry volume"
          />
        </div>
        {!isLoading && sortedRows.length === 0 ? (
          <p className="px-6 pb-6 text-sm text-gray-400 dark:text-slate-500">No enquiries in this range.</p>
        ) : (
          <div className="px-6 pt-4">
            <ChartTableToggle
              table={
          <>
            <div className="-mx-6 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10 bg-white/95 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400 backdrop-blur-sm dark:bg-slate-900/95 dark:text-slate-500">
                  <tr>
                    <th className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">Model</th>
                    <th className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">Enquiries</th>
                    <th className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">Booking</th>
                    <th className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">Share of Sales</th>
                    <th className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">Conversion</th>
                    <th className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">Test Drives</th>
                    <th className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">TD Completion</th>
                    <th className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">Avg Rating</th>
                    <th className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">TD → Booking</th>
                    <th className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">Quotations</th>
                    <th className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">Avg Discount</th>
                    <th className="border-b border-slate-100 px-4 py-3 text-right dark:border-slate-800">Download</th>
                  </tr>
                </thead>
                {isLoading ? (
                  <TableSkeleton />
                ) : (
                  <tbody>
                    {pageRows.map((row) => (
                      <tr key={row.carModel} className="group transition-colors hover:bg-primary-50/60 dark:hover:bg-primary-500/[0.06]">
                        <td className="border-b border-slate-100 px-4 py-3 font-medium text-gray-900 dark:border-slate-800/80 dark:text-slate-100">{row.carModel}</td>
                        <td className="border-b border-slate-100 px-4 py-3 tabular-nums text-gray-700 dark:border-slate-800/80 dark:text-slate-300">{row.enquiries}</td>
                        <td className="border-b border-slate-100 px-4 py-3 tabular-nums text-gray-700 dark:border-slate-800/80 dark:text-slate-300">{row.booked}</td>
                        <td className="border-b border-slate-100 px-4 py-3 tabular-nums font-semibold text-emerald-600 dark:border-slate-800/80 dark:text-emerald-400">{row.shareOfSales}%</td>
                        <td className="border-b border-slate-100 px-4 py-3 dark:border-slate-800/80">
                          <ConversionBar percent={row.conversionRate} />
                        </td>
                        <td className="border-b border-slate-100 px-4 py-3 tabular-nums text-gray-700 dark:border-slate-800/80 dark:text-slate-300">{row.testDrives}</td>
                        <td className="border-b border-slate-100 px-4 py-3 tabular-nums text-gray-700 dark:border-slate-800/80 dark:text-slate-300">
                          {row.testDrives > 0 ? `${row.testDriveCompletionRate}%` : "—"}
                        </td>
                        <td className="border-b border-slate-100 px-4 py-3 dark:border-slate-800/80">
                          <RatingCell rating={row.avgTestDriveRating} />
                        </td>
                        <td className="border-b border-slate-100 px-4 py-3 tabular-nums text-gray-700 dark:border-slate-800/80 dark:text-slate-300">
                          {row.testDrives > 0 ? `${row.testDriveToBookingRate}%` : "—"}
                        </td>
                        <td className="border-b border-slate-100 px-4 py-3 tabular-nums text-gray-700 dark:border-slate-800/80 dark:text-slate-300">{row.quotations}</td>
                        <td className="border-b border-slate-100 px-4 py-3 tabular-nums text-gray-700 dark:border-slate-800/80 dark:text-slate-300">
                          {row.avgDiscountPercent != null ? `${row.avgDiscountPercent}%` : "—"}
                        </td>
                        <td className="border-b border-slate-100 px-4 py-3 text-right dark:border-slate-800/80">
                          <Button
                            size="sm"
                            variant="ghost"
                            isLoading={downloadingModel === row.carModel}
                            icon={<Download size={14} />}
                            onClick={() => handleDownloadModel(row.carModel)}
                          >
                            Download
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                )}
              </table>
            </div>

            {/* Numbered pagination — same pattern as the Leads table */}
            {!isLoading && sortedRows.length > 0 && (
              <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row dark:border-slate-800">
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Page {page} of {totalPages}
                </span>
                <nav aria-label="Pagination" className="flex items-center gap-1">
                  <button
                    type="button"
                    aria-label="Previous page"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:pointer-events-none disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  {getPageNumbers(page, totalPages).map((p, i) =>
                    p === "ellipsis" ? (
                      <span key={`e${i}`} className="px-1.5 text-slate-400 dark:text-slate-600">
                        …
                      </span>
                    ) : (
                      <button
                        key={p}
                        type="button"
                        aria-label={`Page ${p}`}
                        aria-current={p === page}
                        onClick={() => setPage(p)}
                        className={clsx(
                          "flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-sm font-semibold tabular-nums transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50",
                          p === page
                            ? "bg-primary-600 text-white shadow-sm shadow-primary-600/25"
                            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                        )}
                      >
                        {p}
                      </button>
                    )
                  )}
                  <button
                    type="button"
                    aria-label="Next page"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:pointer-events-none disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                  >
                    <ChevronRight size={16} />
                  </button>
                </nav>
              </div>
            )}
          </>
              }
              chart={
                <DonutChart
                  slices={[...sortedRows]
                    .sort((a, b) => b.booked - a.booked)
                    .filter((r) => r.booked > 0)
                    .slice(0, 10)
                    .map(
                      (row): DonutSlice => ({
                        label: row.carModel,
                        value: row.booked,
                        valueLabel: `${row.booked} (${row.shareOfSales}%)`,
                      })
                    )}
                />
              }
            />
          </div>
        )}
      </Card>
    </div>
  );
}
