import { Download } from "lucide-react";
import { VIZ } from "./vizTheme";
import type { SourcePerformanceRow } from "../../api/reports.api";
import { Button } from "../common/Button";

/**
 * Three measures per source (total, converted, rate) — a table is the honest form,
 * with an inline single-hue bar carrying the lead-volume comparison at a glance.
 */
export function SourcePerformanceTable({
  rows,
  onDownload,
  downloadingKey,
}: {
  rows: SourcePerformanceRow[];
  /** Downloads that source's customer list as Excel — omit to hide the column entirely. */
  onDownload?: (source: string) => void;
  downloadingKey?: string | null;
}) {
  if (rows.length === 0) {
    return <p className="text-sm text-gray-400 dark:text-slate-500">No data in this range.</p>;
  }

  const maxTotal = Math.max(1, ...rows.map((r) => r.total));

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-slate-800">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:bg-slate-800/50 dark:text-slate-400">
          <tr>
            <th className="px-4 py-2.5">Source</th>
            <th className="px-4 py-2.5">Leads</th>
            <th className="px-4 py-2.5 w-1/3" aria-hidden />
            <th className="px-4 py-2.5">Converted</th>
            <th className="px-4 py-2.5">Conversion Rate</th>
            {onDownload && <th className="px-4 py-2.5 text-right">Download</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
          {rows.map((row) => (
            <tr key={row.source} className="transition-colors hover:bg-primary-50/60 dark:hover:bg-primary-500/[0.06]">
              <td className="px-4 py-2.5 font-medium text-gray-900 dark:text-slate-100">{row.source.replaceAll("_", " ")}</td>
              <td className="px-4 py-2.5 tabular-nums text-gray-700 dark:text-slate-300">{row.total.toLocaleString()}</td>
              <td className="px-4 py-2.5">
                <div className="h-3 rounded-r bg-gray-100 dark:bg-slate-800/60">
                  <div
                    className="h-3 rounded-r transition-[width] duration-300"
                    style={{
                      width: `${(row.total / maxTotal) * 100}%`,
                      backgroundColor: VIZ.series1,
                    }}
                  />
                </div>
              </td>
              <td className="px-4 py-2.5 tabular-nums text-gray-700 dark:text-slate-300">{row.converted.toLocaleString()}</td>
              <td className="px-4 py-2.5 tabular-nums font-semibold text-gray-700 dark:text-slate-200">{row.conversionRate}%</td>
              {onDownload && (
                <td className="px-4 py-2.5 text-right">
                  <Button
                    size="sm"
                    variant="ghost"
                    isLoading={downloadingKey === `source-${row.source}`}
                    icon={<Download size={14} />}
                    onClick={() => onDownload(row.source)}
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
