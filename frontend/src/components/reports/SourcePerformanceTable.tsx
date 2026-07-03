import { VIZ } from "./vizTheme";
import type { SourcePerformanceRow } from "../../api/reports.api";

/**
 * Three measures per source (total, converted, rate) — a table is the honest form,
 * with an inline single-hue bar carrying the lead-volume comparison at a glance.
 */
export function SourcePerformanceTable({ rows }: { rows: SourcePerformanceRow[] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-gray-400">No data in this range.</p>;
  }

  const maxTotal = Math.max(1, ...rows.map((r) => r.total));

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-left text-xs font-medium text-gray-500">
          <tr>
            <th className="px-4 py-2">Source</th>
            <th className="px-4 py-2">Leads</th>
            <th className="px-4 py-2 w-1/3" aria-hidden />
            <th className="px-4 py-2">Converted</th>
            <th className="px-4 py-2">Conversion Rate</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((row) => (
            <tr key={row.source}>
              <td className="px-4 py-2 font-medium text-gray-900">{row.source.replaceAll("_", " ")}</td>
              <td className="px-4 py-2 tabular-nums text-gray-700">{row.total.toLocaleString()}</td>
              <td className="px-4 py-2">
                <div
                  className="h-3"
                  style={{
                    width: `${(row.total / maxTotal) * 100}%`,
                    backgroundColor: VIZ.series1,
                    borderRadius: "0 4px 4px 0",
                  }}
                />
              </td>
              <td className="px-4 py-2 tabular-nums text-gray-700">{row.converted.toLocaleString()}</td>
              <td className="px-4 py-2 tabular-nums text-gray-700">{row.conversionRate}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
