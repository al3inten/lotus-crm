import { memo } from "react";
import { Link } from "react-router-dom";
import clsx from "clsx";
import { PhoneOutgoing, ChevronRight, Phone, MessageCircle } from "lucide-react";
import type { useUpcomingFollowUps } from "../../hooks/useFollowUps";
import { Card } from "../common/Card";
import { Avatar } from "../common/Avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { HAIRLINE, SURFACE } from "./DashboardPrimitives";

/* Richer follow-up reminder list — includes a due-bucket badge, the last
   remark left on the enquiry, and one-tap Call / WhatsApp so a CR can act
   without leaving the dashboard. */
function UpcomingFollowUpsCardImpl({ data, isLoading }: { data: ReturnType<typeof useUpcomingFollowUps>["data"]; isLoading: boolean }) {
  const items = data?.items ?? [];

  return (
    <Card padded={false} className={clsx(SURFACE, "overflow-hidden")}>
      <div className={clsx("flex items-center justify-between border-b px-5 py-4", HAIRLINE)}>
        <div className="flex items-center gap-2">
          <PhoneOutgoing size={14} strokeWidth={1.75} className="text-slate-400 dark:text-slate-500" />
          <h2 className="text-[13px] font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Upcoming follow-ups
          </h2>
        </div>
        <Link
          to="/follow-ups"
          className="group inline-flex items-center gap-0.5 rounded-md text-[12px] font-medium text-slate-500 transition-colors hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 dark:text-slate-400 dark:hover:text-slate-100"
        >
          All follow-ups
          <ChevronRight size={13} className="opacity-60 transition-transform duration-200 group-hover:translate-x-0.5" />
        </Link>
      </div>

      {isLoading ? (
        <div className="divide-y divide-slate-100 dark:divide-white/[0.05]">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-3.5">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-1/3" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="px-5 py-12 text-center">
          <p className="text-[13px] font-medium text-slate-900 dark:text-slate-200">You're all caught up</p>
          <p className="mt-1 text-[12px] text-slate-500 dark:text-slate-400">No follow-ups due this week.</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-white/[0.05]">
          {items.slice(0, 6).map((item) => {
            const due = new Date(item.followUpDueAt);
            const now = new Date();
            const sameDay = due.toDateString() === now.toDateString();
            const isOverdue = due < now && !sameDay;
            const phoneDigits = item.phoneRaw?.replace(/\D/g, "") ?? "";
            return (
              <div
                key={item.enquiryId}
                className="group flex items-center gap-3 px-5 py-3 transition-colors hover:bg-slate-50/60 dark:hover:bg-white/[0.02]"
              >
                <Link to={`/leads/${item.leadId}`} className="flex min-w-0 flex-1 items-center gap-3">
                  <Avatar name={item.leadName} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-slate-900 dark:text-slate-200">
                      {item.leadName}
                    </p>
                    <p className="truncate text-[12px] text-slate-500 dark:text-slate-400">
                      {item.carModel}
                      {item.lastFollowUp?.remark ? ` · ${item.lastFollowUp.remark}` : ""}
                    </p>
                  </div>
                  <span
                    className={clsx(
                      "shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                      isOverdue
                        ? "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400"
                        : sameDay
                          ? "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
                          : "bg-slate-100 text-slate-600 dark:bg-white/[0.06] dark:text-slate-300"
                    )}
                  >
                    {isOverdue ? "Overdue" : sameDay ? "Today" : due.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  </span>
                </Link>
                <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                  <a
                    href={`tel:${item.phoneRaw}`}
                    aria-label={`Call ${item.leadName}`}
                    onClick={(e) => e.stopPropagation()}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-emerald-50 hover:text-emerald-600 dark:text-slate-500 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-400"
                  >
                    <Phone size={14} />
                  </a>
                  <a
                    href={phoneDigits ? `https://wa.me/${phoneDigits}` : undefined}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`WhatsApp ${item.leadName}`}
                    onClick={(e) => e.stopPropagation()}
                    className={clsx(
                      "flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-emerald-50 hover:text-emerald-600 dark:text-slate-500 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-400",
                      !phoneDigits && "pointer-events-none opacity-30"
                    )}
                  >
                    <MessageCircle size={14} />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

export const UpcomingFollowUpsCard = memo(UpcomingFollowUpsCardImpl);
