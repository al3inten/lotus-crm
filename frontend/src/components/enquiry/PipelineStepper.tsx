import { Check, XCircle, PhoneOutgoing, CalendarX, Banknote, Repeat } from "lucide-react";
import clsx from "clsx";
import type { EnquiryStatus } from "../../types";

// The main journey a deal walks through. Detour states (FOLLOW_UP, NO_SHOW,
// FINANCE/EXCHANGE) are shown as a contextual chip on their parent step instead of
// crowding the stepper.
const MAIN_PATH: { status: EnquiryStatus; label: string }[] = [
  { status: "NEW", label: "New" },
  { status: "CONTACTED", label: "Contacted" },
  { status: "APPOINTMENT_SCHEDULED", label: "Appointment" },
  { status: "TEST_DRIVE_DONE", label: "Test Drive" },
  { status: "FEEDBACK_COLLECTED", label: "Feedback" },
  { status: "QUOTATION_SHARED", label: "Quotation" },
  { status: "NEGOTIATION", label: "Negotiation" },
  { status: "BOOKING_CONFIRMED", label: "Booking" },
  { status: "SALE_CLOSED", label: "Sale Closed" },
  { status: "DELIVERY_IN_PROGRESS", label: "Delivery" },
  { status: "DELIVERED", label: "Delivered" },
];

// Where a detour state sits on the main path (index of the step it belongs to).
const DETOUR_ANCHOR: Partial<Record<EnquiryStatus, { anchorIndex: number; label: string; icon: React.ReactNode }>> = {
  FOLLOW_UP: { anchorIndex: 1, label: "In Follow-up", icon: <PhoneOutgoing size={12} /> },
  APPOINTMENT_NO_SHOW: { anchorIndex: 2, label: "No-show", icon: <CalendarX size={12} /> },
  FINANCE_IN_PROGRESS: { anchorIndex: 7, label: "Finance in progress", icon: <Banknote size={12} /> },
  EXCHANGE_IN_PROGRESS: { anchorIndex: 7, label: "Exchange in progress", icon: <Repeat size={12} /> },
};

export function PipelineStepper({ status }: { status: EnquiryStatus }) {
  if (status === "LOST") {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
        <XCircle size={18} className="text-red-500" />
        <p className="text-sm font-medium text-red-700">This enquiry was marked Lost — see the timeline below for the reason.</p>
      </div>
    );
  }

  const detour = DETOUR_ANCHOR[status];
  const currentIndex = detour ? detour.anchorIndex : MAIN_PATH.findIndex((s) => s.status === status);

  return (
    <div className="overflow-x-auto pb-1">
      <div className="flex min-w-max items-start">
        {MAIN_PATH.map((step, index) => {
          const done = index < currentIndex;
          const current = index === currentIndex;
          return (
            <div key={step.status} className="flex items-start">
              {index > 0 && (
                <div className={clsx("mt-3 h-0.5 w-6 sm:w-9", index <= currentIndex ? "bg-blue-500" : "bg-gray-200")} />
              )}
              <div className="flex w-16 flex-col items-center gap-1.5 sm:w-20">
                <span
                  className={clsx(
                    "flex h-6.5 w-6.5 items-center justify-center rounded-full text-[11px] font-semibold transition-colors",
                    done && "bg-blue-500 text-white",
                    current && "bg-blue-600 text-white ring-4 ring-blue-100",
                    !done && !current && "border-2 border-gray-200 bg-white text-gray-400"
                  )}
                  style={{ height: 26, width: 26 }}
                >
                  {done ? <Check size={13} strokeWidth={3} /> : index + 1}
                </span>
                <span
                  className={clsx(
                    "text-center text-[10px] leading-tight sm:text-[11px]",
                    current ? "font-semibold text-blue-700" : done ? "text-gray-600" : "text-gray-400"
                  )}
                >
                  {step.label}
                </span>
                {current && detour && (
                  <span className="flex items-center gap-1 whitespace-nowrap rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-medium text-violet-700">
                    {detour.icon}
                    {detour.label}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
