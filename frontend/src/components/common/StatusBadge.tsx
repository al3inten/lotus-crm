import clsx from "clsx";
import { STATUS_LABELS } from "../../types";
import type { EnquiryStatus } from "../../types";

/** Single primary-blue family for every pipeline stage — progression reads via
 * increasing intensity (NEW lightest, DELIVERED strongest) instead of switching hues.
 * DELIVERED ("Win") stays the strongest blue/green; CLOSED_TEMP and LOST are exits from
 * the pipeline, not stages in it, so they get neutral/red treatment instead. */
const STATUS_STYLES: Record<EnquiryStatus, string> = {
  NEW: "bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400",
  UNDER_FOLLOW_UP: "bg-primary-100 text-primary-700 dark:bg-primary-500/15 dark:text-primary-300",
  APPOINTMENT_FIXED: "bg-primary-200 text-primary-800 dark:bg-primary-500/25 dark:text-primary-200",
  TEST_DRIVE: "bg-primary-300 text-primary-900 dark:bg-primary-500/35 dark:text-primary-100",
  BOOKED: "bg-primary-400 text-white dark:bg-primary-500/50 dark:text-white",
  RETAIL_DONE: "bg-primary-500 text-white dark:bg-primary-500/70 dark:text-white",
  RTO_DONE: "bg-primary-600 text-white dark:bg-primary-500 dark:text-white",
  DELIVERED: "bg-emerald-600 text-white dark:bg-emerald-500 dark:text-white",
  CLOSED_TEMP: "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
  LOST: "bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300",
};

interface StatusBadgeProps {
  status: EnquiryStatus;
  /** Pass "pending" while the CR is mid-way through picking a Lost reason in the status
   * modal, so the preview badge still reads as a loss before the reason is chosen. */
  lossReason?: string | null;
}

export function StatusBadge({ status, lossReason }: StatusBadgeProps) {
  const label = status === "LOST" && lossReason ? "LOST" : STATUS_LABELS[status];

  return (
    <span className={clsx("inline-block rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap", STATUS_STYLES[status])}>
      {label}
    </span>
  );
}
