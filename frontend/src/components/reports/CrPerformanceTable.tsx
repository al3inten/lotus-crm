import { Download } from "lucide-react";
import type { CrPerformanceRow } from "../../api/reports.api";
import { Button } from "../common/Button";

export function CrPerformanceTable({
  rows,
  onDownload,
  downloadingKey,
}: {
  rows: CrPerformanceRow[];
  /** Downloads that CR's assigned customer list as Excel — omit to hide the column entirely. */
  onDownload?: (crId: string) => void;
  downloadingKey?: string | null;
}) {
  if (rows.length === 0) {
    return <p className="text-sm text-gray-500 dark:text-slate-400">No CR activity in this range.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-slate-800">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:bg-slate-800/50 dark:text-slate-400">
          <tr>
            <th className="px-4 py-2.5">CR Team Member</th>
            <th className="px-4 py-2.5">Assigned</th>
            <th className="px-4 py-2.5">Converted</th>
            <th className="px-4 py-2.5">Pending Follow-ups</th>
            <th className="px-4 py-2.5">Overdue</th>
            <th className="px-4 py-2.5">Conversion Rate</th>
            {onDownload && <th className="px-4 py-2.5 text-right">Download</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
          {rows.map((row) => (
            <tr key={row.crId} className="transition-colors hover:bg-primary-50/60 dark:hover:bg-primary-500/[0.06]">
              <td className="px-4 py-2.5 font-medium text-gray-900 dark:text-slate-100">{row.crName}</td>
              <td className="px-4 py-2.5 tabular-nums text-gray-600 dark:text-slate-300">{row.assigned}</td>
              <td className="px-4 py-2.5 tabular-nums text-gray-600 dark:text-slate-300">{row.converted}</td>
              <td className="px-4 py-2.5 tabular-nums font-medium text-amber-600 dark:text-amber-400">{row.followUpsPending}</td>
              <td className="px-4 py-2.5 tabular-nums font-bold text-rose-600 dark:text-rose-400">{row.followUpsOverdue > 0 ? row.followUpsOverdue : "-"}</td>
              <td className="px-4 py-2.5 tabular-nums font-semibold text-gray-700 dark:text-slate-200">{row.conversionRate}%</td>
              {onDownload && (
                <td className="px-4 py-2.5 text-right">
                  <Button
                    size="sm"
                    variant="ghost"
                    isLoading={downloadingKey === `cr-${row.crId}`}
                    icon={<Download size={14} />}
                    onClick={() => onDownload(row.crId)}
                  >
                    Download
                  </Button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
