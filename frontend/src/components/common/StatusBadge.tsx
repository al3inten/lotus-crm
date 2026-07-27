import clsx from "clsx";
import { STATUS_LABELS } from "../../types";
import type { EnquiryStatus } from "../../types";

/** Single primary-blue family for every pipeline stage — progression reads via
 * increasing intensity (NEW lightest, DELIVERED strongest) instead of switching hues.
 * CLOSED/LOST stays neutral gray since it's an exit from the pipeline, not a stage in it. */
const STATUS_STYLES: Record<EnquiryStatus, string> = {
  NEW: "bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400",
  UNDER_FOLLOW_UP: "bg-primary-100 text-primary-700 dark:bg-primary-500/15 dark:text-primary-300",
  APPOINTMENT_FIXED: "bg-primary-200 text-primary-800 dark:bg-primary-500/25 dark:text-primary-200",
  TEST_DRIVE: "bg-primary-300 text-primary-900 dark:bg-primary-500/35 dark:text-primary-100",
  BOOKED: "bg-primary-400 text-white dark:bg-primary-500/50 dark:text-white",
  RETAIL_DONE: "bg-primary-500 text-white dark:bg-primary-500/70 dark:text-white",
  RTO_DONE: "bg-primary-600 text-white dark:bg-primary-500 dark:text-white",
  DELIVERED: "bg-primary-700 text-white dark:bg-primary-600 dark:text-white",
  CLOSED: "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
};

const WON_STYLE = "bg-primary-700 text-white dark:bg-primary-600 dark:text-white";

interface StatusBadgeProps {
  status: EnquiryStatus;
  /**
   * Pass the enquiry's lossReason wherever it's known so a CLOSED enquiry reads as
   * "WON" (green) instead of a generic red "CLOSED" that looks identical to a loss.
   * Omit this prop entirely (leave it undefined) if the caller genuinely doesn't have
   * it — that falls back to the plain CLOSED label rather than guessing WON.
   */
  lossReason?: string | null;
}

export function StatusBadge({ status, lossReason }: StatusBadgeProps) {
  const isWon = status === "CLOSED" && lossReason === null;
  const isLost = status === "CLOSED" && !!lossReason;
  const label = isWon ? "WON" : isLost ? "LOST" : STATUS_LABELS[status];
  const style = isWon ? WON_STYLE : STATUS_STYLES[status];

  return (
    <span className={clsx("inline-block rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap", style)}>
      {label}
    </span>
  );
}
