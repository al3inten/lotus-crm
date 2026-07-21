import { memo } from "react";
import { Link } from "react-router-dom";
import clsx from "clsx";
import { PhoneOutgoing } from "lucide-react";
import type { useReminders } from "../../hooks/useLeads";
import { Card } from "../common/Card";
import { Avatar } from "../common/Avatar";
import { HAIRLINE, SURFACE } from "./DashboardPrimitives";

/* ── Follow-ups due — neutral surface, urgency lives in the badge only ─── */

function ActionRequiredListImpl({ data }: { data: ReturnType<typeof useReminders>["data"] }) {
  if (!data || data.length === 0) return null;

  return (
    <Card padded={false} className={clsx(SURFACE, "overflow-hidden")}>
      <div className={clsx("flex items-center justify-between border-b px-5 py-4", HAIRLINE)}>
        <div className="flex items-center gap-2">
          <PhoneOutgoing size={14} strokeWidth={1.75} className="text-slate-400 dark:text-slate-500" />
          <h2 className="text-[13px] font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Follow-ups due
          </h2>
        </div>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-slate-600 dark:bg-white/[0.06] dark:text-slate-300">
          {data.length}
        </span>
      </div>
      <div className={clsx("divide-y", "divide-slate-100 dark:divide-white/[0.05]")}>
        {data.slice(0, 5).map((enquiry) => {
          const due = new Date(enquiry.followUpDueAt!);
          const isOverdue = due < new Date() && due.toDateString() !== new Date().toDateString();
          return (
            <Link
              key={enquiry.id}
              to={`/leads/${enquiry.leadId}`}
              className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-slate-50/60 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-indigo-500 dark:hover:bg-white/[0.02]"
            >
              <Avatar name={enquiry.lead.name} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-slate-900 dark:text-slate-200">
                  {enquiry.lead.name}
                </p>
                <p className="truncate text-[12px] text-slate-500 dark:text-slate-400">{enquiry.carModel}</p>
              </div>
              <span
                className={clsx(
                  "shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                  isOverdue
                    ? "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400"
                    : "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
                )}
              >
                {isOverdue ? "Overdue" : "Today"}
              </span>
            </Link>
          );
        })}
      </div>
    </Card>
  );
}

export const ActionRequiredList = memo(ActionRequiredListImpl);
