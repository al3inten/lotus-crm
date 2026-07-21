import { motion } from "framer-motion";
import clsx from "clsx";
import { XCircle, Zap, ArrowRightLeft } from "lucide-react";

import { Card } from "../../common/Card";
import { Button } from "../../common/Button";
import { StatusChangeModal } from "../../enquiry/StatusChangeModal";
import { PipelineStepper } from "../../enquiry/PipelineStepper";
import { TestDriveForm } from "../../enquiry/TestDriveForm";
import { BookingDetailsForm } from "../../enquiry/BookingDetailsForm";
import { QuotationForm } from "../../enquiry/QuotationForm";
import { ExchangeForm } from "../../enquiry/ExchangeForm";
import { QuickActions } from "../../enquiry/QuickActions";

import { LeadActivityTab } from "./LeadActivityTab";
import { LeadDetailsTab } from "./LeadDetailsTab";
import {
  type DetailTab,
  DETAIL_TAB_LABELS,
  DETAIL_TAB_ICONS,
  moodOf,
  MOOD_STYLES,
} from "./leadUtils";
import { fadeUp } from "../../../lib/motion";
import type { Enquiry, LeadWithHistory, EnquiryStatus } from "../../../types";
import type { CallLog } from "../../../api/voice.api";
import type { useSettings } from "../../../hooks/useSettings";

const SURFACE =
  "rounded-2xl border border-slate-200/70 bg-white dark:border-white/[0.07] dark:bg-[#0E1015]";

const HAIRLINE = "border-slate-200/70 dark:border-white/[0.07]";

export function LeadPipelinePanel({
  lead,
  enquiry,
  callLogs,
  settings,
  followUpUrgency,
  nextStepCopy,
  keyDates,
  activeTab,
  setActiveTab,
  openFollowUp,
  handleQuickActionStatus,
  showStatusModal,
  setShowStatusModal,
  statusModalTarget,
  setShowFollowUpsModal,
  setShowTimelineModal,
  setShowContactHistoryModal,
  setShowCallHistoryModal,
  onUpdateNotes,
}: {
  lead: LeadWithHistory;
  enquiry: Enquiry;
  callLogs?: CallLog[];
  settings: ReturnType<typeof useSettings>["data"];
  followUpUrgency: "overdue" | "today" | "future" | null;
  nextStepCopy: string;
  keyDates: { label: string; value: Date | null }[];
  activeTab: DetailTab;
  setActiveTab: (tab: DetailTab) => void;
  openFollowUp: () => void;
  handleQuickActionStatus: (target?: EnquiryStatus) => void;
  showStatusModal: boolean;
  setShowStatusModal: (v: boolean) => void;
  statusModalTarget: EnquiryStatus | undefined;
  setShowFollowUpsModal: (v: boolean) => void;
  setShowTimelineModal: (v: boolean) => void;
  setShowContactHistoryModal: (v: boolean) => void;
  setShowCallHistoryModal: (v: boolean) => void;
  onUpdateNotes: (newRemarks: string) => void;
}) {
  const moodStyle = MOOD_STYLES[moodOf(enquiry)];

  // All stage cards are always visible so their details can be reviewed at any point. Each card
  // is editable only from its own stage onward (read-only before), and everything locks once the
  // enquiry is Closed. Forward pipeline rank drives the "from its stage onward" rule.
  const STAGE_RANK: Record<EnquiryStatus, number> = {
    NEW: 0,
    UNDER_FOLLOW_UP: 0,
    APPOINTMENT_FIXED: 1,
    TEST_DRIVE: 2,
    BOOKED: 3,
    RETAIL_DONE: 4,
    RTO_DONE: 5,
    DELIVERED: 6,
    CLOSED: -1,
  };
  const editableFrom = (start: EnquiryStatus) =>
    enquiry.status !== "CLOSED" && STAGE_RANK[enquiry.status] >= STAGE_RANK[start];

  const testDriveEditable = editableFrom("APPOINTMENT_FIXED");
  const quotationEditable = editableFrom("TEST_DRIVE");
  const exchangeEditable = editableFrom("BOOKED");
  const bookingEditable = editableFrom("BOOKED");

  // Quotation card still respects the branch's quotationEnabled setting; the rest are always shown.
  const showQuotation = settings?.quotationEnabled !== false;
  const lockedHint = (stage: string) => `Read-only — editable from the ${stage} stage.`;

  const hasForms = true;
  const tabs: DetailTab[] = [...(hasForms ? (["forms"] as const) : []), "activity", "details"];

  return (
    <>
      {/* ── Lost notice: neutral surface, rose reserved for the signal ── */}
      {enquiry.status === "CLOSED" && enquiry.lossReason && (
        <motion.div
          variants={fadeUp}
          className={clsx(SURFACE, "flex items-start gap-3 p-4")}
        >
          <XCircle size={16} strokeWidth={1.75} className="mt-0.5 shrink-0 text-rose-500 dark:text-rose-400" />
          <div className="min-w-0">
            <p className="text-[13px] font-medium text-slate-900 dark:text-slate-100">
              Enquiry lost
              <span className="mx-2 text-slate-300 dark:text-slate-600">·</span>
              <span className="text-rose-600 dark:text-rose-400">
                {enquiry.lossReason.replaceAll("_", " ").toLowerCase()}
              </span>
            </p>
            {enquiry.lossNote && (
              <p className="mt-0.5 text-[13px] leading-relaxed text-slate-500 dark:text-slate-400">
                {enquiry.lossNote}
              </p>
            )}
          </div>
        </motion.div>
      )}

      {/* ── Pipeline + next step ── */}
      <motion.div variants={fadeUp}>
        <Card className={clsx(SURFACE, "flex flex-col gap-0 overflow-hidden p-0")}>
          <div className={clsx("p-6", moodStyle.border && "border-l-2", moodStyle.border)}>
            <PipelineStepper
              status={enquiry.status}
              lossReason={enquiry.lossReason}
              statusHistory={enquiry.statusHistory}
              appointmentScheduled={enquiry.appointmentScheduled}
              testDriveBooked={enquiry.testDriveInterested || (enquiry.testDriveFeedbacks?.length ?? 0) > 0}
              onStageClick={handleQuickActionStatus}
            />
          </div>

          {enquiry.status !== "CLOSED" && (
            <div
              className={clsx(
                "flex flex-col gap-3 border-t px-6 py-4 sm:flex-row sm:items-center sm:justify-between",
                HAIRLINE,
                "bg-slate-50/60 dark:bg-white/[0.02]"
              )}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Zap
                  size={14}
                  strokeWidth={1.75}
                  className={clsx(
                    "shrink-0",
                    followUpUrgency === "overdue"
                      ? "text-rose-500 dark:text-rose-400"
                      : followUpUrgency === "today"
                        ? "text-amber-500 dark:text-amber-400"
                        : "text-slate-400 dark:text-slate-500"
                  )}
                />
                <p className="truncate text-[13px] text-slate-600 dark:text-slate-300">
                  <span className="font-medium text-slate-900 dark:text-slate-100">Next step</span>
                  <span className="mx-2 text-slate-300 dark:text-slate-600">·</span>
                  {nextStepCopy}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <Button size="sm" icon={<Zap size={13} />} onClick={openFollowUp}>
                  Add follow-up
                </Button>
                <QuickActions status={enquiry.status} onChangeStatus={handleQuickActionStatus} />
                <button
                  type="button"
                  onClick={() => handleQuickActionStatus(undefined)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200/80 bg-white px-3 py-1.5 text-[13px] font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-slate-300 dark:hover:bg-white/[0.06]"
                >
                  <ArrowRightLeft size={13} />
                  Change status
                </button>
              </div>
            </div>
          )}
        </Card>
      </motion.div>

      {/* ── Segmented tabs: hairline track, sliding thumb ── */}
      <div
        role="tablist"
        className="flex w-fit items-center gap-0.5 rounded-lg border border-slate-200/70 bg-slate-50/80 p-0.5 dark:border-white/[0.07] dark:bg-white/[0.03]"
      >
        {tabs.map((tab) => {
          const Icon = DETAIL_TAB_ICONS[tab];
          const active = activeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setActiveTab(tab)}
              className={clsx(
                "relative flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-indigo-500",
                active
                  ? "text-slate-900 dark:text-white"
                  : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
              )}
            >
              {active && (
                <motion.span
                  layoutId="leadDetailActiveTab"
                  className="absolute inset-0 -z-10 rounded-md bg-white shadow-sm ring-1 ring-slate-900/[0.04] dark:bg-white/[0.08] dark:ring-white/[0.06]"
                  transition={{ type: "spring", stiffness: 500, damping: 38 }}
                />
              )}
              <Icon size={13} strokeWidth={1.75} />
              {DETAIL_TAB_LABELS[tab]}
            </button>
          );
        })}
      </div>

      {activeTab === "forms" && hasForms && (
        <div className="flex flex-col gap-4">
          {/* 2×2 grid — Row 1: Test Drive | Booking Details, Row 2: Exchange | Quotation.
              Equal-sized cards (stretch to the tallest in each row). All shown at every stage;
              each editable only from its stage onward. */}
          <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-2 [&>*]:h-full">
            <TestDriveForm
              enquiryId={enquiry.id}
              branchId={enquiry.branchId}
              existing={enquiry.testDriveFeedbacks}
              defaultCarModel={enquiry.carModel}
              defaultVariant={enquiry.variant}
              editable={testDriveEditable}
              lockedHint={lockedHint("Appointment Fixed")}
            />
            <BookingDetailsForm enquiry={enquiry} editable={bookingEditable} lockedHint={lockedHint("Booked")} />
            <ExchangeForm
              enquiryId={enquiry.id}
              branchId={enquiry.branchId}
              existing={enquiry.exchangeEvaluation}
              editable={exchangeEditable}
              lockedHint={lockedHint("Booked")}
            />
            {showQuotation && (
              <QuotationForm
                enquiryId={enquiry.id}
                branchId={enquiry.branchId}
                existing={enquiry.quotation}
                editable={quotationEditable}
                lockedHint={lockedHint("Test Drive")}
              />
            )}
          </div>
        </div>
      )}

      {activeTab === "activity" && (
        <LeadActivityTab
          enquiry={enquiry}
          openFollowUp={openFollowUp}
          setShowFollowUpsModal={setShowFollowUpsModal}
          setShowTimelineModal={setShowTimelineModal}
          onUpdateNotes={onUpdateNotes}
        />
      )}

      {activeTab === "details" && (
        <LeadDetailsTab
          lead={lead}
          enquiry={enquiry}
          callLogs={callLogs}
          followUpUrgency={followUpUrgency}
          keyDates={keyDates}
          setShowContactHistoryModal={setShowContactHistoryModal}
          setShowCallHistoryModal={setShowCallHistoryModal}
        />
      )}

      <StatusChangeModal
        enquiryId={enquiry.id}
        branchId={enquiry.branchId}
        currentStatus={enquiry.status}
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        initialTargetStatus={statusModalTarget}
        hasCompletedTestDrive={(enquiry.testDriveFeedbacks ?? []).some((td) => !!td.completedAt)}
        currentConsultantId={enquiry.consultantId ?? undefined}
        enquiry={enquiry}
      />
    </>
  );
}
