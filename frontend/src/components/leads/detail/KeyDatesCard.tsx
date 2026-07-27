import { motion } from "framer-motion";
import clsx from "clsx";
import { CalendarDays } from "lucide-react";
import { Card, CardHeader } from "../../../components/common/Card";
import { fadeUp } from "../../../lib/motion";

interface KeyDatesCardProps {
  keyDates: { label: string; value: Date | null }[];
  followUpUrgency: "overdue" | "today" | "future" | null;
  followUpDueAt?: string | null;
}

export function KeyDatesCard({ keyDates, followUpUrgency, followUpDueAt }: KeyDatesCardProps) {
  return (
    <motion.div variants={fadeUp}>
      <Card>
        <CardHeader
          icon={<CalendarDays size={18} />}
          iconClassName="bg-amber-50 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400"
          title="Key Dates"
        />
        <div className="flex flex-col text-sm">
          {keyDates.map((d) => (
            <div key={d.label} className="flex items-center justify-between border-b border-slate-100 py-2.5 last:border-0 dark:border-slate-700/50">
              <span className="text-slate-500 dark:text-slate-400">{d.label}</span>
              <span className="font-semibold tabular-nums text-slate-900 dark:text-white">{d.value ? d.value.toLocaleDateString() : "—"}</span>
            </div>
          ))}
          <div
            className={clsx(
              "-mx-6 mt-2 flex items-center justify-between px-6 py-3",
              followUpUrgency === "overdue"
                ? "bg-red-50/70 dark:bg-red-500/10"
                : followUpUrgency === "today"
                  ? "bg-amber-50/70 dark:bg-amber-500/10"
                  : "bg-primary-50/70 dark:bg-primary-500/10"
            )}
          >
            <span
              className={clsx(
                "font-medium",
                followUpUrgency === "overdue"
                  ? "text-red-900 dark:text-red-200"
                  : followUpUrgency === "today"
                    ? "text-amber-900 dark:text-amber-200"
                    : "text-primary-900 dark:text-primary-200"
              )}
            >
              Next Follow-up
            </span>
            <span
              className={clsx(
                "font-bold tabular-nums",
                followUpUrgency === "overdue"
                  ? "text-red-700 dark:text-red-300"
                  : followUpUrgency === "today"
                    ? "text-amber-700 dark:text-amber-300"
                    : "text-primary-700 dark:text-primary-300"
              )}
            >
              {followUpDueAt ? new Date(followUpDueAt).toLocaleDateString() : "—"}
            </span>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
