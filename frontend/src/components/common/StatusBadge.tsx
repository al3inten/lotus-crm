import clsx from "clsx";
import { STATUS_LABELS } from "../../types";
import type { EnquiryStatus } from "../../types";

const STATUS_STYLES: Record<EnquiryStatus, string> = {
  NEW: "bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-300",
  UNDER_FOLLOW_UP: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
  APPOINTMENT_FIXED: "bg-purple-100 text-purple-800 dark:bg-purple-500/15 dark:text-purple-300",
  TEST_DRIVE: "bg-teal-100 text-teal-800 dark:bg-teal-500/15 dark:text-teal-300",
  BOOKED: "bg-lime-100 text-lime-800 dark:bg-lime-500/15 dark:text-lime-300",
  RETAIL_DONE: "bg-green-200 text-green-900 dark:bg-green-500/15 dark:text-green-300",
  RTO_DONE: "bg-cyan-100 text-cyan-800 dark:bg-cyan-500/15 dark:text-cyan-300",
  DELIVERED: "bg-emerald-200 text-emerald-900 dark:bg-emerald-500/15 dark:text-emerald-300",
  CLOSED: "bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300",
};

const WON_STYLE = "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300";

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
