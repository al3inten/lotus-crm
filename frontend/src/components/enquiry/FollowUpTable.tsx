import { Calendar, Eye, Plus } from "lucide-react";
import { Button } from "../common/Button";
import { Card, CardHeader } from "../common/Card";
import type { FollowUp } from "../../types";

export function FollowUpTable({
  followUps,
  onAddClick,
  canAdd,
  limit,
  onViewAll,
  /** Skip the Card/CardHeader chrome — use inside a Modal that already has its own title. */
  hideHeader = false,
  glow = true,
}: {
  followUps: FollowUp[];
  onAddClick: () => void;
  canAdd: boolean;
  /** Cap the visible rows — pairs with onViewAll to open the full list elsewhere. */
  limit?: number;
  onViewAll?: () => void;
  hideHeader?: boolean;
  glow?: boolean;
}) {
  const visible = limit ? followUps.slice(0, limit) : followUps;
  const hasMore = limit != null && followUps.length > limit;

  const table = (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
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
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
          {followUps.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                No follow-ups recorded yet.
              </td>
            </tr>
          ) : (
            visible.map((fu, idx) => (
              <tr key={fu.id} className="transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                <td className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400">#{followUps.length - idx}</td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-900 dark:text-slate-100">
                  {new Date(fu.followUpDate).toLocaleDateString()}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600 dark:text-slate-300">{fu.followUpTime || "—"}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    {fu.type}
                  </span>
                </td>
                <td className="min-w-[200px] px-4 py-3 text-slate-700 dark:text-slate-300">{fu.remark}</td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600 dark:text-slate-300">
                  {fu.nextFollowUpDate ? (
                    <>
                      {new Date(fu.nextFollowUpDate).toLocaleDateString()}
                      {fu.nextFollowUpTime && ` at ${fu.nextFollowUpTime}`}
                    </>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{fu.createdBy?.name || "System"}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  if (hideHeader) {
    return <div className="flex flex-col gap-3">{table}</div>;
  }

  return (
    <Card padded={false} glow={glow} className="flex flex-col overflow-hidden">
      <div className="p-4 pb-3">
        <CardHeader
          icon={<Calendar size={18} />}
          iconClassName="bg-indigo-50 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400"
          title="Follow-up History"
          subtitle={`${followUps.length} recorded`}
          actions={
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
          }
        />
      </div>
      <div className="max-h-[360px] overflow-y-auto px-4 pb-4 [scrollbar-width:thin]">{table}</div>
    </Card>
  );
}
