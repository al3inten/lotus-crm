import { Check, XCircle, Inbox, PhoneCall, CalendarCheck, Car, BadgeCheck, Trophy, Ban } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import clsx from "clsx";
import type { EnquiryStatus, EnquiryStatusHistoryEntry } from "../../types";

const MAIN_PATH: { status: EnquiryStatus; label: string; Icon: LucideIcon }[] = [
  { status: "NEW", label: "New", Icon: Inbox },
  { status: "UNDER_FOLLOW_UP", label: "Under Follow-up", Icon: PhoneCall },
  { status: "APPOINTMENT_FIXED", label: "Appointment Fixed", Icon: CalendarCheck },
  { status: "TEST_DRIVE", label: "Test Drive", Icon: Car },
  { status: "BOOKED", label: "Booked", Icon: BadgeCheck },
  { status: "RETAIL_DONE", label: "Retail Done", Icon: Trophy },
];

interface PipelineStepperProps {
  status: EnquiryStatus;
  lossReason?: string | null;
  statusHistory?: EnquiryStatusHistoryEntry[];
}

/**
 * Draws the main pipeline as a straight line, and — if the enquiry was closed —
 * forks off a branch to Cancelled/Won → Closed from whichever stage it actually
 * last reached, so it's obvious where in the funnel it dropped off.
 */
export function PipelineStepper({ status, lossReason, statusHistory }: PipelineStepperProps) {
  const isClosed = status === "CLOSED";
  const isLost = isClosed && !!lossReason;

  const reachedIndexes = (statusHistory ?? [])
    .map((h) => MAIN_PATH.findIndex((s) => s.status === h.toStatus))
    .filter((i) => i >= 0);
  const forkIndex = reachedIndexes.length ? Math.max(...reachedIndexes) : 0;
  const currentIndex = isClosed ? forkIndex : MAIN_PATH.findIndex((s) => s.status === status);
  const branchLeftPct = ((currentIndex + 0.5) / MAIN_PATH.length) * 100;

  return (
    <div className="flex flex-col">
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
                        index > currentIndex
                          ? "bg-slate-200 dark:bg-slate-700"
                          : index === currentIndex && isClosed
                            ? isLost
                              ? "bg-red-400"
                              : "bg-emerald-500"
                            : "bg-blue-500"
                      )}
                    />
                  )}
                  <div className="flex w-[72px] flex-col items-center gap-2 sm:w-24">
                    <span
                      className={clsx(
                        "relative flex h-10 w-10 items-center justify-center rounded-full transition-all",
                        done && "bg-blue-500 text-white shadow-sm shadow-blue-500/30",
                        current &&
                          !isClosed &&
                          "bg-blue-600 text-white shadow-md shadow-blue-600/40 ring-4 ring-blue-100 dark:ring-blue-500/25",
                        current &&
                          isClosed &&
                          (isLost
                            ? "bg-red-500 text-white shadow-md shadow-red-500/40 ring-4 ring-red-100 dark:ring-red-500/25"
                            : "bg-emerald-600 text-white shadow-md shadow-emerald-600/40 ring-4 ring-emerald-100 dark:ring-emerald-500/25"),
                        !done &&
                          !current &&
                          "border-2 border-slate-200 bg-white text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500"
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
                        current
                          ? isClosed
                            ? isLost
                              ? "font-semibold text-red-700 dark:text-red-300"
                              : "font-semibold text-emerald-700 dark:text-emerald-300"
                            : "font-semibold text-blue-700 dark:text-blue-300"
                          : done
                            ? "text-slate-600 dark:text-slate-300"
                            : "text-slate-400 dark:text-slate-500"
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

      {isClosed && (
        <div className="relative h-[78px]" style={{ marginLeft: `${branchLeftPct}%` }}>
          <div
            className={clsx(
              "absolute left-0 top-0 h-5 w-0.5 -translate-x-1/2",
              isLost ? "bg-red-300 dark:bg-red-500/40" : "bg-emerald-300 dark:bg-emerald-500/40"
            )}
          />
          <div className="absolute left-0 top-5 flex -translate-x-1/2 items-start">
            <div className="flex w-[72px] flex-col items-center gap-2 sm:w-24">
              <span
                className={clsx(
                  "flex h-9 w-9 items-center justify-center rounded-full text-white",
                  isLost ? "bg-red-500 shadow-sm shadow-red-500/30" : "bg-emerald-500 shadow-sm shadow-emerald-500/30"
                )}
              >
                {isLost ? <Ban size={16} /> : <Trophy size={16} />}
              </span>
              <span
                className={clsx(
                  "text-center text-[10px] font-semibold leading-tight sm:text-[11px]",
                  isLost ? "text-red-700 dark:text-red-300" : "text-emerald-700 dark:text-emerald-300"
                )}
              >
                {isLost ? "Cancelled" : "Won"}
              </span>
            </div>
            <div className={clsx("mt-[17px] h-0.5 w-7 rounded-full sm:w-11", isLost ? "bg-red-400" : "bg-emerald-400")} />
            <div className="flex w-[72px] flex-col items-center gap-2 sm:w-24">
              <span
                className={clsx(
                  "flex h-9 w-9 items-center justify-center rounded-full text-white ring-4",
                  isLost ? "bg-red-600 ring-red-100 dark:ring-red-500/25" : "bg-emerald-600 ring-emerald-100 dark:ring-emerald-500/25"
                )}
              >
                <XCircle size={16} />
              </span>
              <span
                className={clsx(
                  "text-center text-[10px] font-semibold leading-tight sm:text-[11px]",
                  isLost ? "text-red-700 dark:text-red-300" : "text-emerald-700 dark:text-emerald-300"
                )}
              >
                Closed
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
