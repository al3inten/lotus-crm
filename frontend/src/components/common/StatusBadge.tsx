import clsx from "clsx";
import type { EnquiryStatus } from "../../types";

const STATUS_STYLES: Record<EnquiryStatus, string> = {
  NEW: "bg-blue-100 text-blue-800",
  CONTACTED: "bg-blue-100 text-blue-800",
  FOLLOW_UP: "bg-amber-100 text-amber-800",
  APPOINTMENT_SCHEDULED: "bg-purple-100 text-purple-800",
  APPOINTMENT_NO_SHOW: "bg-orange-100 text-orange-800",
  TEST_DRIVE_DONE: "bg-teal-100 text-teal-800",
  FEEDBACK_COLLECTED: "bg-cyan-100 text-cyan-800",
  QUOTATION_SHARED: "bg-sky-100 text-sky-800",
  NEGOTIATION: "bg-yellow-100 text-yellow-800",
  BOOKING_CONFIRMED: "bg-lime-100 text-lime-800",
  FINANCE_IN_PROGRESS: "bg-violet-100 text-violet-800",
  EXCHANGE_IN_PROGRESS: "bg-fuchsia-100 text-fuchsia-800",
  SALE_CLOSED: "bg-green-100 text-green-800",
  DELIVERY_IN_PROGRESS: "bg-emerald-100 text-emerald-800",
  DELIVERED: "bg-green-200 text-green-900",
  LOST: "bg-red-100 text-red-800",
};

export function StatusBadge({ status }: { status: EnquiryStatus }) {
  return (
    <span className={clsx("inline-block rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap", STATUS_STYLES[status])}>
      {status.replaceAll("_", " ")}
    </span>
  );
}
