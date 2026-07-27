import clsx from "clsx";
import { User as UserIcon } from "lucide-react";
import type { FollowUpCalendarResponse } from "../../api/followUps.api";
import { FollowUpCalendar } from "../followUps/FollowUpCalendar";
import { Card } from "../common/Card";
import { Avatar } from "../common/Avatar";

export function RepBreakdownPanel({
  calCounts,
  selectedDateStr,
  onRangeChange,
  onSelectDate,
  canSeeOthers,
  calendar,
  calCrId,
  onSelectCr,
}: {
  calCounts: Record<string, number>;
  selectedDateStr?: string;
  onRangeChange: (start: string, end: string) => void;
  onSelectDate: (date: string) => void;
  canSeeOthers: boolean;
  calendar: FollowUpCalendarResponse | undefined;
  calCrId: string | undefined;
  onSelectCr: (crId: string | undefined) => void;
}) {
  return (
    <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-3">
      <div className={clsx(canSeeOthers ? "lg:col-span-2" : "lg:col-span-3")}>
        <FollowUpCalendar
          currentDate={new Date()}
          counts={calCounts}
          selectedDateStr={selectedDateStr}
          onRangeChange={onRangeChange}
          onSelectDate={onSelectDate}
        />
      </div>

      {/* Per-CR breakdown — admins & managers. Click a rep to focus the calendar + list. */}
      {canSeeOthers && (
        <Card className="flex h-full flex-col">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
              <UserIcon size={15} className="text-primary-500" /> By rep
            </h2>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold tabular-nums text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {(calendar?.total ?? 0).toLocaleString()}
            </span>
          </div>
          <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">
            Follow-ups in the shown range
          </p>
          <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto pr-1">
            {!calendar || calendar.byCr.length === 0 ? (
              <p className="py-6 text-center text-xs italic text-slate-400 dark:text-slate-500">
                No follow-ups in this range.
              </p>
            ) : (
              calendar.byCr.map((cr) => {
                const active = calCrId === cr.id;
                return (
                  <button
                    key={cr.id}
                    type="button"
                    onClick={() => onSelectCr(active ? undefined : cr.id)}
                    className={clsx(
                      "flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left transition-colors",
                      active
                        ? "border-primary-400 bg-primary-50 dark:border-primary-500/50 dark:bg-primary-500/10"
                        : "border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/60"
                    )}
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <Avatar name={cr.name} size="sm" />
                      <span className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">{cr.name}</span>
                    </span>
                    <span
                      className={clsx(
                        "shrink-0 rounded-full px-2 py-0.5 text-xs font-bold tabular-nums",
                        active
                          ? "bg-primary-600 text-white"
                          : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                      )}
                    >
                      {cr.count.toLocaleString()}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
