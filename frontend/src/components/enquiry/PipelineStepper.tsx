import { Check, XCircle } from "lucide-react";
import clsx from "clsx";
import type { EnquiryStatus } from "../../types";

const MAIN_PATH: { status: EnquiryStatus; label: string }[] = [
  { status: "NEW", label: "New" },
  { status: "UNDER_FOLLOW_UP", label: "Under Follow-up" },
  { status: "APPOINTMENT_FIXED", label: "Appointment Fixed" },
  { status: "TEST_DRIVE", label: "Test Drive" },
  { status: "BOOKED", label: "Booked" },
  { status: "RETAIL_DONE", label: "Retail Done" },
];

export function PipelineStepper({ status, lossReason }: { status: EnquiryStatus; lossReason?: string | null }) {
  if (status === "CLOSED") {
    if (lossReason) {
      return (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <XCircle size={18} className="text-red-500" />
          <p className="text-sm font-medium text-red-700">This enquiry was lost — see the timeline below for the reason.</p>
        </div>
      );
    } else {
      return (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3">
          <Check size={18} className="text-green-600" />
          <p className="text-sm font-medium text-green-800">This enquiry was successfully won and closed.</p>
        </div>
      );
    }
  }

  const currentIndex = MAIN_PATH.findIndex((s) => s.status === status);

  return (
    <div className="relative min-w-0">
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
                      "flex items-center justify-center rounded-full text-[11px] font-semibold transition-colors",
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
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {/* Fade hints signal there's more of the stepper to scroll to — otherwise it reads as "cut off". */}
      <div className="pointer-events-none absolute left-0 top-0 h-full w-6 bg-gradient-to-r from-white to-transparent" />
      <div className="pointer-events-none absolute right-0 top-0 h-full w-6 bg-gradient-to-l from-white to-transparent" />
    </div>
  );
}
