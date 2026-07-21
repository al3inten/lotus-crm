import { useEffect, useRef, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import clsx from "clsx";
import { AlertCircle, Car, Plus } from "lucide-react";

import { useLeadHistory } from "../hooks/useLeads";
import { useEnquiry, useReassign, useUpdateEnquiryDetails } from "../hooks/useEnquiry";
import { useBranchStaff } from "../hooks/useUsers";
import { useCallLogsForLead } from "../hooks/useVoice";
import { useAuth } from "../context/AuthContext";
import { useSettings } from "../hooks/useSettings";

import { Button } from "../components/common/Button";
import { Card } from "../components/common/Card";
import { ConfettiBurst } from "../components/common/ConfettiBurst";

import { AddLeadWizard } from "../components/leads/AddLeadWizard";

import { LeadHeroHeader } from "../components/leads/detail/LeadHeroHeader";
import { LeadInsightsSection } from "../components/leads/detail/LeadInsightsSection";
import { LeadEnquiriesSwitcher } from "../components/leads/detail/LeadEnquiriesSwitcher";
import { LeadModals } from "../components/leads/detail/LeadModals";
import { LeadDetailSkeleton } from "../components/leads/detail/LeadDetailSkeleton";
import { LeadDetailError } from "../components/leads/detail/LeadDetailError";
import { LeadPipelinePanel } from "../components/leads/detail/LeadPipelinePanel";

import {
  WIN_STATUS,
  REASSIGN_ROLES,
  type DetailTab,
  buildInsights,
  computeLeadScore,
  toDateInput,
  toDatetimeLocalInput,
} from "../components/leads/detail/leadUtils";
import { staggerContainer } from "../lib/motion";
import { DIGITAL_SOURCES, type EnquiryStatus } from "../types";
import type { AddLeadFormValues } from "../schemas/lead.schema";

/* ────────────────────────────────────────────────────────────────────────────
   "Quiet Precision" — same tokens as the dashboard.
   One surface, hairline borders, indigo reserved for the primary action.
   Urgency is carried by small typographic signals, not colored panels.
──────────────────────────────────────────────────────────────────────────── */

const SURFACE =
  "rounded-2xl border border-slate-200/70 bg-white dark:border-white/[0.07] dark:bg-[#0E1015]";

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
  const tabDefaultedFor = useRef<string | null>(null);

  const { data: lead, isLoading: leadLoading, isError: leadError, refetch: refetchLead } = useLeadHistory(leadId);
  const activeEnquiryId = enquiryIdParam ?? lead?.enquiries[0]?.id;
  const { data: enquiry, isLoading: enquiryLoading, isError: enquiryError, refetch: refetchEnquiry } = useEnquiry(activeEnquiryId);
  const reassign = useReassign(activeEnquiryId ?? "");
  const updateDetails = useUpdateEnquiryDetails(activeEnquiryId ?? "");

  // Open straight to the forms tab (Test Drive / Quotation) when the enquiry is at the
  // appointment/test-drive stage — that's where the CR needs to act, so it shouldn't be
  // hidden behind a tab. Runs once per enquiry, so it won't fight a manual tab switch.
  useEffect(() => {
    if (!enquiry || tabDefaultedFor.current === enquiry.id) return;
    tabDefaultedFor.current = enquiry.id;
    if (enquiry.status === "APPOINTMENT_FIXED" || enquiry.status === "TEST_DRIVE") {
      setActiveTab("forms");
    }
  }, [enquiry]);
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
    return <LeadDetailSkeleton />;
  }

  /* ── Lead failed to load ── */
  if (leadError || !lead) {
    return <LeadDetailError onRetry={() => refetchLead()} onBack={() => navigate("/leads")} />;
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
          <LeadPipelinePanel
            lead={lead}
            enquiry={enquiry}
            callLogs={callLogs}
            settings={settings}
            followUpUrgency={followUpUrgency}
            nextStepCopy={nextStepCopy}
            keyDates={keyDates}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            openFollowUp={openFollowUp}
            handleQuickActionStatus={handleQuickActionStatus}
            showStatusModal={showStatusModal}
            setShowStatusModal={setShowStatusModal}
            statusModalTarget={statusModalTarget}
            setShowFollowUpsModal={setShowFollowUpsModal}
            setShowTimelineModal={setShowTimelineModal}
            setShowContactHistoryModal={setShowContactHistoryModal}
            setShowCallHistoryModal={setShowCallHistoryModal}
            onUpdateNotes={(newRemarks) => updateDetails.mutate({ remarks: newRemarks })}
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
                area: lead.area ?? undefined,
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