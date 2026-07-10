import clsx from "clsx";
import type { EnquiryStatus } from "../../types";

const STATUS_STYLES: Record<EnquiryStatus, string> = {
  NEW: "bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-300",
  UNDER_FOLLOW_UP: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
  APPOINTMENT_FIXED: "bg-purple-100 text-purple-800 dark:bg-purple-500/15 dark:text-purple-300",
  TEST_DRIVE: "bg-teal-100 text-teal-800 dark:bg-teal-500/15 dark:text-teal-300",
  BOOKED: "bg-lime-100 text-lime-800 dark:bg-lime-500/15 dark:text-lime-300",
  RETAIL_DONE: "bg-green-200 text-green-900 dark:bg-green-500/15 dark:text-green-300",
  CLOSED: "bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300",
};

export function StatusBadge({ status }: { status: EnquiryStatus }) {
  return (
    <span className={clsx("inline-block rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap", STATUS_STYLES[status])}>
      {status.replaceAll("_", " ")}
    </span>
  );
}
