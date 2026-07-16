import { useEffect, useRef, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import clsx from "clsx";
import {
  AlertCircle,
  XCircle,
  Zap,
  ArrowRightLeft,
  ArrowLeft,
  Car,
  Plus,
} from "lucide-react";

import { useLeadHistory } from "../hooks/useLeads";
import { useEnquiry, useReassign, useUpdateEnquiryDetails } from "../hooks/useEnquiry";
import { useBranchStaff } from "../hooks/useUsers";
import { useCallLogsForLead } from "../hooks/useVoice";
import { useAuth } from "../context/AuthContext";
import { useSettings } from "../hooks/useSettings";

import { Button } from "../components/common/Button";
import { Card } from "../components/common/Card";
import { ConfettiBurst } from "../components/common/ConfettiBurst";

import { StatusChangeModal } from "../components/enquiry/StatusChangeModal";
import { PipelineStepper } from "../components/enquiry/PipelineStepper";
import { TestDriveForm } from "../components/enquiry/TestDriveForm";
import { QuotationForm } from "../components/enquiry/QuotationForm";
import { ExchangeForm } from "../components/enquiry/ExchangeForm";
import { FinanceForm } from "../components/enquiry/FinanceForm";
import { DeliveryForm } from "../components/enquiry/DeliveryForm";
import { QuickActions } from "../components/enquiry/QuickActions";
import { AddLeadWizard } from "../components/leads/AddLeadWizard";

import { LeadHeroHeader } from "../components/leads/detail/LeadHeroHeader";
import { LeadInsightsSection } from "../components/leads/detail/LeadInsightsSection";
import { LeadEnquiriesSwitcher } from "../components/leads/detail/LeadEnquiriesSwitcher";
import { LeadActivityTab } from "../components/leads/detail/LeadActivityTab";
import { LeadDetailsTab } from "../components/leads/detail/LeadDetailsTab";
import { LeadModals } from "../components/leads/detail/LeadModals";

import {
  WIN_STATUS,
  REASSIGN_ROLES,
  type DetailTab,
  DETAIL_TAB_LABELS,
  DETAIL_TAB_ICONS,
  buildInsights,
  computeLeadScore,
  toDateInput,
  toDatetimeLocalInput,
  moodOf,
  MOOD_STYLES,
} from "../components/leads/detail/leadUtils";
import { fadeUp, staggerContainer } from "../lib/motion";
import { DIGITAL_SOURCES, type EnquiryStatus, type AddLeadFormValues } from "../types";

/* ────────────────────────────────────────────────────────────────────────────
   "Quiet Precision" — same tokens as the dashboard.
   One surface, hairline borders, indigo reserved for the primary action.
   Urgency is carried by small typographic signals, not colored panels.
──────────────────────────────────────────────────────────────────────────── */

const SURFACE =
  "rounded-2xl border border-slate-200/70 bg-white dark:border-white/[0.07] dark:bg-[#0E1015]";

const HAIRLINE = "border-slate-200/70 dark:border-white/[0.07]";

const SKELETON =
  "animate-pulse rounded-2xl border border-slate-200/70 bg-white dark:border-white/[0.07] dark:bg-[#0E1015]";

const PULSE = "animate-pulse rounded-md bg-slate-100 dark:bg-white/[0.05]";

export function LeadDetailPage() {
  const { leadId, enquiryId: enquiryIdParam } = useParams<{ leadId: string; enquiryId?: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusModalTarget, setStatusModalTarget] = useState<EnquiryStatus | undefined>();

  const [showDetailsWizard, setShowDetailsWizard] = useState(false);
  const [showCustomerView, setShowCustomerView] = useState(false);
  const [showFollowUpsModal, setShowFollowUpsModal] = useState(false);
  const [showTimelineModal, setShowTimelineModal] = useState(false);
  const [showContactHistoryModal, setShowContactHistoryModal] = useState(false);
  const [showCallHistoryModal, setShowCallHistoryModal] = useState(false);
  const [showFollowUpForm, setShowFollowUpForm] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const [showNewEnquiry, setShowNewEnquiry] = useState(false);
  const [activeTab, setActiveTab] = useState<DetailTab>("activity");

  const prevStatusRef = useRef<EnquiryStatus | null>(null);

  const { data: lead, isLoading: leadLoading, isError: leadError, refetch: refetchLead } = useLeadHistory(leadId);
  const activeEnquiryId = enquiryIdParam ?? lead?.enquiries[0]?.id;
  const { data: enquiry, isLoading: enquiryLoading, isError: enquiryError, refetch: refetchEnquiry } = useEnquiry(activeEnquiryId);
  const reassign = useReassign(activeEnquiryId ?? "");
  const updateDetails = useUpdateEnquiryDetails(activeEnquiryId ?? "");
  const { data: crTeam } = useBranchStaff(enquiry?.branchId, "CR_TEAM");
  const { data: consultants } = useBranchStaff(enquiry?.branchId, "CONSULTANT");
  const { data: callLogs } = useCallLogsForLead(leadId);
  const { data: settings } = useSettings();

  useEffect(() => {
    const status = enquiry?.status;
    if (!status) return;
    const prev = prevStatusRef.current;
    if (prev && prev !== status && status === WIN_STATUS) {
      setCelebrate(true);
    }
    prevStatusRef.current = status;
  }, [enquiry?.status]);

  useEffect(() => {
    setActiveTab("activity");
  }, [activeEnquiryId]);

  const insights = useMemo(() => {
    if (!lead || !enquiry) return [];
    return buildInsights(lead, enquiry);
  }, [lead, enquiry]);

  const leadScore = useMemo(() => {
    if (!lead || !enquiry) return 0;
    return computeLeadScore(lead, enquiry);
  }, [lead, enquiry]);

  /* ── Loading ── */
  if (leadLoading) {
    return (
      <div className="mx-auto flex w-full max-w-[1360px] flex-col gap-6 px-4 pb-16 sm:px-6 lg:px-8">
        <div className={clsx(SKELETON, "overflow-hidden")}>
          <div className="h-16 bg-slate-50 dark:bg-white/[0.02] sm:h-20" />
          <div className="px-5 pb-5">
            <div className="flex items-center gap-3 pb-4">
              <div className="-mt-8 h-16 w-16 shrink-0 rounded-full bg-slate-100 ring-4 ring-white dark:bg-white/[0.05] dark:ring-[#0E1015] sm:-mt-9 sm:h-[72px] sm:w-[72px]" />
              <div className="flex flex-col gap-2 pt-2">
                <div className={clsx(PULSE, "h-5 w-44")} />
                <div className={clsx(PULSE, "h-3.5 w-28")} />
              </div>
            </div>
            <div className={clsx("grid grid-cols-2 gap-x-6 gap-y-4 border-t pt-4 sm:grid-cols-5", HAIRLINE)}>
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex flex-col gap-1.5">
                  <div className={clsx(PULSE, "h-3 w-16")} />
                  <div className={clsx(PULSE, "h-4 w-24")} />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className={clsx(SKELETON, "h-40")} />

        <div className="flex items-center gap-2">
          <div className={clsx(PULSE, "h-8 w-28 rounded-lg")} />
          <div className={clsx(PULSE, "h-8 w-24 rounded-lg")} />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className={clsx(SKELETON, "h-64 lg:col-span-1")} />
          <div className={clsx(SKELETON, "h-64 lg:col-span-2")} />
        </div>
      </div>
    );
  }

  /* ── Lead failed to load ── */
  if (leadError || !lead) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-5 py-24 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-200/70 bg-white text-slate-400 dark:border-white/[0.07] dark:bg-[#0E1015] dark:text-slate-500">
          <AlertCircle size={20} strokeWidth={1.75} />
        </span>
        <div>
          <h1 className="text-[17px] font-semibold tracking-tight text-slate-900 dark:text-white">
            Couldn't load this lead
          </h1>
          <p className="mt-1.5 text-[13px] leading-relaxed text-slate-500 dark:text-slate-400">
            It may have been removed, or you don't have access to it.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button variant="secondary" onClick={() => refetchLead()}>
            Retry
          </Button>
          <Button icon={<ArrowLeft size={14} />} onClick={() => navigate("/leads")}>
            Back to leads
          </Button>
        </div>
      </div>
    );
  }

  const handleQuickActionStatus = (target?: EnquiryStatus) => {
    setStatusModalTarget(target);
    setShowStatusModal(true);
  };

  const openFollowUp = () => setShowFollowUpForm(true);

  const canReassign = !!(user && REASSIGN_ROLES.includes(user.role) && crTeam);

  const followUpUrgency = (() => {
    if (!enquiry?.followUpDueAt) return null;
    const due = new Date(enquiry.followUpDueAt);
    const now = new Date();
    if (due < now && due.toDateString() !== now.toDateString()) return "overdue" as const;
    if (due.toDateString() === now.toDateString()) return "today" as const;
    return "future" as const;
  })();

  const bookingDate = enquiry?.statusHistory?.find((h) => h.toStatus === "BOOKED")?.createdAt;
  const retailDate = enquiry?.statusHistory?.find((h) => h.toStatus === "RETAIL_DONE")?.createdAt;
  const tdFeedback = enquiry?.testDriveFeedbacks?.[0];
  const tdDate = tdFeedback?.completedAt ?? tdFeedback?.scheduledAt ?? null;

  const keyDates: { label: string; value: Date | null }[] = [
    { label: "Enquiry Date", value: enquiry ? new Date(enquiry.createdAt) : null },
    { label: "Appointment Date", value: enquiry?.appointmentAt ? new Date(enquiry.appointmentAt) : null },
    { label: "Test Drive Date", value: tdDate ? new Date(tdDate) : null },
    { label: "Booking Date", value: bookingDate ? new Date(bookingDate) : null },
    { label: "Retail Date", value: retailDate ? new Date(retailDate) : null },
  ];

  const completeDetailsNeeded =
    !!enquiry && DIGITAL_SOURCES.includes(enquiry.source) && (!enquiry.department || !enquiry.enquiryCategory);

  const moodStyle = MOOD_STYLES[moodOf(enquiry)];

  const nextStepCopy =
    followUpUrgency === "overdue"
      ? "Follow-up is overdue — reconnect with this lead now."
      : followUpUrgency === "today"
        ? "A follow-up is due today. Keep the conversation moving."
        : enquiry?.followUpDueAt
          ? `Next follow-up on ${new Date(enquiry.followUpDueAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}.`
          : "No follow-up scheduled yet — add one to keep momentum.";

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="mx-auto flex w-full max-w-[1360px] flex-col gap-6 px-4 pb-16 sm:px-6 lg:px-8"
    >
      {celebrate && (
        <ConfettiBurst
          customerName={lead.name}
          crName={enquiry?.assignedCr?.name ?? undefined}
          carModel={enquiry?.carModel}
          onDone={() => setCelebrate(false)}
        />
      )}

      <LeadHeroHeader
        lead={lead}
        enquiry={enquiry}
        crTeam={crTeam}
        consultants={consultants}
        canReassign={canReassign}
        completeDetailsNeeded={completeDetailsNeeded}
        setShowCustomerView={setShowCustomerView}
        openFollowUp={openFollowUp}
        setShowDetailsWizard={setShowDetailsWizard}
        onReassign={(toUserId) => reassign.mutate({ toUserId })}
        onUpdateConsultant={(consultantId) => updateDetails.mutate({ consultantId })}
        isUpdatingDetails={updateDetails.isPending}
      />

      {enquiry && enquiry.status !== "CLOSED" && (
        <LeadInsightsSection enquiry={enquiry} leadScore={leadScore} insights={insights} />
      )}

      {lead.enquiries.length > 1 && (
        <LeadEnquiriesSwitcher
          leadId={leadId!}
          enquiries={lead.enquiries}
          activeEnquiryId={activeEnquiryId}
          setShowNewEnquiry={setShowNewEnquiry}
        />
      )}

      {lead.enquiries.length === 0 ? (
        /* ── Empty state: quiet, directive ── */
        <Card className={clsx(SURFACE, "flex flex-col items-center justify-center gap-5 py-20 text-center")}>
          <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200/70 bg-slate-50 text-slate-400 dark:border-white/[0.07] dark:bg-white/[0.03] dark:text-slate-500">
            <Car size={22} strokeWidth={1.5} />
          </span>
          <div className="max-w-xs">
            <h2 className="text-[15px] font-semibold tracking-tight text-slate-900 dark:text-white">
              No enquiries yet
            </h2>
            <p className="mt-1.5 text-[13px] leading-relaxed text-slate-500 dark:text-slate-400">
              Add this lead's vehicle preferences to open a pipeline and start tracking follow-ups.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowNewEnquiry(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-[13px] font-medium text-white shadow-sm transition-colors hover:bg-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 active:scale-[0.98] dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
          >
            <Plus size={14} />
            New enquiry
          </button>
        </Card>
      ) : enquiryLoading ? (
        <div className="flex flex-col gap-6">
          <div className={clsx(SKELETON, "h-40")} />
          <div className={clsx(PULSE, "h-8 w-56 rounded-lg")} />
          <div className={clsx(SKELETON, "h-64")} />
        </div>
      ) : enquiryError || !enquiry ? (
        <Card className={clsx(SURFACE, "flex flex-col items-center gap-4 py-16 text-center")}>
          <span className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200/70 bg-white text-slate-400 dark:border-white/[0.07] dark:bg-[#0E1015] dark:text-slate-500">
            <AlertCircle size={18} strokeWidth={1.75} />
          </span>
          <div>
            <h2 className="text-[15px] font-semibold tracking-tight text-slate-900 dark:text-white">
              Couldn't load this enquiry
            </h2>
            <p className="mt-1 text-[13px] text-slate-500 dark:text-slate-400">
              Something went wrong fetching the enquiry details.
            </p>
          </div>
          <Button variant="secondary" onClick={() => refetchEnquiry()}>
            Retry
          </Button>
        </Card>
      ) : (
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

          {(() => {
            const showTestDrive =
              enquiry.status === "APPOINTMENT_FIXED" ||
              enquiry.status === "TEST_DRIVE" ||
              (enquiry.testDriveFeedbacks?.length ?? 0) > 0;
            const showQuotation =
              settings?.quotationEnabled !== false &&
              (["TEST_DRIVE", "BOOKED", "RETAIL_DONE"].includes(enquiry.status) || !!enquiry.quotation);
            const showExchange = enquiry.status === "BOOKED" || !!enquiry.exchangeEvaluation;
            const showFinance = enquiry.status === "BOOKED" || !!enquiry.financeApplication;
            const showDelivery = enquiry.status === "RETAIL_DONE" || !!enquiry.deliveryDetails;
            const hasForms = showTestDrive || showQuotation || showExchange || showFinance || showDelivery;
            const tabs: DetailTab[] = [...(hasForms ? (["forms"] as const) : []), "activity", "details"];

            return (
              <>
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
                    {(showTestDrive || showQuotation) && (
                      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
                        {showTestDrive && (
                          <TestDriveForm enquiryId={enquiry.id} branchId={enquiry.branchId} existing={enquiry.testDriveFeedbacks} />
                        )}
                        {showQuotation && (
                          <QuotationForm enquiryId={enquiry.id} branchId={enquiry.branchId} existing={enquiry.quotation} />
                        )}
                      </div>
                    )}
                    {showExchange && <ExchangeForm enquiryId={enquiry.id} branchId={enquiry.branchId} existing={enquiry.exchangeEvaluation} />}
                    {showFinance && <FinanceForm enquiryId={enquiry.id} existing={enquiry.financeApplication} />}
                    {showDelivery && <DeliveryForm enquiryId={enquiry.id} existing={enquiry.deliveryDetails} />}
                  </div>
                )}

                {activeTab === "activity" && (
                  <LeadActivityTab
                    enquiry={enquiry}
                    openFollowUp={openFollowUp}
                    setShowFollowUpsModal={setShowFollowUpsModal}
                    setShowTimelineModal={setShowTimelineModal}
                    onUpdateNotes={(newRemarks) => updateDetails.mutate({ remarks: newRemarks })}
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
              </>
            );
          })()}

          <StatusChangeModal
            enquiryId={enquiry.id}
            branchId={enquiry.branchId}
            currentStatus={enquiry.status}
            isOpen={showStatusModal}
            onClose={() => setShowStatusModal(false)}
            initialTargetStatus={statusModalTarget}
          />

          <LeadModals
            lead={lead}
            enquiry={enquiry}
            callLogs={callLogs}
            showCustomerView={showCustomerView}
            setShowCustomerView={setShowCustomerView}
            showFollowUpForm={showFollowUpForm}
            setShowFollowUpForm={setShowFollowUpForm}
            showFollowUpsModal={showFollowUpsModal}
            setShowFollowUpsModal={setShowFollowUpsModal}
            showTimelineModal={showTimelineModal}
            setShowTimelineModal={setShowTimelineModal}
            showContactHistoryModal={showContactHistoryModal}
            setShowContactHistoryModal={setShowContactHistoryModal}
            showCallHistoryModal={showCallHistoryModal}
            setShowCallHistoryModal={setShowCallHistoryModal}
            openFollowUp={openFollowUp}
          />

          <AddLeadWizard
            isOpen={showDetailsWizard}
            onClose={() => setShowDetailsWizard(false)}
            mode="complete"
            enquiryId={enquiry.id}
            contextLabel={`${enquiry.branch.name} · ${enquiry.source.replaceAll("_", " ")}`}
            initialValues={
              {
                name: lead.name,
                phone: lead.phoneRaw,
                email: lead.email ?? undefined,
                carModel: enquiry.carModel,
                enquiryType: enquiry.enquiryType,
                location: enquiry.location ?? undefined,
                branchId: enquiry.branchId,
                alternateMobile: lead.alternateMobile ?? undefined,
                dob: toDateInput(lead.dob),
                profession: lead.profession ?? undefined,
                pincode: lead.pincode ?? undefined,
                address: lead.address ?? undefined,
                department: enquiry.department ?? undefined,
                sourceCategory: enquiry.sourceCategory ?? undefined,
                subsource: enquiry.subsource ?? undefined,
                variant: enquiry.variant ?? undefined,
                enquiryCategory: enquiry.enquiryCategory ?? undefined,
                financeRequired: enquiry.financeRequired ?? false,
                financeRemarks: enquiry.financeRemarks ?? undefined,
                appointmentScheduled: enquiry.appointmentScheduled,
                appointmentAt: toDatetimeLocalInput(enquiry.appointmentAt),
                testDriveInterested: enquiry.testDriveInterested,
                testDriveCount: enquiry.testDriveCount ?? undefined,
                exchangeCarModel: enquiry.exchangeCarModel ?? undefined,
                exchangeCarYear: enquiry.exchangeCarYear ?? undefined,
                exchangeCarKms: enquiry.exchangeCarKms ?? undefined,
                exchangeCarOwners: enquiry.exchangeCarOwners ?? undefined,
                calledDate: toDateInput(enquiry.calledDate),
                remarks: enquiry.remarks ?? undefined,
              } as Partial<AddLeadFormValues>
            }
          />
        </>
      )}

      <AddLeadWizard
        isOpen={showNewEnquiry}
        onClose={() => setShowNewEnquiry(false)}
        initialValues={
          {
            name: lead.name,
            phone: lead.phoneRaw,
            email: lead.email ?? undefined,
            alternateMobile: lead.alternateMobile ?? undefined,
            dob: toDateInput(lead.dob),
            profession: lead.profession ?? undefined,
            pincode: lead.pincode ?? undefined,
            address: lead.address ?? undefined,
          } as Partial<AddLeadFormValues>
        }
      />
    </motion.div>
  );
}