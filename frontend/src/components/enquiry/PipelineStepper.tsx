import { Check, XCircle, Inbox, PhoneCall, CalendarCheck, Car, BadgeCheck, Trophy } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import clsx from "clsx";
import type { EnquiryStatus } from "../../types";

const MAIN_PATH: { status: EnquiryStatus; label: string; Icon: LucideIcon }[] = [
  { status: "NEW", label: "New", Icon: Inbox },
  { status: "UNDER_FOLLOW_UP", label: "Under Follow-up", Icon: PhoneCall },
  { status: "APPOINTMENT_FIXED", label: "Appointment Fixed", Icon: CalendarCheck },
  { status: "TEST_DRIVE", label: "Test Drive", Icon: Car },
  { status: "BOOKED", label: "Booked", Icon: BadgeCheck },
  { status: "RETAIL_DONE", label: "Retail Done", Icon: Trophy },
];

export function PipelineStepper({ status, lossReason }: { status: EnquiryStatus; lossReason?: string | null }) {
  if (status === "CLOSED") {
    if (lossReason) {
      return (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 dark:border-red-500/25 dark:bg-red-500/10">
          <XCircle size={18} className="text-red-500 dark:text-red-400" />
          <p className="text-sm font-medium text-red-700 dark:text-red-300">This enquiry was lost — see the timeline below for the reason.</p>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-500/25 dark:bg-emerald-500/10">
        <Trophy size={18} className="text-emerald-600 dark:text-emerald-400" />
        <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">This enquiry was successfully won and closed. 🎉</p>
      </div>
    );
  }

  const currentIndex = MAIN_PATH.findIndex((s) => s.status === status);

  return (
    <div className="relative min-w-0">
      <div className="overflow-x-auto pb-1">
        <div className="flex min-w-max items-start">
          {MAIN_PATH.map((step, index) => {
            const done = index < currentIndex;
            const current = index === currentIndex;
            const { Icon } = step;
            return (
              <div key={step.status} className="flex items-start">
                {index > 0 && (
                  <div
                    className={clsx(
                      "mt-[19px] h-0.5 w-7 rounded-full sm:w-11",
                      index <= currentIndex ? "bg-blue-500" : "bg-slate-200 dark:bg-slate-700"
                    )}
                  />
                )}
                <div className="flex w-[72px] flex-col items-center gap-2 sm:w-24">
                  <span
                    className={clsx(
                      "relative flex h-10 w-10 items-center justify-center rounded-full transition-all",
                      done && "bg-blue-500 text-white shadow-sm shadow-blue-500/30",
                      current && "bg-blue-600 text-white shadow-md shadow-blue-600/40 ring-4 ring-blue-100 dark:ring-blue-500/25",
                      !done && !current && "border-2 border-slate-200 bg-white text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500"
                    )}
                  >
                    <Icon size={18} strokeWidth={done || current ? 2.2 : 2} />
                    {done && (
                      <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white ring-2 ring-white dark:ring-slate-800">
                        <Check size={9} strokeWidth={4} />
                      </span>
                    )}
                  </span>
                  <span
                    className={clsx(
                      "text-center text-[10px] leading-tight sm:text-[11px]",
                      current ? "font-semibold text-blue-700 dark:text-blue-300" : done ? "text-slate-600 dark:text-slate-300" : "text-slate-400 dark:text-slate-500"
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
      <div className="pointer-events-none absolute left-0 top-0 h-full w-6 bg-gradient-to-r from-white to-transparent dark:from-slate-900" />
      <div className="pointer-events-none absolute right-0 top-0 h-full w-6 bg-gradient-to-l from-white to-transparent dark:from-slate-900" />
    </div>
  );
}
