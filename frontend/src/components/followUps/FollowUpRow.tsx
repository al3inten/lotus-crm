import { memo } from "react";
import type { ReactNode } from "react";
import clsx from "clsx";
import { CalendarClock, Phone, MessageCircle, MapPin, Mail, User as UserIcon, Car } from "lucide-react";
import type { UpcomingFollowUp } from "../../api/followUps.api";
import type { FollowUpType } from "../../types";
import { Avatar } from "../common/Avatar";
import { StatusBadge } from "../common/StatusBadge";

const FOLLOW_UP_TYPE_ICON: Record<FollowUpType, ReactNode> = {
  CALL: <Phone size={12} />,
  WHATSAPP: <MessageCircle size={12} />,
  VISIT: <MapPin size={12} />,
  EMAIL: <Mail size={12} />,
};

const CATEGORY_STYLES: Record<string, string> = {
  HOT: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300",
  WARM: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  COLD: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
};

/** Human-readable due date with an overdue/soon accent. */
export function dueMeta(iso: string): { label: string; className: string } {
  const due = new Date(iso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDay = new Date(due);
  dueDay.setHours(0, 0, 0, 0);
  const days = Math.round((dueDay.getTime() - today.getTime()) / 86_400_000);
  const dateStr = due.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

  if (days < 0) {
    const n = Math.abs(days);
    return { label: `${dateStr} · ${n} day${n === 1 ? "" : "s"} overdue`, className: "text-red-600 dark:text-red-400" };
  }
  if (days === 0) return { label: `${dateStr} · today`, className: "text-primary-600 dark:text-primary-400 font-semibold" };
  if (days === 1) return { label: `${dateStr} · tomorrow`, className: "text-violet-600 dark:text-violet-400" };
  return { label: dateStr, className: "text-slate-500 dark:text-slate-400" };
}

function FollowUpRowImpl({
  item,
  canSeeOthers,
  onOpen,
}: {
  item: UpcomingFollowUp;
  canSeeOthers: boolean;
  onOpen: (item: UpcomingFollowUp) => void;
}) {
  const due = dueMeta(item.followUpDueAt);
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onOpen(item);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Open follow-up for ${item.leadName}`}
      onClick={() => onOpen(item)}
      onKeyDown={onKey}
      className="group flex cursor-pointer flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-[0_12px_30px_rgb(0,0,0,0.07)] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-primary-500/40 sm:flex-row sm:items-center"
    >
      {/* Identity */}
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <Avatar name={item.leadName} size="md" />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="truncate font-semibold text-slate-900 dark:text-white">{item.leadName}</p>
            {item.enquiryCategory && (
              <span className={clsx("rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide", CATEGORY_STYLES[item.enquiryCategory])}>
                {item.enquiryCategory}
              </span>
            )}
          </div>
          <p className="truncate text-xs text-slate-500 dark:text-slate-400">{item.phoneRaw}</p>
          <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-slate-400 dark:text-slate-500">
            <Car size={11} /> {item.carModel}
          </p>
        </div>
      </div>

      {/* Last follow-up remark */}
      <div className="min-w-0 flex-1">
        {item.lastFollowUp ? (
          <div className="flex items-start gap-1.5 text-xs text-slate-600 dark:text-slate-300">
            <span className="mt-0.5 inline-flex items-center gap-1 rounded-md bg-slate-100 px-1.5 py-0.5 font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              {FOLLOW_UP_TYPE_ICON[item.lastFollowUp.type]} {item.lastFollowUp.type}
            </span>
            <span className="line-clamp-2">{item.lastFollowUp.remark}</span>
          </div>
        ) : (
          <span className="text-xs italic text-slate-400 dark:text-slate-500">No follow-up logged yet</span>
        )}
      </div>

      {/* Meta: status, CR, due */}
      <div className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-1.5 sm:flex-col sm:items-end sm:gap-1.5">
        <StatusBadge status={item.status} />
        {canSeeOthers && item.assignedCr && (
          <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
            <UserIcon size={11} /> {item.assignedCr.name}
          </span>
        )}
        <span className={clsx("flex items-center gap-1 text-xs tabular-nums", due.className)}>
          <CalendarClock size={12} /> {due.label}
        </span>
      </div>
    </div>
  );
}

export const FollowUpRow = memo(FollowUpRowImpl);
