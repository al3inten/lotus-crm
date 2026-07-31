import { useMemo, useState } from "react";
import { Modal } from "../common/Modal";
import { useCrPerformanceReport } from "../../hooks/useReports";
import { CustomerListModal } from "../reports/CustomerListModal";
import type { ReportFilters } from "../../api/reports.api";

/** Same Won/Lost/Closed-Temp/Pending split the branch table uses, applied per CR here. */
function splitCounts(statusCounts: Record<string, number>, total: number) {
  const won = statusCounts["DELIVERED"] ?? 0;
  const lost = statusCounts["LOST"] ?? 0;
  const closedTemp = statusCounts["CLOSED_TEMP"] ?? 0;
  const pending = total - won - lost - closedTemp;
  const conversionRate = total > 0 ? Number(((won / total) * 100).toFixed(1)) : 0;
  return { total, won, lost, closedTemp, pending, conversionRate };
}

export function BranchDrilldownModal({
  isOpen,
  onClose,
  branchId,
  branchName,
  baseFilters,
}: {
  isOpen: boolean;
  onClose: () => void;
  branchId: string;
  branchName: string;
  /** Period A's dateFrom/dateTo (branchId is overridden below to this specific branch). */
  baseFilters: ReportFilters;
}) {
  const filters = useMemo(
    () => ({ ...baseFilters, branchId: branchId || undefined }),
    [baseFilters, branchId]
  );

  const { data: crRows, isLoading } = useCrPerformanceReport(filters);

  const [customerList, setCustomerList] = useState<{ title: string; filters: ReportFilters; fileSuffix: string } | null>(null);

  const openCustomers = (crId: string, crName: string, status: string | undefined, label: string) => {
    setCustomerList({
      title: `${crName} — ${label}`,
      filters: { ...filters, assignedCrId: crId, status },
      fileSuffix: `${crName}-${label}`.toLowerCase().replace(/\s+/g, "-"),
    });
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title={`${branchName} — Individual performance`} maxWidth="max-w-5xl">
        {isLoading ? (
          <p className="py-8 text-center text-sm text-slate-400 dark:text-slate-500">Loading…</p>
        ) : !crRows || crRows.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400 dark:text-slate-500">No consultants had enquiries in this period.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-2.5">Consultant / CR</th>
                  <th className="px-4 py-2.5">Assigned</th>
                  <th className="px-4 py-2.5">Won</th>
                  <th className="px-4 py-2.5">Lost</th>
                  <th className="px-4 py-2.5">Closed Temp</th>
                  <th className="px-4 py-2.5">Pending</th>
                  <th className="px-4 py-2.5">Conversion %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {crRows.map((row) => {
                  const m = splitCounts(row.statusBreakdown, row.assigned);
                  return (
                    <tr key={row.crId} className="transition-colors hover:bg-primary-50/60 dark:hover:bg-primary-500/[0.06]">
                      <td className="px-4 py-2.5 font-medium text-slate-900 dark:text-slate-100">{row.crName}</td>
                      <td className="px-4 py-2.5 tabular-nums">
                        <button
                          type="button"
                          onClick={() => openCustomers(row.crId!, row.crName, undefined, "Assigned")}
                          className="text-slate-700 underline decoration-dotted underline-offset-2 hover:text-primary-600 dark:text-slate-300 dark:hover:text-primary-400"
                        >
                          {m.total}
                        </button>
                      </td>
                      <td className="px-4 py-2.5 tabular-nums">
                        <button
                          type="button"
                          onClick={() => openCustomers(row.crId!, row.crName, "DELIVERED", "Won")}
                          className="text-emerald-700 underline decoration-dotted underline-offset-2 hover:text-emerald-600 dark:text-emerald-400"
                        >
                          {m.won}
                        </button>
                      </td>
                      <td className="px-4 py-2.5 tabular-nums">
                        <button
                          type="button"
                          onClick={() => openCustomers(row.crId!, row.crName, "LOST", "Lost")}
                          className="text-rose-700 underline decoration-dotted underline-offset-2 hover:text-rose-600 dark:text-rose-400"
                        >
                          {m.lost}
                        </button>
                      </td>
                      <td className="px-4 py-2.5 tabular-nums">
                        <button
                          type="button"
                          onClick={() => openCustomers(row.crId!, row.crName, "CLOSED_TEMP", "Closed Temp")}
                          className="text-slate-700 underline decoration-dotted underline-offset-2 hover:text-primary-600 dark:text-slate-300 dark:hover:text-primary-400"
                        >
                          {m.closedTemp}
                        </button>
                      </td>
                      <td className="px-4 py-2.5 tabular-nums text-slate-700 dark:text-slate-300">{m.pending}</td>
                      <td className="px-4 py-2.5 tabular-nums text-slate-700 dark:text-slate-300">{m.conversionRate}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Modal>

      {customerList && (
        <CustomerListModal
          isOpen={!!customerList}
          onClose={() => setCustomerList(null)}
          title={customerList.title}
          filters={customerList.filters}
          fileSuffix={customerList.fileSuffix}
        />
      )}
    </>
  );
}
