import { useState } from "react";
import type { ReactNode } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Phone,
  Mail,
  UserCircle2,
  Car,
  ClipboardEdit,
  MapPin,
  Tag,
  Briefcase,
  MessagesSquare,
  PhoneCall,
  MessageCircle,
  Building2,
  Radio,
  CalendarDays,
  Hash,
} from "lucide-react";
import { useLeadHistory } from "../hooks/useLeads";
import { useEnquiry, useReassign } from "../hooks/useEnquiry";
import { useBranchStaff } from "../hooks/useUsers";
import { useCallLogsForLead } from "../hooks/useVoice";
import { useAuth } from "../context/AuthContext";
import { useSettings } from "../hooks/useSettings";
import { StatusChangeModal } from "../components/enquiry/StatusChangeModal";
import { PipelineStepper } from "../components/enquiry/PipelineStepper";
import { FollowUpForm } from "../components/enquiry/FollowUpForm";
import { TestDriveForm } from "../components/enquiry/TestDriveForm";
import { QuotationForm } from "../components/enquiry/QuotationForm";
import { ExchangeForm } from "../components/enquiry/ExchangeForm";
import { FinanceForm } from "../components/enquiry/FinanceForm";
import { DeliveryForm } from "../components/enquiry/DeliveryForm";
import { StatusBadge } from "../components/common/StatusBadge";
import { Avatar } from "../components/common/Avatar";
import { Button } from "../components/common/Button";
import { Card, CardHeader } from "../components/common/Card";
import { Select } from "../components/common/Input";
import { AddLeadWizard } from "../components/leads/AddLeadWizard";
import { DIGITAL_SOURCES } from "../types";
import type { AddLeadFormValues } from "../schemas/lead.schema";
import { UnifiedTimeline } from "../components/enquiry/UnifiedTimeline";
import { FollowUpTable } from "../components/enquiry/FollowUpTable";
import { QuickActions } from "../components/enquiry/QuickActions";
import { fadeUp, staggerContainer } from "../lib/motion";
import type { EnquiryStatus } from "../types";

const REASSIGN_ROLES = ["SUPER_ADMIN", "ADMIN", "BRANCH_MANAGER"];

const toDateInput = (iso?: string | null) => (iso ? iso.slice(0, 10) : undefined);
const toDatetimeLocalInput = (iso?: string | null) => (iso ? iso.slice(0, 16) : undefined);

/** A labelled field with a leading icon — the atom used across the info cards. */
function InfoField({
  icon,
  label,
  value,
  className,
}: {
  icon: ReactNode;
  label: string;
  value?: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="mb-1 flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
        {icon}
        {label}
      </p>
      <p className="text-sm font-semibold text-slate-900 dark:text-white">{value ?? "—"}</p>
    </div>
  );
}

export function LeadDetailPage() {
  const { leadId, enquiryId: enquiryIdParam } = useParams<{ leadId: string; enquiryId?: string }>();
  const { user } = useAuth();

  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusModalTarget, setStatusModalTarget] = useState<EnquiryStatus | undefined>();

  const [showDetailsWizard, setShowDetailsWizard] = useState(false);
  const [showFollowUpForm, setShowFollowUpForm] = useState(false);
  const [reassignTo, setReassignTo] = useState("");

  const { data: lead, isLoading: leadLoading } = useLeadHistory(leadId);
  const activeEnquiryId = enquiryIdParam ?? lead?.enquiries[0]?.id;
  const { data: enquiry, isLoading: enquiryLoading } = useEnquiry(activeEnquiryId);
  const reassign = useReassign(activeEnquiryId ?? "");
  const { data: crTeam } = useBranchStaff(enquiry?.branchId, "CR_TEAM");
  const { data: callLogs } = useCallLogsForLead(leadId);
  const { data: settings } = useSettings();

  if (leadLoading || !lead) {
    return (
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div className="h-5 w-32 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
        <div className="h-44 animate-pulse rounded-3xl bg-slate-200 dark:bg-slate-800" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="h-56 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
          <div className="h-56 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
        </div>
      </div>
    );
  }

  const handleQuickActionStatus = (target?: EnquiryStatus) => {
    setStatusModalTarget(target);
    setShowStatusModal(true);
  };

  // Safe extractors for Enquiry Details section
  const extractBookingDate = () => {
    if (!enquiry?.statusHistory) return null;
    const booked = enquiry.statusHistory.find((h) => h.toStatus === "BOOKED");
    return booked ? new Date(booked.createdAt) : null;
  };

  const extractRetailDate = () => {
    if (!enquiry?.statusHistory) return null;
    const retail = enquiry.statusHistory.find((h) => h.toStatus === "RETAIL_DONE");
    return retail ? new Date(retail.createdAt) : null;
  };

  const extractTestDriveDate = () => {
    if (enquiry?.testDriveFeedbacks && enquiry.testDriveFeedbacks.length > 0) {
      const latest = enquiry.testDriveFeedbacks[0];
      return latest.completedAt ? new Date(latest.completedAt) : latest.scheduledAt ? new Date(latest.scheduledAt) : null;
    }
    return null;
  };

  const bookingDate = extractBookingDate();
  const retailDate = extractRetailDate();
  const tdDate = extractTestDriveDate();

  const phoneDigits = lead.phoneRaw?.replace(/\D/g, "") ?? "";

  const keyDates: { label: string; value: Date | null; iso?: string | null; highlight?: boolean }[] = [
    { label: "Enquiry Date", iso: enquiry?.createdAt, value: enquiry ? new Date(enquiry.createdAt) : null },
    { label: "Appointment Date", iso: enquiry?.appointmentAt, value: enquiry?.appointmentAt ? new Date(enquiry.appointmentAt) : null },
    { label: "Test Drive Date", value: tdDate },
    { label: "Booking Date", value: bookingDate },
    { label: "Retail Date", value: retailDate },
  ];

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="mx-auto flex min-w-0 max-w-7xl flex-col gap-6 pb-12"
    >
      {/* ---------- BACK LINK ---------- */}
      <motion.div variants={fadeUp}>
        <Link
          to="/leads"
          className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
        >
          <ArrowLeft size={16} />
          Back to Leads
        </Link>
      </motion.div>

      {/* ---------- HERO HEADER ---------- */}
      <motion.div
        variants={fadeUp}
        className="glass-panel relative overflow-hidden rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:p-7 dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)]"
      >
        {/* decorative glow */}
        <div className="pointer-events-none absolute -right-16 -top-24 h-56 w-56 rounded-full bg-blue-500/10 blur-[70px] dark:bg-blue-500/20" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 h-48 w-48 rounded-full bg-indigo-500/5 blur-[70px] dark:bg-indigo-500/10" />

        <div className="relative z-10 flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          {/* Identity */}
          <div className="flex min-w-0 items-center gap-4">
            <Avatar name={lead.name} size="lg" />
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-600/80 dark:text-blue-400/80">
                Lead Details
              </p>
              <h1 className="truncate text-2xl font-bold text-slate-900 dark:text-white">{lead.name}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {enquiry && <StatusBadge status={enquiry.status} />}
                {enquiry && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-700/60 dark:text-slate-300">
                    <Hash size={11} />
                    {enquiry.id.slice(-6).toUpperCase()}
                  </span>
                )}
                {enquiry && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-700/60 dark:text-slate-300">
                    <Radio size={11} />
                    {enquiry.source.replaceAll("_", " ")}
                  </span>
                )}
              </div>

              {/* quick contact actions */}
              <div className="mt-4 flex flex-wrap gap-2">
                {lead.phoneRaw && (
                  <a
                    href={`tel:${lead.phoneRaw}`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white/70 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-all hover:-translate-y-0.5 hover:border-blue-300 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200 dark:hover:border-blue-500/40 dark:hover:text-blue-400"
                  >
                    <Phone size={13} /> Call
                  </a>
                )}
                {phoneDigits && (
                  <a
                    href={`https://wa.me/${phoneDigits}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white/70 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-all hover:-translate-y-0.5 hover:border-emerald-300 hover:text-emerald-600 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200 dark:hover:border-emerald-500/40 dark:hover:text-emerald-400"
                  >
                    <MessageCircle size={13} /> WhatsApp
                  </a>
                )}
                {lead.email && (
                  <a
                    href={`mailto:${lead.email}`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white/70 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-all hover:-translate-y-0.5 hover:border-blue-300 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200 dark:hover:border-blue-500/40 dark:hover:text-blue-400"
                  >
                    <Mail size={13} /> Email
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2 xl:justify-end">
            {enquiry && DIGITAL_SOURCES.includes(enquiry.source) && (!enquiry.department || !enquiry.enquiryCategory) && (
              <Button variant="secondary" size="sm" icon={<ClipboardEdit size={14} />} onClick={() => setShowDetailsWizard(true)}>
                Complete Details
              </Button>
            )}

            <Button variant="secondary" size="sm" icon={<ClipboardEdit size={14} />} onClick={() => setShowDetailsWizard(true)}>
              Edit Lead
            </Button>

            {user && REASSIGN_ROLES.includes(user.role) && crTeam && (
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white/80 p-1 shadow-sm dark:border-slate-700 dark:bg-slate-800/70">
                <span className="pl-2 text-xs font-medium text-slate-500 dark:text-slate-400">Reassign</span>
                <Select
                  value={reassignTo}
                  onChange={(e) => setReassignTo(e.target.value)}
                  className="w-40 border-none py-1 text-sm shadow-none focus:ring-0"
                >
                  <option value="">Select CR…</option>
                  {crTeam.map((cr) => (
                    <option key={cr.id} value={cr.id}>
                      {cr.name}
                    </option>
                  ))}
                </Select>
                <Button
                  size="sm"
                  disabled={!reassignTo}
                  onClick={() => {
                    reassign.mutate({ toUserId: reassignTo });
                    setReassignTo("");
                  }}
                >
                  Go
                </Button>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {enquiryLoading || !enquiry ? (
        <div className="h-64 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
      ) : (
        <>
          {/* ---------- SECTION 1: INFORMATION CARDS ---------- */}
          <motion.div variants={fadeUp} className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Customer Information Card */}
            <Card className="flex h-full flex-col">
              <CardHeader
                icon={<UserCircle2 size={18} />}
                iconClassName="bg-blue-50 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400"
                title="Customer Information"
                subtitle="Who you're speaking with"
              />
              <div className="grid grid-cols-1 gap-x-6 gap-y-4 text-sm sm:grid-cols-2">
                <InfoField icon={<Phone size={13} />} label="Mobile Number" value={lead.phoneRaw} />
                <InfoField icon={<Mail size={13} />} label="Email" value={lead.email || "—"} />
                <InfoField
                  icon={<MapPin size={13} />}
                  label="Address"
                  className="sm:col-span-2"
                  value={lead.address ? `${lead.address}${lead.pincode ? `, ${lead.pincode}` : ""}` : "—"}
                />
                <InfoField icon={<Car size={13} />} label="Interested Vehicle" value={enquiry.carModel} />
                <InfoField icon={<Tag size={13} />} label="Customer Category" value={enquiry.enquiryCategory || "—"} />
                <InfoField icon={<Briefcase size={13} />} label="Profession" value={lead.profession || "—"} />
              </div>
            </Card>

            {/* Enquiry Summary Card */}
            <Card className="flex h-full flex-col">
              <CardHeader
                icon={<ClipboardEdit size={18} />}
                iconClassName="bg-violet-50 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400"
                title="Enquiry Summary"
                subtitle="Deal snapshot"
                actions={
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-slate-700/60 dark:text-slate-300">
                    #{enquiry.id.slice(-6).toUpperCase()}
                  </span>
                }
              />
              <div className="grid grid-cols-1 gap-x-6 gap-y-4 text-sm sm:grid-cols-2">
                <InfoField icon={<Building2 size={13} />} label="Branch" value={enquiry.branch.name} />
                <InfoField icon={<Radio size={13} />} label="Source" value={enquiry.source.replaceAll("_", " ")} />
                <InfoField icon={<CalendarDays size={13} />} label="Enquiry Date" value={new Date(enquiry.createdAt).toLocaleDateString()} />
                <InfoField icon={<Tag size={13} />} label="Current Stage" value={enquiry.status.replaceAll("_", " ")} />
                <div className="mt-1 grid grid-cols-1 gap-x-6 gap-y-4 border-t border-slate-100 pt-4 sm:col-span-2 sm:grid-cols-2 dark:border-slate-700/60">
                  <InfoField icon={<UserCircle2 size={13} />} label="Sales Consultant (CR)" value={enquiry.assignedCr?.name ?? "Unassigned"} />
                  <InfoField icon={<UserCircle2 size={13} />} label="Showroom Consultant" value={enquiry.consultant?.name ?? "—"} />
                </div>
              </div>
            </Card>
          </motion.div>

          {/* ---------- SECTION 2: STAGE PROGRESS BAR ---------- */}
          <motion.div variants={fadeUp}>
            <Card>
              <PipelineStepper status={enquiry.status} lossReason={enquiry.lossReason} />
            </Card>
          </motion.div>

          {/* ---------- SECTION 6: QUICK ACTIONS ---------- */}
          {enquiry.status !== "CLOSED" && (
            <motion.div
              variants={fadeUp}
              className="flex flex-col justify-between gap-4 rounded-2xl border border-blue-100 bg-blue-50/60 p-5 sm:flex-row sm:items-center dark:border-blue-500/20 dark:bg-blue-500/10"
            >
              <div>
                <h3 className="text-sm font-bold text-blue-900 dark:text-blue-200">Suggested Actions</h3>
                <p className="mt-0.5 text-xs text-blue-700/80 dark:text-blue-300/70">Move this deal forward based on current stage.</p>
              </div>
              <QuickActions status={enquiry.status} onAddFollowUp={() => setShowFollowUpForm(true)} onChangeStatus={handleQuickActionStatus} />
            </motion.div>
          )}

          {/* ---------- FORMS SECTION (CONDITIONAL) ---------- */}
          <div className="flex flex-col gap-4">
            {showFollowUpForm && (
              <FollowUpForm enquiryId={enquiry.id} onSuccess={() => setShowFollowUpForm(false)} onCancel={() => setShowFollowUpForm(false)} />
            )}

            {enquiry.status === "APPOINTMENT_FIXED" ||
            enquiry.status === "TEST_DRIVE" ||
            (enquiry.testDriveFeedbacks?.length ?? 0) > 0 ? (
              <TestDriveForm enquiryId={enquiry.id} branchId={enquiry.branchId} existing={enquiry.testDriveFeedbacks} />
            ) : null}

            {settings?.quotationEnabled !== false &&
            (["TEST_DRIVE", "BOOKED", "RETAIL_DONE"].includes(enquiry.status) || enquiry.quotation) ? (
              <QuotationForm enquiryId={enquiry.id} branchId={enquiry.branchId} existing={enquiry.quotation} />
            ) : null}

            {enquiry.status === "BOOKED" || enquiry.exchangeEvaluation ? (
              <ExchangeForm enquiryId={enquiry.id} branchId={enquiry.branchId} existing={enquiry.exchangeEvaluation} />
            ) : null}

            {enquiry.status === "BOOKED" || enquiry.financeApplication ? (
              <FinanceForm enquiryId={enquiry.id} existing={enquiry.financeApplication} />
            ) : null}

            {enquiry.status === "RETAIL_DONE" || enquiry.deliveryDetails ? (
              <DeliveryForm enquiryId={enquiry.id} existing={enquiry.deliveryDetails} />
            ) : null}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="flex flex-col gap-6 lg:col-span-2">
              {/* ---------- SECTION 5: FOLLOW-UP HISTORY ---------- */}
              <motion.div variants={fadeUp}>
                <FollowUpTable
                  followUps={enquiry.followUps || []}
                  onAddClick={() => setShowFollowUpForm(true)}
                  canAdd={enquiry.status !== "CLOSED"}
                />
              </motion.div>

              {/* ---------- SECTION 4: ACTIVITY TIMELINE ---------- */}
              <motion.div variants={fadeUp}>
                <Card>
                  <CardHeader
                    icon={<MessagesSquare size={18} />}
                    iconClassName="bg-blue-50 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400"
                    title="Activity Timeline"
                    subtitle="Complete audit history of stage changes and follow-ups"
                  />
                  <UnifiedTimeline enquiryId={enquiry.id} statusHistory={enquiry.statusHistory || []} followUps={enquiry.followUps || []} />
                </Card>
              </motion.div>
            </div>

            <div className="flex flex-col gap-6">
              {/* ---------- SECTION 3: ENQUIRY DETAILS (DATES) ---------- */}
              <motion.div variants={fadeUp}>
                <Card>
                  <CardHeader
                    icon={<CalendarDays size={18} />}
                    iconClassName="bg-amber-50 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400"
                    title="Key Dates"
                  />
                  <div className="flex flex-col text-sm">
                    {keyDates.map((d) => (
                      <div
                        key={d.label}
                        className="flex items-center justify-between border-b border-slate-100 py-2.5 last:border-0 dark:border-slate-700/50"
                      >
                        <span className="text-slate-500 dark:text-slate-400">{d.label}</span>
                        <span className="font-semibold text-slate-900 tabular-nums dark:text-white">
                          {d.value ? d.value.toLocaleDateString() : "—"}
                        </span>
                      </div>
                    ))}
                    <div className="-mx-6 mt-2 flex items-center justify-between rounded-xl bg-blue-50/70 px-6 py-3 dark:bg-blue-500/10">
                      <span className="font-medium text-blue-900 dark:text-blue-200">Next Follow-up</span>
                      <span className="font-bold text-blue-700 tabular-nums dark:text-blue-300">
                        {enquiry.followUpDueAt ? new Date(enquiry.followUpDueAt).toLocaleDateString() : "—"}
                      </span>
                    </div>
                  </div>
                </Card>
              </motion.div>

              {/* ---------- CONTACT HISTORY ---------- */}
              <motion.div variants={fadeUp}>
                <Card>
                  <CardHeader
                    icon={<MessagesSquare size={16} />}
                    iconClassName="bg-fuchsia-50 text-fuchsia-600 dark:bg-fuchsia-500/20 dark:text-fuchsia-400"
                    title="Contact History"
                    subtitle="Every way they've reached us"
                  />
                  <div className="mb-3 flex flex-wrap gap-1.5">
                    {Object.entries(lead.touchesBySource).map(([source, count]) => (
                      <span
                        key={source}
                        className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 dark:bg-blue-500/15 dark:text-blue-300"
                      >
                        {source.replaceAll("_", " ")} ×{count}
                      </span>
                    ))}
                    {Object.entries(lead.messagesByChannel).map(([channel, count]) => (
                      <span
                        key={channel}
                        className="rounded-full bg-fuchsia-50 px-2.5 py-1 text-xs font-medium text-fuchsia-700 dark:bg-fuchsia-500/15 dark:text-fuchsia-300"
                      >
                        {channel} msgs: {count}
                      </span>
                    ))}
                  </div>
                  <ul className="flex flex-col gap-1.5">
                    {lead.touches.slice(0, 4).map((touch) => (
                      <li key={touch.id} className="rounded-lg bg-slate-50 px-3 py-2 text-xs dark:bg-slate-800/60">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{touch.source.replaceAll("_", " ")}</span>
                          <span className="text-slate-400 dark:text-slate-500">{new Date(touch.createdAt).toLocaleDateString()}</span>
                        </div>
                        {touch.note && <p className="mt-0.5 text-slate-500 dark:text-slate-400">{touch.note}</p>}
                      </li>
                    ))}
                  </ul>
                </Card>
              </motion.div>

              {callLogs && callLogs.length > 0 && (
                <motion.div variants={fadeUp}>
                  <Card>
                    <CardHeader
                      icon={<PhoneCall size={16} />}
                      iconClassName="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400"
                      title="AI Call History"
                    />
                    <ul className="flex flex-col gap-2">
                      {callLogs.map((call) => (
                        <li key={call.id} className="rounded-lg bg-slate-50 p-2.5 text-sm dark:bg-slate-800/60">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium text-slate-800 dark:text-slate-200">{call.status.replaceAll("_", " ")}</span>
                            <span className="text-slate-400 dark:text-slate-500">{new Date(call.createdAt).toLocaleString()}</span>
                          </div>
                          {call.recordingUrl && <audio controls src={call.recordingUrl} className="mt-1.5 h-8 w-full" />}
                        </li>
                      ))}
                    </ul>
                  </Card>
                </motion.div>
              )}
            </div>
          </div>

          <StatusChangeModal
            enquiryId={enquiry.id}
            branchId={enquiry.branchId}
            currentStatus={enquiry.status}
            isOpen={showStatusModal}
            onClose={() => setShowStatusModal(false)}
            initialTargetStatus={statusModalTarget}
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
    </motion.div>
  );
}
