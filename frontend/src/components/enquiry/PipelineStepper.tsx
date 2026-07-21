import { useState } from "react";
import { Check, Inbox, CalendarCheck, Car, BadgeCheck, Trophy, FileCheck2, Truck, Ban, Flag, MousePointerClick, CalendarDays, User2, MessageSquareText } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import clsx from "clsx";
import { ALLOWED_TRANSITIONS, type EnquiryStatus, type EnquiryStatusHistoryEntry } from "../../types";
import { Modal } from "../common/Modal";

// The stepper milestones. UNDER_FOLLOW_UP is deliberately NOT a node — it's a sub-state
// of the early journey, shown as a status badge on the "New" node instead.
const MAIN_PATH: { status: EnquiryStatus; label: string; Icon: LucideIcon }[] = [
  { status: "NEW", label: "New Lead", Icon: Inbox },
  { status: "APPOINTMENT_FIXED", label: "Appointment Fixed", Icon: CalendarCheck },
  { status: "TEST_DRIVE", label: "Test Drive", Icon: Car },
  { status: "BOOKED", label: "Booked", Icon: BadgeCheck },
  { status: "RETAIL_DONE", label: "Retail Done", Icon: Trophy },
  { status: "RTO_DONE", label: "RTO Done", Icon: FileCheck2 },
  { status: "DELIVERED", label: "Delivered", Icon: Truck },
];

// UNDER_FOLLOW_UP sits at the "New" milestone visually.
const statusToPathIndex = (status: EnquiryStatus) =>
  status === "UNDER_FOLLOW_UP" ? 0 : MAIN_PATH.findIndex((s) => s.status === status);

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
// Soft "cloud" backdrop behind each node — colour matches the node's tone.
const CLOUD: Record<NodeTone, string> = {
  blue: "bg-blue-400/20 dark:bg-blue-500/20",
  green: "bg-emerald-400/20 dark:bg-emerald-500/20",
  red: "bg-red-400/20 dark:bg-red-500/20",
  muted: "",
};
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
  onClick,
  clickable,
  hint,
}: {
  number: number;
  label: string;
  Icon: LucideIcon;
  tone: NodeTone;
  glow?: boolean;
  showCheck?: boolean;
  pill: StagePill;
  onClick?: () => void;
  clickable?: boolean;
  hint?: string;
}) {
  return (
    <div
      className={clsx(
        "relative flex w-20 flex-col items-center gap-1.5 p-1 sm:w-28",
        clickable && "group cursor-pointer transition-transform hover:-translate-y-0.5"
      )}
      onClick={clickable ? onClick : undefined}
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={clickable ? (e) => (e.key === "Enter" || e.key === " ") && onClick?.() : undefined}
      title={clickable ? hint ?? "Click to update status" : undefined}>
      {tone !== "muted" && (
        <span
          aria-hidden
          className={clsx(
            "pointer-events-none absolute -inset-3 -z-10 rounded-[999px] opacity-80 blur-xl transition-opacity duration-300",
            CLOUD[tone],
            clickable && "group-hover:opacity-100"
          )}
        />
      )}
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
      <span className={clsx("flex min-h-[28px] items-center text-center text-[11px] font-semibold leading-tight sm:min-h-[32px] sm:text-xs", LABEL[tone])}>{label}</span>
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
  onStageClick,
}: PipelineStepperProps) {
  const isClosed = status === "CLOSED";
  const isLost = isClosed && !!lossReason;
  const isUnderFollowUp = status === "UNDER_FOLLOW_UP";
  // Reaching Delivered means the sale is won — the whole pipeline turns green.
  const isDelivered = status === "DELIVERED";

  const reachedIndexes = (statusHistory ?? [])
    .map((h) => statusToPathIndex(h.toStatus))
    .filter((i) => i >= 0);
  const forkIndex = reachedIndexes.length ? Math.max(...reachedIndexes) : 0;
  const currentIndex = isClosed ? forkIndex : statusToPathIndex(status);

  // Which milestones the CR can jump to from here (server re-validates). Used to make the
  // stepper nodes clickable — the whole point of "click the pipeline to change status".
  const nextStatuses = ALLOWED_TRANSITIONS[status] ?? [];

  // Milestones booked at intake (appointment / test drive) light up their stage with a
  // "Booked" marker even if the status pointer hasn't advanced there yet.
  const bookedLabel: Partial<Record<EnquiryStatus, string>> = {
    ...(appointmentScheduled ? { APPOINTMENT_FIXED: "Booked" } : {}),
    ...(testDriveBooked ? { TEST_DRIVE: "Booked" } : {}),
  };

  const forkTone: NodeTone = isLost ? "red" : "green";
  // Show the "click a stage" hint only when there's actually somewhere to move to.
  const canChangeFromPipeline = !!onStageClick && !isClosed && !isDelivered && nextStatuses.length > 0;

  // A completed stage is clicked to view when/who/why it happened, not to change status.
  const [detailsStage, setDetailsStage] = useState<(typeof MAIN_PATH)[number] | null>(null);
  const detailsEntry = detailsStage ? (statusHistory ?? []).find((h) => h.toStatus === detailsStage.status) : undefined;

  return (
    <div className="flex flex-col">
      {canChangeFromPipeline && (
        <p className="mb-2 flex items-center gap-1.5 text-[11px] font-medium text-blue-600 dark:text-blue-400">
          <MousePointerClick size={12} />
          Click a highlighted stage to update the status
        </p>
      )}
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

              // Won (delivered) turns every reached stage green; a won-closed stage also goes
              // green; otherwise reached/active stages are blue and upcoming ones muted.
              const tone: NodeTone = upcoming
                ? booked
                  ? "blue"
                  : "muted"
                : isDelivered
                  ? "green"
                  : isClosed && current && !isLost
                    ? "green"
                    : "blue";
              const showCheck = done || (isClosed && current) || (isDelivered && current) || (!!booked && upcoming);
              const glow = current;

              const pill: StagePill = done
                ? { tone: "green", text: "Completed", check: true }
                : current
                  ? isDelivered
                    ? { tone: "green", text: "Won", check: true }
                    : isClosed
                      ? isLost
                        ? { tone: "blue", text: "Last stage" }
                        : { tone: "green", text: "Completed", check: true }
                      : // An enquiry being actively followed up shows that as its status on the New node.
                        isUnderFollowUp
                        ? { tone: "blue", text: "Under Follow-up" }
                        : { tone: "blue", text: "In progress" }
                  : booked
                    ? { tone: "blue", text: booked, check: true }
                    : { tone: "muted", text: "Pending" };

              // Colour the connector into a booked upcoming stage so the line reaches it.
              const connectorTone: NodeTone = index <= currentIndex ? tone : booked ? "blue" : "muted";

              // How a CR changes status straight from the pipeline:
              //  • the next allowed stage(s) → jump there (modal pre-targets that stage)
              //  • the CURRENT stage → open the status modal to pick any allowed move
              //    (incl. Closed/Lost or Under Follow-up)
              const canInteract = !!onStageClick && !isClosed && !isDelivered && nextStatuses.length > 0;
              const isNextStage = nextStatuses.includes(step.status);
              const canChangeStatus = canInteract && (current || isNextStage);
              // Past stages aren't a status-change target anymore — clicking one instead
              // opens a small "when/who/why" popup sourced from statusHistory.
              const clickable = canChangeStatus || done;
              const handleClick = canChangeStatus
                ? () => onStageClick?.(isNextStage ? step.status : undefined)
                : () => setDetailsStage(step);

              return (
                <div key={step.status} className="flex items-start">
                  {index > 0 && <Connector tone={connectorTone} />}
                  <StageNode
                    number={index + 1}
                    label={step.label}
                    Icon={Icon}
                    tone={tone}
                    glow={glow}
                    showCheck={showCheck}
                    pill={pill}
                    clickable={clickable}
                    hint={canChangeStatus ? undefined : "Click for stage details"}
                    onClick={handleClick}
                  />
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
                        <div className="w-20 shrink-0 sm:w-28" />
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
                              "absolute left-10 top-0 h-6 w-1 -translate-x-1/2 rounded-full sm:left-14",
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

      <Modal isOpen={!!detailsStage} onClose={() => setDetailsStage(null)} title={detailsStage?.label} maxWidth="max-w-sm">
        {detailsStage && (
          <div className="flex flex-col gap-3 text-sm">
            <div className="flex items-center gap-2.5 text-slate-600 dark:text-slate-300">
              <CalendarDays size={15} strokeWidth={1.75} className="shrink-0 text-slate-400 dark:text-slate-500" />
              {detailsEntry ? new Date(detailsEntry.createdAt).toLocaleString() : "Date not recorded"}
            </div>
            <div className="flex items-center gap-2.5 text-slate-600 dark:text-slate-300">
              <User2 size={15} strokeWidth={1.75} className="shrink-0 text-slate-400 dark:text-slate-500" />
              {detailsEntry?.changedBy?.name ?? "Unknown"}
            </div>
            {detailsEntry?.note && (
              <div className="flex items-start gap-2.5 text-slate-600 dark:text-slate-300">
                <MessageSquareText size={15} strokeWidth={1.75} className="mt-0.5 shrink-0 text-slate-400 dark:text-slate-500" />
                <p className="leading-relaxed">{detailsEntry.note}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
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
  /** Called when a CR clicks a pipeline node to change status — with the target stage for a
   * next-stage node, or undefined for the current node (opens the modal to pick any move). */
  onStageClick?: (status?: EnquiryStatus) => void;
}
