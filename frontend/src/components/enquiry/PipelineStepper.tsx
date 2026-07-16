import { Check, Inbox, PhoneCall, CalendarCheck, Car, BadgeCheck, Trophy, Ban, Flag } from "lucide-react";
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

type NodeTone = "blue" | "green" | "red" | "muted";

const CIRCLE: Record<NodeTone, string> = {
  blue: "bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-500/25",
  green: "bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/25",
  red: "bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-md shadow-red-500/25",
  muted: "border-2 border-slate-200 bg-white text-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-600",
};
const RING: Record<NodeTone, string> = {
  blue: "ring-4 ring-blue-600/20 dark:ring-blue-500/25",
  green: "ring-4 ring-emerald-600/20 dark:ring-emerald-500/25",
  red: "ring-4 ring-red-600/20 dark:ring-red-500/25",
  muted: "",
};
const GLOW: Record<NodeTone, string> = {
  blue: "bg-blue-500/20",
  green: "bg-emerald-500/20",
  red: "bg-red-500/20",
  muted: "bg-transparent",
};
const CHECK: Record<NodeTone, string> = { blue: "bg-blue-600", green: "bg-emerald-600", red: "bg-red-600", muted: "bg-slate-400" };
const NUMBER_COLOR: Record<NodeTone, string> = {
  blue: "text-blue-700 dark:text-blue-400",
  green: "text-emerald-700 dark:text-emerald-400",
  red: "text-red-700 dark:text-red-400",
  muted: "text-slate-500 dark:text-slate-400",
};
const LABEL: Record<NodeTone, string> = {
  blue: "text-slate-900 font-bold dark:text-slate-100",
  green: "text-emerald-800 font-bold dark:text-emerald-300",
  red: "text-red-800 font-bold dark:text-red-300",
  muted: "text-slate-500 font-medium dark:text-slate-400",
};
const PILL: Record<NodeTone, string> = {
  blue: "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-200",
  green: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200",
  red: "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-200",
  muted: "bg-slate-100/70 text-slate-400 dark:bg-slate-800/50 dark:text-slate-500",
};
const CONNECTOR: Record<NodeTone, string> = {
  blue: "bg-blue-500 shadow-sm shadow-blue-500/20",
  green: "bg-emerald-500 shadow-sm shadow-emerald-500/20",
  red: "bg-red-500 shadow-sm shadow-red-500/20",
  muted: "bg-slate-200 dark:bg-slate-700",
};

interface StagePill {
  tone: NodeTone;
  text: string;
  check?: boolean;
}

/** One stage: number badge on top, gradient icon disc (with a check badge when reached),
 * label, and a status pill — the vocabulary from the reference design. */
function StageNode({
  number,
  label,
  Icon,
  tone,
  glow,
  showCheck,
  pill,
}: {
  number: number;
  label: string;
  Icon: LucideIcon;
  tone: NodeTone;
  glow?: boolean;
  showCheck?: boolean;
  pill: StagePill;
}) {
  return (
    <div className="flex w-[76px] flex-col items-center gap-1.5 sm:w-24">
      <span className={clsx("flex h-4 items-center text-[11px] font-bold leading-none", NUMBER_COLOR[tone])}>{number}</span>
      <span className="relative flex h-9 w-9 items-center justify-center">
        {glow && (
          <span className={clsx("pointer-events-none absolute -inset-1.5 -z-10 rounded-full blur-md", GLOW[tone])} />
        )}
        <span
          className={clsx(
            "flex h-9 w-9 items-center justify-center rounded-full transition-all duration-200",
            CIRCLE[tone],
            glow && RING[tone],
            glow && "scale-110"
          )}
        >
          <Icon size={16} strokeWidth={2.2} />
        </span>
        {showCheck && (
          <span
            className={clsx(
              "absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full text-white ring-2 ring-white dark:ring-slate-900",
              CHECK[tone]
            )}
          >
            <Check size={8} strokeWidth={4} />
          </span>
        )}
      </span>
      <span className={clsx("text-center text-[11px] font-semibold leading-tight sm:text-xs", LABEL[tone])}>{label}</span>
      <span className={clsx("inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[9px] font-semibold sm:text-[10px]", PILL[pill.tone])}>
        {pill.check && <Check size={8} strokeWidth={4} />}
        {pill.text}
      </span>
    </div>
  );
}

function Connector({ tone }: { tone: NodeTone }) {
  return <div className={clsx("mt-[38px] h-[3px] w-8 shrink-0 rounded-full sm:w-12", CONNECTOR[tone])} />;
}

/**
 * Draws the main pipeline as a straight line, and — if the enquiry was closed —
 * forks off a branch to Cancelled/Won → Closed from whichever stage it actually
 * last reached, so it's obvious where in the funnel it dropped off.
 */
export function PipelineStepper({
  status,
  lossReason,
  statusHistory,
  appointmentScheduled,
  testDriveBooked,
}: PipelineStepperProps) {
  const isClosed = status === "CLOSED";
  const isLost = isClosed && !!lossReason;

  const reachedIndexes = (statusHistory ?? [])
    .map((h) => MAIN_PATH.findIndex((s) => s.status === h.toStatus))
    .filter((i) => i >= 0);
  const forkIndex = reachedIndexes.length ? Math.max(...reachedIndexes) : 0;
  const currentIndex = isClosed ? forkIndex : MAIN_PATH.findIndex((s) => s.status === status);

  // Milestones booked at intake (appointment / test drive) light up their stage with a
  // "Booked" marker even if the status pointer hasn't advanced there yet.
  const bookedLabel: Partial<Record<EnquiryStatus, string>> = {
    ...(appointmentScheduled ? { APPOINTMENT_FIXED: "Booked" } : {}),
    ...(testDriveBooked ? { TEST_DRIVE: "Booked" } : {}),
  };

  const forkTone: NodeTone = isLost ? "red" : "green";

  return (
    <div className="flex flex-col">
      <div className="relative min-w-0">
        <div className="overflow-x-auto pb-4">
          <div className="flex min-w-max flex-col">
            <div className="flex items-start">
              {MAIN_PATH.map((step, index) => {
              const done = index < currentIndex;
              const current = index === currentIndex;
              const upcoming = index > currentIndex;
              const booked = bookedLabel[step.status];
              const { Icon } = step;

              // The stage that a won deal ends on turns green; a dropped/active stage stays blue.
              // An upcoming stage with a booked milestone lights up blue instead of muted.
              const tone: NodeTone = upcoming ? (booked ? "blue" : "muted") : isClosed && current && !isLost ? "green" : "blue";
              const showCheck = done || (isClosed && current) || (!!booked && upcoming);
              const glow = current;

              const pill: StagePill = done
                ? { tone: "green", text: "Completed", check: true }
                : current
                  ? isClosed
                    ? isLost
                      ? { tone: "blue", text: "Last stage" }
                      : { tone: "green", text: "Completed", check: true }
                    : { tone: "blue", text: "In progress" }
                  : booked
                    ? { tone: "blue", text: booked, check: true }
                    : { tone: "muted", text: "Pending" };

              // Colour the connector into a booked upcoming stage so the line reaches it.
              const connectorTone: NodeTone = index <= currentIndex ? tone : booked ? "blue" : "muted";

              return (
                <div key={step.status} className="flex items-start">
                  {index > 0 && <Connector tone={connectorTone} />}
                  <StageNode number={index + 1} label={step.label} Icon={Icon} tone={tone} glow={glow} showCheck={showCheck} pill={pill} />
                </div>
              );
            })}
            </div>

            {isClosed && (
              <div className="relative mt-1 flex items-start">
                {MAIN_PATH.map((step, index) => {
                  if (index < currentIndex) {
                    return (
                      <div key={step.status} className="flex shrink-0">
                        {index > 0 && <div className="w-8 shrink-0 sm:w-12" />}
                        <div className="w-[76px] shrink-0 sm:w-24" />
                      </div>
                    );
                  }
                  if (index === currentIndex) {
                    return (
                      <div key={step.status} className="flex shrink-0">
                        {index > 0 && <div className="w-8 shrink-0 sm:w-12" />}
                        <div className="relative">
                          {/* Vertical drop centered under the stage the enquiry was closed from,
                              so the branch clearly forks out of that exact stage. */}
                          <span
                            className={clsx(
                              "absolute left-[38px] top-0 h-6 w-1 -translate-x-1/2 rounded-full sm:left-12",
                              isLost ? "bg-red-500 dark:bg-red-500/70" : "bg-emerald-500 dark:bg-emerald-500/70"
                            )}
                            aria-hidden
                          />
                          <div className="flex items-start pt-[26px]">
                            <StageNode
                              number={MAIN_PATH.length + 1}
                              label={isLost ? "Cancelled" : "Won"}
                              Icon={isLost ? Ban : Trophy}
                              tone={forkTone}
                              showCheck
                              pill={isLost ? { tone: "red", text: "Lost" } : { tone: "green", text: "Completed", check: true }}
                            />
                            <Connector tone={forkTone} />
                            <StageNode
                              number={MAIN_PATH.length + 2}
                              label="Closed"
                              Icon={Flag}
                              tone={forkTone}
                              glow
                              showCheck
                              pill={{ tone: forkTone, text: isLost ? "Closed" : "Completed", check: !isLost }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            )}
          </div>
        </div>
        {/* Fade hints signal there's more of the stepper to scroll to — otherwise it reads as "cut off". */}
        <div className="pointer-events-none absolute left-0 top-0 h-full w-6 bg-gradient-to-r from-white to-transparent dark:from-slate-900" />
        <div className="pointer-events-none absolute right-0 top-0 h-full w-6 bg-gradient-to-l from-white to-transparent dark:from-slate-900" />
      </div>
    </div>
  );
}

interface PipelineStepperProps {
  status: EnquiryStatus;
  lossReason?: string | null;
  statusHistory?: EnquiryStatusHistoryEntry[];
  /** Appointment booked at intake — marks the Appointment stage even before the status moves there. */
  appointmentScheduled?: boolean;
  /** Test drive booked/interested — marks the Test Drive stage similarly. */
  testDriveBooked?: boolean;
}
