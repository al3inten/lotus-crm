import clsx from "clsx";
import type { EnquiryStatus } from "../../types";

const STATUS_STYLES: Record<EnquiryStatus, string> = {
  NEW: "bg-blue-100 text-blue-800",
  UNDER_FOLLOW_UP: "bg-amber-100 text-amber-800",
  APPOINTMENT_FIXED: "bg-purple-100 text-purple-800",
  TEST_DRIVE: "bg-teal-100 text-teal-800",
  BOOKED: "bg-lime-100 text-lime-800",
  RETAIL_DONE: "bg-green-200 text-green-900",
  CLOSED: "bg-red-100 text-red-800",
};

export function StatusBadge({ status }: { status: EnquiryStatus }) {
  return (
    <span className={clsx("inline-block rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap", STATUS_STYLES[status])}>
      {status.replaceAll("_", " ")}
    </span>
  );
}
