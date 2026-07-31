import { useState } from "react";
import { Inbox, CalendarCheck, Car, BadgeCheck, Trophy, FileCheck2, Truck, MousePointerClick } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ALLOWED_TRANSITIONS, type Enquiry, type EnquiryStatus, type EnquiryStatusHistoryEntry } from "../../types";
import { StageCard, type StageTone, type StagePill, type StageDetailPreviewRow } from "./StageCard";
import { StagePanel } from "./StagePanel";
import { OffRampPills } from "./OffRampPills";

// The stepper milestones. UNDER_FOLLOW_UP is deliberately NOT a node — it's a sub-state
// of the early journey, shown as a status badge on the "New" node instead.
const MAIN_PATH: { status: EnquiryStatus; label: string; Icon: LucideIcon }[] = [
  { status: "NEW", label: "New Lead", Icon: Inbox },
  { status: "APPOINTMENT_FIXED", label: "Appointment Fixed", Icon: CalendarCheck },
  { status: "TEST_DRIVE", label: "Test Drive", Icon: Car },
  { status: "BOOKED", label: "Booking", Icon: BadgeCheck },
  { status: "RETAIL_DONE", label: "Retail", Icon: Trophy },
  { status: "RTO_DONE", label: "RTO", Icon: FileCheck2 },
  { status: "DELIVERED", label: "Delivered", Icon: Truck },
];

// UNDER_FOLLOW_UP sits at the "New" milestone visually.
const statusToPathIndex = (status: EnquiryStatus) =>
  status === "UNDER_FOLLOW_UP" ? 0 : MAIN_PATH.findIndex((s) => s.status === status);

// What actually happened during each stage, pulled from the enquiry's own records rather
// than statusHistory (which only knows the status transition, not the stage's content).
function stageDetails(status: EnquiryStatus, enquiry?: Enquiry): StageDetailPreviewRow[] {
  if (!enquiry) return [];
  switch (status) {
    case "NEW":
      return [
        { label: "Source", value: enquiry.source },
        ...(enquiry.subsource ? [{ label: "Subsource", value: enquiry.subsource }] : []),
        ...(enquiry.referrerName ? [{ label: "Referrer", value: enquiry.referrerName }] : []),
      ];
    case "APPOINTMENT_FIXED":
      return enquiry.appointmentAt
        ? [{ label: "Appointment", value: new Date(enquiry.appointmentAt).toLocaleString() }]
        : [];
    case "TEST_DRIVE": {
      // testDriveFeedbacks comes from the API ordered createdAt desc — [0] is the latest.
      const td = enquiry.testDriveFeedbacks?.[0];
      if (!td) return [];
      return [
        ...(td.carModel ? [{ label: "Vehicle", value: td.variant ? `${td.carModel} (${td.variant})` : td.carModel }] : []),
        ...(td.completedAt ? [{ label: "Completed", value: new Date(td.completedAt).toLocaleString() }] : []),
        ...(td.rating ? [{ label: "Rating", value: `${td.rating}/5` }] : []),
        ...(td.comments ? [{ label: "Feedback", value: td.comments }] : []),
      ];
    }
    case "BOOKED": {
      const rows: StageDetailPreviewRow[] = [];
      if (enquiry.quotation) rows.push({ label: "Final price", value: enquiry.quotation.finalPrice });
      if (enquiry.exchangeEvaluation) {
        rows.push({
          label: "Exchange",
          value: `${enquiry.exchangeEvaluation.oldCarMake} ${enquiry.exchangeEvaluation.oldCarModel} · ${enquiry.exchangeEvaluation.valuationAmount}`,
        });
      }
      if (enquiry.financeRequired) rows.push({ label: "Finance", value: enquiry.financeApplication?.status ?? "Required" });
      if (enquiry.bookedAt) rows.push({ label: "Booked on", value: new Date(enquiry.bookedAt).toLocaleString() });
      return rows;
    }
    case "RETAIL_DONE":
      return enquiry.retailDoneAt ? [{ label: "Retail done", value: new Date(enquiry.retailDoneAt).toLocaleString() }] : [];
    case "RTO_DONE":
      return [
        ...(enquiry.rtoDoneAt ? [{ label: "RTO done", value: new Date(enquiry.rtoDoneAt).toLocaleString() }] : []),
        ...(enquiry.colour ? [{ label: "Colour", value: enquiry.colour }] : []),
      ];
    case "DELIVERED": {
      const d = enquiry.deliveryDetails;
      if (!d) return enquiry.deliveredAt ? [{ label: "Delivered", value: new Date(enquiry.deliveredAt).toLocaleString() }] : [];
      return [
        { label: "Delivered", value: d.deliveredAt ? new Date(d.deliveredAt).toLocaleString() : "—" },
        { label: "RC transfer", value: d.rcTransferDone ? "Done" : "Pending" },
        { label: "Insurance", value: d.insuranceDone ? "Done" : "Pending" },
        { label: "Accessories", value: d.accessoriesFitted ? "Fitted" : "Pending" },
        ...(d.notes ? [{ label: "Notes", value: d.notes }] : []),
      ];
    }
    default:
      return [];
  }
}

/** Draws the main pipeline as a row of premium stage cards, with off-ramp pills for
 * Lost/Closed Temporarily below it, and an expanding contextual panel underneath whichever
 * card was last clicked. All status-change semantics (which nodes are clickable, what
 * clicking them does) are unchanged from before — only the presentation layer changed. */
export function PipelineStepper({
  status,
  statusHistory,
  appointmentScheduled,
  testDriveBooked,
  onStageClick,
  enquiry,
}: PipelineStepperProps) {
  const isLost = status === "LOST";
  const isClosedTemp = status === "CLOSED_TEMP";
  const isClosedLegacy = (status as string) === "CLOSED";
  const isClosed = isLost || isClosedTemp || isClosedLegacy;
  const isUnderFollowUp = status === "UNDER_FOLLOW_UP";
  // Reaching Delivered means the sale is won — the whole pipeline turns green.
  const isDelivered = status === "DELIVERED";

  const reachedIndexes = (statusHistory ?? [])
    .map((h) => statusToPathIndex(h.toStatus))
    .filter((i) => i >= 0);
  const forkIndex = reachedIndexes.length ? Math.max(...reachedIndexes) : 0;
  const currentIndex = isClosed ? forkIndex : statusToPathIndex(status);

  // Which milestones the CR can jump to from here (server re-validates).
  const nextStatuses = ALLOWED_TRANSITIONS[status] ?? [];

  // Milestones booked at intake (appointment / test drive) light up their stage with a
  // "Booked" marker even if the status pointer hasn't advanced there yet.
  const bookedLabel: Partial<Record<EnquiryStatus, string>> = {
    ...(appointmentScheduled ? { APPOINTMENT_FIXED: "Booked" } : {}),
    ...(testDriveBooked ? { TEST_DRIVE: "Booked" } : {}),
  };

  const canChangeFromPipeline = !!onStageClick && !isClosed && !isDelivered && nextStatuses.length > 0;

  // Whichever card's panel is currently expanded below the track.
  const [openStage, setOpenStage] = useState<(typeof MAIN_PATH)[number] | null>(null);
  const openHistoryEntry = openStage ? (statusHistory ?? []).find((h) => h.toStatus === openStage.status) : undefined;
  const openDetailRows = openStage ? stageDetails(openStage.status, enquiry) : [];
  const openIsCurrentStage = openStage ? openStage.status === status || (isUnderFollowUp && openStage.status === "NEW") : false;
  // A card that isn't the current stage but IS one of its valid next moves gets a single
  // direct "Move to X" CTA — preserves the original one-click jump from a next-stage node.
  const openIsNextStage =
    !!openStage && !openIsCurrentStage && !isClosed && !isDelivered && !!onStageClick && nextStatuses.includes(openStage.status);

  const handleMoveTo = (target?: EnquiryStatus) => {
    onStageClick?.(target);
    setOpenStage(null);
  };

  return (
    <div className="flex flex-col">
      {canChangeFromPipeline && (
        <p className="mb-2 flex items-center gap-1.5 text-[11px] font-medium text-primary-600 dark:text-primary-400">
          <MousePointerClick size={12} />
          Click a highlighted stage to update the status
        </p>
      )}

      <div className="relative min-w-0">
        <div className="flex snap-x gap-3 overflow-x-auto pb-2">
          {MAIN_PATH.map((step, index) => {
            const done = index < currentIndex;
            const current = index === currentIndex;
            const upcoming = index > currentIndex;
            const booked = bookedLabel[step.status];

            // Won (delivered) turns every reached stage green; otherwise reached/active
            // stages are blue and upcoming ones muted.
            const tone: StageTone = upcoming ? (booked ? "blue" : "muted") : isDelivered ? "green" : "blue";
            const showCheck = done || (isClosed && current) || (isDelivered && current) || (!!booked && upcoming);

            const pill: StagePill = done
              ? { tone: "green", text: "Completed", check: true }
              : current
                ? isDelivered
                  ? { tone: "green", text: "Won", check: true }
                  : isClosed
                    ? { tone: "blue", text: "Last stage" }
                    : isUnderFollowUp
                      ? { tone: "blue", text: "Under Follow-up" }
                      : { tone: "blue", text: "In progress" }
                : booked
                  ? { tone: "blue", text: booked, check: true }
                  : { tone: "muted", text: "Pending" };

            // How a CR changes status straight from the pipeline:
            //  • the next allowed stage(s) → jump there (panel pre-targets that stage)
            //  • the CURRENT stage → open the panel to pick any allowed move
            const canInteract = !!onStageClick && !isClosed && !isDelivered && nextStatuses.length > 0;
            const isNextStage = nextStatuses.includes(step.status);
            const canChangeStatus = canInteract && (current || isNextStage);
            // Past stages aren't a status-change target anymore — clicking one instead
            // opens the contextual panel showing when/who/what happened at that stage.
            const clickable = canChangeStatus || done || current;

            const whenEntry = (statusHistory ?? []).find((h) => h.toStatus === step.status);
            const whenLabel = whenEntry ? timeAgo(whenEntry.createdAt) : undefined;

            return (
              <StageCard
                key={step.status}
                number={index + 1}
                label={step.label}
                Icon={step.Icon}
                tone={tone}
                current={current}
                showCheck={showCheck}
                pill={pill}
                previewRows={stageDetails(step.status, enquiry)}
                whenLabel={whenLabel}
                clickable={clickable}
                selected={openStage?.status === step.status}
                hint={canChangeStatus ? "Click to update status" : "Click for stage details"}
                onClick={() => setOpenStage((prev) => (prev?.status === step.status ? null : step))}
              />
            );
          })}
        </div>
        {/* Fade hints signal there's more of the row to scroll to. A gradient (not a flat
            fill) so the edge blends into the cards instead of reading as a hard seam/border. */}
        <div className="pointer-events-none absolute left-0 top-0 h-full w-6 bg-gradient-to-r from-white to-transparent dark:from-slate-900" />
        <div className="pointer-events-none absolute right-0 top-0 h-full w-6 bg-gradient-to-l from-white to-transparent dark:from-slate-900" />
      </div>

      <OffRampPills
        status={status}
        lossReason={enquiry?.lossReason}
        closeReason={enquiry?.closeReason}
        canMarkLost={!!onStageClick && nextStatuses.includes("LOST")}
        canCloseTemp={!!onStageClick && nextStatuses.includes("CLOSED_TEMP")}
        onSelect={onStageClick}
      />

      <StagePanel
        isOpen={!!openStage}
        stage={openStage}
        tone={openStage ? (currentIndex > statusToPathIndex(openStage.status) ? "green" : "blue") : "blue"}
        detailRows={openDetailRows}
        historyEntry={openHistoryEntry}
        isCurrentStage={openIsCurrentStage}
        nextStatuses={openIsCurrentStage ? nextStatuses : []}
        canFastTrackDelivered={openIsCurrentStage && nextStatuses.includes("DELIVERED")}
        directMoveTarget={openIsNextStage && openStage ? { status: openStage.status, label: openStage.label } : undefined}
        onMoveTo={handleMoveTo}
        onClose={() => setOpenStage(null)}
      />
    </div>
  );
}

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

interface PipelineStepperProps {
  status: EnquiryStatus;
  statusHistory?: EnquiryStatusHistoryEntry[];
  /** Appointment booked at intake — marks the Appointment stage even before the status moves there. */
  appointmentScheduled?: boolean;
  /** Test drive booked/interested — marks the Test Drive stage similarly. */
  testDriveBooked?: boolean;
  /** Called when a CR clicks a pipeline node to change status — with the target stage for a
   * next-stage node, or undefined for the current node (opens the modal to pick any move). */
  onStageClick?: (status?: EnquiryStatus) => void;
  /** Source for stage details — what actually happened at each stage (vehicle, price,
   * finance, delivery checklist, etc), beyond just the status-change timestamp. */
  enquiry?: Enquiry;
}
