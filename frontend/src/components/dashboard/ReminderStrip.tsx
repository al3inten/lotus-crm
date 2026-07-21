import { memo } from "react";
import clsx from "clsx";
import { AlarmClock, CalendarClock, CalendarDays } from "lucide-react";
import { SURFACE } from "./DashboardPrimitives";
import { StatCell } from "./StatCell";

/* ── CR reminder ledger — overdue / today / this week, sourced server-side
   from the follow-ups module so it's scoped to the logged-in CR automatically ── */

function ReminderStripImpl({ stats }: { stats: { overdue: number; today: number; thisWeek: number } | undefined }) {
  return (
    <div
      className={clsx(
        SURFACE,
        "grid grid-cols-3 divide-x divide-slate-200/70 overflow-hidden dark:divide-white/[0.07]"
      )}
    >
      <StatCell label="Overdue" value={stats?.overdue ?? 0} icon={<AlarmClock strokeWidth={1.75} />} upIsGood={false} />
      <StatCell label="Due today" value={stats?.today ?? 0} icon={<CalendarClock strokeWidth={1.75} />} />
      <StatCell label="Due this week" value={stats?.thisWeek ?? 0} icon={<CalendarDays strokeWidth={1.75} />} />
    </div>
  );
}

export const ReminderStrip = memo(ReminderStripImpl);
