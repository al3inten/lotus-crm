import { Calendar, Eye, Plus } from "lucide-react";
import { Button } from "../common/Button";
import type { FollowUp } from "../../types";

export function FollowUpTable({
  followUps,
  onAddClick,
  canAdd,
  limit,
  onViewAll,
}: {
  followUps: FollowUp[];
  onAddClick: () => void;
  canAdd: boolean;
  /** Cap the visible rows — pairs with onViewAll to open the full list elsewhere. */
  limit?: number;
  onViewAll?: () => void;
}) {
  const visible = limit ? followUps.slice(0, limit) : followUps;
  const hasMore = limit != null && followUps.length > limit;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Calendar size={18} className="text-indigo-600" />
          Follow-up History
        </h2>
        <div className="flex items-center gap-2">
          {hasMore && onViewAll && (
            <Button size="sm" variant="secondary" icon={<Eye size={14} />} onClick={onViewAll}>
              View all ({followUps.length})
            </Button>
          )}
          {canAdd && (
            <Button size="sm" icon={<Plus size={14} />} onClick={onAddClick}>
              Add Follow-up
            </Button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-semibold border-b border-gray-200">
            <tr>
              <th className="px-4 py-3">No.</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Remark</th>
              <th className="px-4 py-3">Next Follow-up</th>
              <th className="px-4 py-3">Created By</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {followUps.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  No follow-ups recorded yet.
                </td>
              </tr>
            ) : (
              visible.map((fu, idx) => (
                <tr key={fu.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3 text-gray-500 font-medium">#{followUps.length - idx}</td>
                  <td className="px-4 py-3 text-gray-900 whitespace-nowrap">{new Date(fu.followUpDate).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{fu.followUpTime || "—"}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                      {fu.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700 min-w-[200px]">{fu.remark}</td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                    {fu.nextFollowUpDate ? (
                      <>
                        {new Date(fu.nextFollowUpDate).toLocaleDateString()}
                        {fu.nextFollowUpTime && ` at ${fu.nextFollowUpTime}`}
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{fu.createdBy?.name || "System"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
