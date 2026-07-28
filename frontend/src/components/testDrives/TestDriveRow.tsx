import { memo } from "react";
import clsx from "clsx";
import { CalendarClock, Car, MapPin, Star, User as UserIcon } from "lucide-react";
import type { TestDriveItem } from "../../api/testDrives.api";
import { Avatar } from "../common/Avatar";

const STATUS_STYLES: Record<TestDriveItem["status"], string> = {
  OVERDUE: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300",
  UPCOMING: "bg-primary-100 text-primary-700 dark:bg-primary-500/15 dark:text-primary-300",
  COMPLETED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
};

const STATUS_LABELS: Record<TestDriveItem["status"], string> = {
  OVERDUE: "Overdue",
  UPCOMING: "Upcoming",
  COMPLETED: "Completed",
};

export function TestDriveStatusBadge({ status }: { status: TestDriveItem["status"] }) {
  return (
    <span className={clsx("inline-block rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap", STATUS_STYLES[status])}>
      {STATUS_LABELS[status]}
    </span>
  );
}

/** Human-readable scheduled date with an overdue/soon accent, mirroring the follow-up row. */
function scheduleMeta(iso: string | null, status: TestDriveItem["status"]): { label: string; className: string } {
  if (!iso) return { label: "Not scheduled yet", className: "text-slate-400 dark:text-slate-500 italic" };
  const date = new Date(iso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const day = new Date(date);
  day.setHours(0, 0, 0, 0);
  const days = Math.round((day.getTime() - today.getTime()) / 86_400_000);
  const dateStr = date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

  if (status === "OVERDUE") {
    const n = Math.abs(days);
    return { label: `${dateStr} · ${n} day${n === 1 ? "" : "s"} overdue`, className: "text-red-600 dark:text-red-400" };
  }
  if (days === 0) return { label: `${dateStr} · today`, className: "text-primary-600 dark:text-primary-400 font-semibold" };
  if (days === 1) return { label: `${dateStr} · tomorrow`, className: "text-violet-600 dark:text-violet-400" };
  return { label: dateStr, className: "text-slate-500 dark:text-slate-400" };
}

function TestDriveRowImpl({
  item,
  onOpen,
}: {
  item: TestDriveItem;
  onOpen: (item: TestDriveItem) => void;
}) {
  const schedule = item.completedAt
    ? { label: `Completed ${new Date(item.completedAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}`, className: "text-emerald-600 dark:text-emerald-400" }
    : scheduleMeta(item.scheduledAt, item.status);

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
      aria-label={`Open test drive for ${item.leadName}`}
      onClick={() => onOpen(item)}
      onKeyDown={onKey}
      className="group flex cursor-pointer flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-[0_12px_30px_rgb(0,0,0,0.07)] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-primary-500/40 sm:flex-row sm:items-center"
    >
      {/* Identity */}
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <Avatar name={item.leadName} size="md" />
        <div className="min-w-0">
          <p className="truncate font-semibold text-slate-900 dark:text-white">{item.leadName}</p>
          <p className="truncate text-xs text-slate-500 dark:text-slate-400">{item.phoneRaw}</p>
          <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-slate-400 dark:text-slate-500">
            <Car size={11} /> {item.carModel}
            {item.variant ? ` · ${item.variant}` : ""}
          </p>
        </div>
      </div>

      {/* Address / rating */}
      <div className="min-w-0 flex-1">
        {item.address ? (
          <div className="flex items-start gap-1.5 text-xs text-slate-600 dark:text-slate-300">
            <MapPin size={12} className="mt-0.5 shrink-0 text-slate-400" />
            <span className="line-clamp-2">{item.address}</span>
          </div>
        ) : (
          <span className="text-xs italic text-slate-400 dark:text-slate-500">No address logged</span>
        )}
        {item.rating != null && (
          <div className="mt-1 flex items-center gap-1 text-xs text-amber-500">
            <Star size={12} fill="currentColor" /> {item.rating}/5
          </div>
        )}
      </div>

      {/* Meta: status, CR/consultant, schedule */}
      <div className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-1.5 sm:flex-col sm:items-end sm:gap-1.5">
        <TestDriveStatusBadge status={item.status} />
        {item.assignedCr && (
          <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
            <UserIcon size={11} /> CR: {item.assignedCr.name}
          </span>
        )}
        {item.consultant && (
          <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
            <UserIcon size={11} /> Consultant: {item.consultant.name}
          </span>
        )}
        <span className={clsx("flex items-center gap-1 text-xs tabular-nums", schedule.className)}>
          <CalendarClock size={12} /> {schedule.label}
        </span>
      </div>
    </div>
  );
}

export const TestDriveRow = memo(TestDriveRowImpl);
