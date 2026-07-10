import type { CrPerformanceRow } from "../../api/reports.api";

export function CrPerformanceTable({ rows }: { rows: CrPerformanceRow[] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-gray-500">No CR activity in this range.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-left text-xs font-medium text-gray-500">
          <tr>
            <th className="px-4 py-2">CR Team Member</th>
            <th className="px-4 py-2">Assigned</th>
            <th className="px-4 py-2">Converted</th>
            <th className="px-4 py-2">Pending Follow-ups</th>
            <th className="px-4 py-2">Overdue</th>
            <th className="px-4 py-2">Conversion Rate</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((row) => (
            <tr key={row.crId}>
              <td className="px-4 py-2 font-medium text-gray-900">{row.crName}</td>
              <td className="px-4 py-2 text-gray-600">{row.assigned}</td>
              <td className="px-4 py-2 text-gray-600">{row.converted}</td>
              <td className="px-4 py-2 font-medium text-amber-600">{row.followUpsPending}</td>
              <td className="px-4 py-2 font-bold text-rose-600">{row.followUpsOverdue > 0 ? row.followUpsOverdue : "-"}</td>
              <td className="px-4 py-2 text-gray-600">{row.conversionRate}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
