import { useState } from "react";
import { Car, ClipboardList, Percent, Warehouse } from "lucide-react";
import { useModelWiseReport } from "../hooks/useReports";
import { StatTile } from "../components/reports/StatTile";
import { PeriodCells, NumCell, PctCell, AchievementCell, GroupHeader } from "../components/reports/misReportCells";
import { LocationBranchSelect } from "../components/common/LocationBranchSelect";
import { Card, CardHeader } from "../components/common/Card";

function currentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

const COL_HEADER = "border-b border-slate-100 px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:border-slate-800 dark:text-slate-500";
const STICKY_CELL = "sticky left-0 z-[1] bg-white dark:bg-slate-900";

export function ModelWiseReportPage() {
  const [locationId, setLocationId] = useState<string | undefined>(undefined);
  const [branchId, setBranchId] = useState("");
  const [month, setMonth] = useState(currentMonthKey());
  const { data: report, isLoading } = useModelWiseReport({ branchId: branchId || undefined, month });

  return (
    <div className="mx-auto flex w-full max-w-[110rem] flex-col gap-6">
      <div className="relative overflow-hidden rounded-3xl bg-[#0B0F19] px-6 py-8 shadow-2xl shadow-primary-900/10 ring-1 ring-slate-900/5 dark:bg-slate-950 dark:ring-white/10 sm:px-9 sm:py-9">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h1v1H0V0zm23 23h1v1h-1v-1z' fill='white'/%3E%3C/svg%3E\")", backgroundSize: "24px 24px" }}
        />
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center rounded-full bg-primary-500/10 px-2.5 py-0.5 text-xs font-medium text-primary-300 ring-1 ring-inset ring-primary-500/20 backdrop-blur-md sm:text-sm">
            MIS Report
          </span>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">Model Wise</h1>
          <p className="mt-2 text-sm text-slate-300 sm:text-base">
            Enquiries, bookings and retails per model — this month vs last year and last month, with targets and pipeline balance.
          </p>
        </div>
      </div>

      <Card>
        <div className="flex flex-wrap items-end gap-4">
          <LocationBranchSelect
            locationId={locationId}
            branchId={branchId || undefined}
            onChange={({ locationId: nextLocationId, branchId: nextBranchId }) => {
              setLocationId(nextLocationId);
              setBranchId(nextBranchId ?? "");
            }}
          />
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Month</span>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-500/15 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
          </label>
        </div>
      </Card>

      {report && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatTile
            label="Enquiries (this month)"
            value={report.total.enquiries.cy}
            delta={report.total.enquiries.growthLY}
            deltaLabel="vs last year"
            icon={<ClipboardList size={20} />}
            iconClassName="bg-primary-50 text-primary-600 dark:bg-primary-500/20 dark:text-primary-400"
          />
          <StatTile
            label="Bookings (this month)"
            value={report.total.booking.cy}
            delta={report.total.booking.growthLY}
            deltaLabel="vs last year"
            icon={<Car size={20} />}
            iconClassName="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400"
          />
          <StatTile
            label="Achievement"
            value={report.total.achievementPercent}
            suffix="%"
            delta={report.total.achievementPercentLY == null ? null : Number((report.total.achievementPercent - report.total.achievementPercentLY).toFixed(1))}
            deltaLabel="pts vs last year"
            icon={<Percent size={20} />}
            iconClassName="bg-violet-50 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400"
          />
          <StatTile label="Stock" value={report.total.stock} icon={<Warehouse size={20} />} iconClassName="bg-amber-50 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400" />
        </div>
      )}

      <Card padded={false} className="overflow-hidden">
        <div className="p-6 pb-0">
          <CardHeader icon={<Car size={20} />} title="Model Wise" subtitle={report ? `Month: ${report.month}` : undefined} />
        </div>
        <div className="overflow-x-auto p-6 pt-4">
          {isLoading ? (
            <p className="text-sm text-slate-400">Loading…</p>
          ) : !report || report.rows.length === 0 ? (
            <p className="text-sm text-slate-400">No data for this month.</p>
          ) : (
            <table className="w-full border-separate border-spacing-0 text-sm">
              <thead className="sticky top-0 z-10">
                <tr>
                  <th rowSpan={2} className={COL_HEADER + " sticky left-0 z-[2] bg-white text-left dark:bg-slate-900"}>
                    Model
                  </th>
                  <GroupHeader tint="primary" colSpan={5}>Enquiries</GroupHeader>
                  <GroupHeader tint="amber" colSpan={2}>Booking Target</GroupHeader>
                  <GroupHeader tint="emerald" colSpan={5}>Booking</GroupHeader>
                  <GroupHeader tint="violet" colSpan={2}>Achv%</GroupHeader>
                  <GroupHeader tint="cyan" colSpan={5}>Retail</GroupHeader>
                  <GroupHeader tint="slate" colSpan={3}>Conversion</GroupHeader>
                  <GroupHeader tint="amber" colSpan={3}>Pipeline</GroupHeader>
                </tr>
                <tr className="bg-white dark:bg-slate-900">
                  {["Enq", "LY", "LM", "%LY", "%LM", "Target", "LY", "Booking", "LY", "LM", "%LY", "%LM", "Achv%", "LY", "Retail", "LY", "LM", "%LY", "%LM", "E-B", "E-R", "B-R", "Stock", "BB", "Active"].map((h, i) => (
                    <th key={i} className={COL_HEADER}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {report.rows.map((row, i) => (
                  <tr key={row.carModel} className={i % 2 === 1 ? "bg-slate-50/60 hover:bg-primary-50/60 dark:bg-slate-800/20 dark:hover:bg-primary-500/[0.06]" : "hover:bg-primary-50/60 dark:hover:bg-primary-500/[0.06]"}>
                    <td className={`border-b border-slate-100 px-3 py-2 font-medium text-slate-900 dark:border-slate-800/80 dark:text-slate-100 ${STICKY_CELL}`}>{row.carModel}</td>
                    <PeriodCells counts={row.enquiries} />
                    <NumCell value={row.bookingTarget} />
                    <NumCell value={row.bookingTargetLY} />
                    <PeriodCells counts={row.booking} />
                    <AchievementCell value={row.achievementPercent} bold />
                    <AchievementCell value={row.achievementPercentLY} />
                    <PeriodCells counts={row.retail} />
                    <PctCell value={row.enquiryToBooking} />
                    <PctCell value={row.enquiryToRetail} />
                    <PctCell value={row.bookingToRetail} />
                    <NumCell value={row.stock} />
                    <NumCell value={row.bookingBalance} />
                    <NumCell value={row.activeEnquiries} />
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 font-semibold dark:bg-slate-800/60">
                  <td className={`border-t-2 border-slate-200 px-3 py-2 text-slate-900 dark:border-slate-700 dark:text-slate-100 ${STICKY_CELL} !bg-slate-100 dark:!bg-slate-800/60`}>
                    Total
                  </td>
                  <PeriodCells counts={report.total.enquiries} />
                  <NumCell value={report.total.bookingTarget} bold />
                  <NumCell value={report.total.bookingTargetLY} bold />
                  <PeriodCells counts={report.total.booking} />
                  <AchievementCell value={report.total.achievementPercent} bold />
                  <AchievementCell value={report.total.achievementPercentLY} bold />
                  <PeriodCells counts={report.total.retail} />
                  <PctCell value={report.total.enquiryToBooking} />
                  <PctCell value={report.total.enquiryToRetail} />
                  <PctCell value={report.total.bookingToRetail} />
                  <NumCell value={report.total.stock} bold />
                  <NumCell value={report.total.bookingBalance} bold />
                  <NumCell value={report.total.activeEnquiries} bold />
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      </Card>
    </div>
  );
}
