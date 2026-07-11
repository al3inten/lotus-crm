import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import clsx from "clsx";
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
  Sparkles,
  AlertTriangle,
  CalendarClock,
  Flame,
  Wallet,
  TrendingUp,
  Clock,
  CheckCircle2,
  UserPlus,
  Zap,
  Pencil,
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
import { ConfettiBurst } from "../components/common/ConfettiBurst";
import { fadeUp, staggerContainer } from "../lib/motion";
import type { EnquiryStatus, Enquiry, LeadWithHistory } from "../types";

/** The deal is "won" once the sale is retailed — that's the moment we celebrate. */
const WIN_STATUS: EnquiryStatus = "RETAIL_DONE";

const REASSIGN_ROLES = ["SUPER_ADMIN", "ADMIN", "BRANCH_MANAGER"];

const PIPELINE_ORDER: EnquiryStatus[] = [
  "NEW",
  "UNDER_FOLLOW_UP",
  "APPOINTMENT_FIXED",
  "TEST_DRIVE",
  "BOOKED",
  "RETAIL_DONE",
  "CLOSED",
];

const toDateInput = (iso?: string | null) => (iso ? iso.slice(0, 10) : undefined);
const toDatetimeLocalInput = (iso?: string | null) => (iso ? iso.slice(0, 16) : undefined);

const daysBetween = (a: Date, b: Date) => Math.floor((a.getTime() - b.getTime()) / 86_400_000);

type InsightTone = "urgent" | "warn" | "positive" | "info";
interface Insight {
  tone: InsightTone;
  icon: ReactNode;
  text: string;
}

const INSIGHT_TONE: Record<InsightTone, string> = {
  urgent: "bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-300",
  warn: "bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300",
  positive: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300",
  info: "bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300",
};

/** Client-side heuristic "AI" analysis — surfaces the next best actions from the lead's own signals. */
function buildInsights(lead: LeadWithHistory, enquiry: Enquiry): Insight[] {
  const out: Insight[] = [];
  const now = new Date();

  if (enquiry.status !== "CLOSED") {
    if (enquiry.followUpDueAt) {
      const due = new Date(enquiry.followUpDueAt);
      const overdueDays = daysBetween(now, due);
      if (due < now && due.toDateString() !== now.toDateString()) {
        out.push({
          tone: "urgent",
          icon: <AlertTriangle size={14} />,
          text: `Follow-up overdue by ${Math.max(1, overdueDays)} day${overdueDays > 1 ? "s" : ""} — reach out now.`,
        });
      } else if (due.toDateString() === now.toDateString()) {
        out.push({ tone: "warn", icon: <CalendarClock size={14} />, text: "Follow-up is due today." });
      }
    } else {
      out.push({ tone: "warn", icon: <CalendarClock size={14} />, text: "No follow-up scheduled — set one to keep momentum." });
    }
  }

  if (enquiry.enquiryCategory === "HOT") {
    out.push({ tone: "urgent", icon: <Flame size={14} />, text: "High-intent HOT lead — prioritise today." });
  } else if (enquiry.enquiryCategory === "COLD") {
    out.push({ tone: "info", icon: <TrendingUp size={14} />, text: "Cold lead — nurture with value before pushing to book." });
  }

  if (enquiry.testDriveInterested && (enquiry.testDriveFeedbacks?.length ?? 0) === 0) {
    out.push({ tone: "info", icon: <Car size={14} />, text: "Interested in a test drive — schedule one to move forward." });
  }

  if (enquiry.financeRequired && !enquiry.financeApplication) {
    out.push({ tone: "info", icon: <Wallet size={14} />, text: "Finance required — start the finance application." });
  }

  const touchCount = lead.touches.length;
  const channelCount = Object.keys(lead.touchesBySource).length;
  if (touchCount >= 3) {
    out.push({
      tone: "positive",
      icon: <TrendingUp size={14} />,
      text: `Engaged lead — ${touchCount} touches across ${channelCount} channel${channelCount > 1 ? "s" : ""}.`,
    });
  }

  const inStageDays = daysBetween(now, new Date(enquiry.updatedAt));
  if (["UNDER_FOLLOW_UP", "APPOINTMENT_FIXED"].includes(enquiry.status) && inStageDays >= 7) {
    out.push({ tone: "warn", icon: <Clock size={14} />, text: `No stage change for ${inStageDays} days — the deal may be stalling.` });
  }

  if (DIGITAL_SOURCES.includes(enquiry.source) && (!enquiry.department || !enquiry.enquiryCategory)) {
    out.push({ tone: "info", icon: <ClipboardEdit size={14} />, text: "Enrich the enquiry details to improve routing & scoring." });
  }

  if (out.length === 0) {
    out.push({ tone: "positive", icon: <CheckCircle2 size={14} />, text: "This lead is on track — keep the momentum going." });
  }

  return out.slice(0, 5);
}

/** 5–100 lead score blended from temperature, pipeline progress, engagement and recency. */
function computeLeadScore(lead: LeadWithHistory, enquiry: Enquiry): number {
  let score =
    enquiry.enquiryCategory === "HOT" ? 45 : enquiry.enquiryCategory === "WARM" ? 30 : enquiry.enquiryCategory === "COLD" ? 15 : 25;

  const stageIdx = Math.min(PIPELINE_ORDER.indexOf(enquiry.status), 5);
  if (stageIdx > 0) score += stageIdx * 6;
  score += Math.min(lead.touches.length, 5) * 3;
  if (enquiry.testDriveInterested) score += 5;
  if (enquiry.appointmentScheduled) score += 5;

  if (enquiry.followUpDueAt) {
    const due = new Date(enquiry.followUpDueAt);
    const now = new Date();
    if (due < now && due.toDateString() !== now.toDateString()) score -= 10;
  }

  return Math.max(5, Math.min(100, Math.round(score)));
}

function scoreColor(score: number): string {
  if (score >= 70) return "#059669";
  if (score >= 45) return "#2563eb";
  if (score >= 25) return "#d97706";
  return "#dc2626";
}

function ScoreRing({ score }: { score: number }) {
  const r = 34;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - score / 100);
  return (
    <div className="relative h-24 w-24 shrink-0">
      <svg viewBox="0 0 80 80" className="h-24 w-24 -rotate-90" aria-hidden>
        <circle cx="40" cy="40" r={r} fill="none" strokeWidth="7" className="stroke-slate-200 dark:stroke-slate-700" />
        <circle
          cx="40"
          cy="40"
          r={r}
          fill="none"
          strokeWidth="7"
          stroke={scoreColor(score)}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(0.22, 1, 0.36, 1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold tabular-nums text-slate-900 dark:text-white">{score}</span>
        <span className="text-[10px] font-medium uppercase tracking-wide text-slate-400">score</span>
      </div>
    </div>
  );
}

/** A labelled field with a leading icon — the atom used across the info cards. */
function InfoField({ icon, label, value, className }: { icon: ReactNode; label: string; value?: ReactNode; className?: string }) {
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

const ACTION_TONES = {
  default: "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white",
  call: "text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-500/10",
  whatsapp: "text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-500/10",
  primary: "bg-blue-600 text-white shadow-sm shadow-blue-600/25 hover:bg-blue-500",
} as const;

/** Compact toolbar action — anchor (tel/wa) or button — with label hidden on small screens. */
function ActionButton({
  icon,
  label,
  onClick,
  href,
  external,
  tone = "default",
  disabled,
}: {
  icon: ReactNode;
  label: string;
  onClick?: () => void;
  href?: string;
  external?: boolean;
  tone?: keyof typeof ACTION_TONES;
  disabled?: boolean;
}) {
  const cls = clsx(
    "inline-flex h-11 min-w-11 items-center justify-center gap-1.5 rounded-xl px-3 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50",
    ACTION_TONES[tone],
    disabled && "pointer-events-none opacity-40"
  );
  const inner = (
    <>
      {icon}
      <span className="hidden md:inline">{label}</span>
    </>
  );
  if (href && !disabled) {
    return (
      <a href={href} aria-label={label} className={cls} {...(external ? { target: "_blank", rel: "noreferrer" } : {})}>
        {inner}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} aria-label={label} disabled={disabled} className={cls}>
      {inner}
    </button>
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
  const [assignOpen, setAssignOpen] = useState(false);
  const [celebrate, setCelebrate] = useState(false);

  const followUpRef = useRef<HTMLDivElement>(null);
  const prevStatusRef = useRef<EnquiryStatus | null>(null);

  const { data: lead, isLoading: leadLoading } = useLeadHistory(leadId);
  const activeEnquiryId = enquiryIdParam ?? lead?.enquiries[0]?.id;
  const { data: enquiry, isLoading: enquiryLoading } = useEnquiry(activeEnquiryId);
  const reassign = useReassign(activeEnquiryId ?? "");
  const { data: crTeam } = useBranchStaff(enquiry?.branchId, "CR_TEAM");
  const { data: callLogs } = useCallLogsForLead(leadId);
  const { data: settings } = useSettings();

  // Fire the celebration only on a real transition into a won stage — not when
  // opening a lead that is already booked/won (prevStatusRef starts null).
  useEffect(() => {
    const status = enquiry?.status;
    if (!status) return;
    const prev = prevStatusRef.current;
    if (prev && prev !== status && status === WIN_STATUS) {
      setCelebrate(true);
    }
    prevStatusRef.current = status;
  }, [enquiry?.status]);

  if (leadLoading || !lead) {
    return (
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div className="h-12 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
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

  const openFollowUp = () => {
    setShowFollowUpForm(true);
    setTimeout(() => followUpRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 60);
  };

  // Safe extractors for the Key Dates section.
  const bookingDate = enquiry?.statusHistory?.find((h) => h.toStatus === "BOOKED")?.createdAt;
  const retailDate = enquiry?.statusHistory?.find((h) => h.toStatus === "RETAIL_DONE")?.createdAt;
  const tdFeedback = enquiry?.testDriveFeedbacks?.[0];
  const tdDate = tdFeedback?.completedAt ?? tdFeedback?.scheduledAt ?? null;

  const phoneDigits = lead.phoneRaw?.replace(/\D/g, "") ?? "";
  const canReassign = !!(user && REASSIGN_ROLES.includes(user.role) && crTeam);

  const followUpUrgency = (() => {
    if (!enquiry?.followUpDueAt) return null;
    const due = new Date(enquiry.followUpDueAt);
    const now = new Date();
    if (due < now && due.toDateString() !== now.toDateString()) return "overdue" as const;
    if (due.toDateString() === now.toDateString()) return "today" as const;
    return "future" as const;
  })();

  const keyDates: { label: string; value: Date | null }[] = [
    { label: "Enquiry Date", value: enquiry ? new Date(enquiry.createdAt) : null },
    { label: "Appointment Date", value: enquiry?.appointmentAt ? new Date(enquiry.appointmentAt) : null },
    { label: "Test Drive Date", value: tdDate ? new Date(tdDate) : null },
    { label: "Booking Date", value: bookingDate ? new Date(bookingDate) : null },
    { label: "Retail Date", value: retailDate ? new Date(retailDate) : null },
  ];

  const completeDetailsNeeded =
    !!enquiry && DIGITAL_SOURCES.includes(enquiry.source) && (!enquiry.department || !enquiry.enquiryCategory);

  const insights = enquiry ? buildInsights(lead, enquiry) : [];
  const leadScore = enquiry ? computeLeadScore(lead, enquiry) : 0;

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="mx-auto flex min-w-0 max-w-7xl flex-col gap-6 pb-12">
      {celebrate && (
        <ConfettiBurst
          customerName={lead.name}
          crName={enquiry?.assignedCr?.name ?? undefined}
          carModel={enquiry?.carModel}
          onDone={() => setCelebrate(false)}
        />
      )}

      {/* ---------- STICKY ACTION BAR ---------- */}
      <div className="sticky top-0 z-30 -mx-4 border-b border-slate-200/70 bg-white/80 px-4 py-2.5 backdrop-blur-xl md:-mx-6 md:px-6 lg:-mx-8 lg:px-8 dark:border-slate-800/70 dark:bg-slate-950/80 before:pointer-events-none before:absolute before:inset-x-0 before:bottom-full before:h-4 before:bg-white/80 before:backdrop-blur-xl md:before:h-6 lg:before:h-8 dark:before:bg-slate-950/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <Link
              to="/leads"
              aria-label="Back to Leads"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-blue-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-blue-400"
            >
              <ArrowLeft size={18} />
            </Link>
            <Avatar name={lead.name} size="sm" />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold leading-tight text-slate-900 dark:text-white">{lead.name}</p>
              <div className="mt-0.5 flex items-center gap-1.5">
                {enquiry ? (
                  <StatusBadge status={enquiry.status} />
                ) : (
                  <span className="text-xs text-slate-400 dark:text-slate-500">Loading…</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <ActionButton icon={<Phone size={16} />} label="Call" href={`tel:${lead.phoneRaw}`} tone="call" disabled={!lead.phoneRaw} />
            <ActionButton
              icon={<MessageCircle size={16} />}
              label="WhatsApp"
              href={phoneDigits ? `https://wa.me/${phoneDigits}` : undefined}
              external
              tone="whatsapp"
              disabled={!phoneDigits}
            />
            <span className="mx-0.5 hidden h-6 w-px bg-slate-200 sm:block dark:bg-slate-700" />
            <ActionButton icon={<Zap size={16} />} label="Follow-up" onClick={openFollowUp} tone="primary" disabled={!enquiry || enquiry.status === "CLOSED"} />
            <ActionButton icon={<Pencil size={16} />} label="Edit" onClick={() => setShowDetailsWizard(true)} disabled={!enquiry} />
            {canReassign && (
              <div className="relative">
                <ActionButton icon={<UserPlus size={16} />} label="Assign" onClick={() => setAssignOpen((o) => !o)} disabled={!enquiry} />
                {assignOpen && enquiry && (
                  <div className="absolute right-0 top-full z-40 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-3 shadow-xl dark:border-slate-700 dark:bg-slate-900">
                    <p className="mb-2 text-xs font-semibold text-slate-500 dark:text-slate-400">Reassign to CR</p>
                    <Select value={reassignTo} onChange={(e) => setReassignTo(e.target.value)} className="w-full text-sm">
                      <option value="">Select CR…</option>
                      {crTeam?.map((cr) => (
                        <option key={cr.id} value={cr.id}>
                          {cr.name}
                        </option>
                      ))}
                    </Select>
                    <Button
                      size="sm"
                      className="mt-2 w-full"
                      disabled={!reassignTo}
                      onClick={() => {
                        reassign.mutate({ toUserId: reassignTo });
                        setReassignTo("");
                        setAssignOpen(false);
                      }}
                    >
                      Assign
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ---------- HERO HEADER ---------- */}
      <motion.div
        variants={fadeUp}
        className="glass-panel relative overflow-hidden rounded-3xl p-6 sm:p-7 dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)]"
      >
        <div className="pointer-events-none absolute -right-16 -top-24 h-56 w-56 rounded-full bg-blue-500/10 blur-[70px] dark:bg-blue-500/20" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 h-48 w-48 rounded-full bg-indigo-500/5 blur-[70px] dark:bg-indigo-500/10" />

        <div className="relative z-10 flex flex-col gap-5">
          <div className="flex min-w-0 items-center gap-4">
            <Avatar name={lead.name} size="lg" />
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-600/80 dark:text-blue-400/80">Lead Details</p>
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
                {enquiry && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-700/60 dark:text-slate-300">
                    <Building2 size={11} />
                    {enquiry.branch.name}
                  </span>
                )}
              </div>
            </div>
          </div>

          {completeDetailsNeeded && (
            <div className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-amber-500/20 dark:bg-amber-500/10">
              <p className="flex items-center gap-2 text-sm font-medium text-amber-800 dark:text-amber-300">
                <ClipboardEdit size={16} />
                Some enquiry details are missing — complete them to improve routing.
              </p>
              <Button size="sm" icon={<ClipboardEdit size={14} />} onClick={() => setShowDetailsWizard(true)}>
                Complete Details
              </Button>
            </div>
          )}
        </div>
      </motion.div>

      {enquiryLoading || !enquiry ? (
        <div className="h-64 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
      ) : (
        <>
          {/* ---------- INFORMATION CARDS ---------- */}
          <motion.div variants={fadeUp} className="grid grid-cols-1 gap-6 lg:grid-cols-2">
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

          {/* ---------- AI INSIGHTS ---------- */}
          <motion.div variants={fadeUp}>
            <Card className="relative overflow-hidden">
              <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gradient-to-br from-blue-500/15 to-indigo-500/10 blur-2xl" />
              <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
                <div className="flex items-center gap-4">
                  <ScoreRing score={leadScore} />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <Sparkles size={16} className="text-blue-500 dark:text-blue-400" />
                      <h2 className="text-base font-bold text-slate-900 dark:text-white">AI Insights</h2>
                    </div>
                    <p className="mt-1 max-w-[16rem] text-xs text-slate-500 dark:text-slate-400">
                      On-the-fly analysis of this lead's signals and the next best actions.
                    </p>
                  </div>
                </div>
                <div className="flex-1 sm:border-l sm:border-slate-100 sm:pl-6 dark:sm:border-slate-700/60">
                  <ul className="flex flex-col gap-2.5">
                    {insights.map((ins, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm">
                        <span className={clsx("mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg", INSIGHT_TONE[ins.tone])}>
                          {ins.icon}
                        </span>
                        <span className="text-slate-700 dark:text-slate-300">{ins.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* ---------- STAGE PROGRESS ---------- */}
          <motion.div variants={fadeUp}>
            <Card>
              <PipelineStepper status={enquiry.status} lossReason={enquiry.lossReason} />
            </Card>
          </motion.div>

          {/* ---------- SMART FOLLOW-UP / SUGGESTED ACTIONS ---------- */}
          {enquiry.status !== "CLOSED" && (
            <motion.div
              variants={fadeUp}
              className="flex flex-col gap-4 rounded-2xl border border-blue-100 bg-blue-50/60 p-5 lg:flex-row lg:items-center lg:justify-between dark:border-blue-500/20 dark:bg-blue-500/10"
            >
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-300">
                  <Zap size={18} />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-blue-900 dark:text-blue-200">Smart next step</h3>
                  <p className="mt-0.5 text-xs text-blue-700/80 dark:text-blue-300/70">
                    {followUpUrgency === "overdue"
                      ? "Follow-up is overdue — reconnect with this lead now."
                      : followUpUrgency === "today"
                        ? "A follow-up is due today. Keep the conversation moving."
                        : enquiry.followUpDueAt
                          ? `Next follow-up on ${new Date(enquiry.followUpDueAt).toLocaleDateString()}.`
                          : "No follow-up scheduled yet — add one to keep momentum."}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <QuickActions status={enquiry.status} onAddFollowUp={openFollowUp} onChangeStatus={handleQuickActionStatus} />
              </div>
            </motion.div>
          )}

          {/* ---------- FORMS SECTION (CONDITIONAL) ---------- */}
          <div className="flex flex-col gap-4">
            {showFollowUpForm && (
              <div ref={followUpRef}>
                <FollowUpForm enquiryId={enquiry.id} onSuccess={() => setShowFollowUpForm(false)} onCancel={() => setShowFollowUpForm(false)} />
              </div>
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
              {/* ---------- FOLLOW-UP HISTORY ---------- */}
              <motion.div variants={fadeUp}>
                <FollowUpTable followUps={enquiry.followUps || []} onAddClick={openFollowUp} canAdd={enquiry.status !== "CLOSED"} />
              </motion.div>

              {/* ---------- ACTIVITY TIMELINE ---------- */}
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
              {/* ---------- KEY DATES ---------- */}
              <motion.div variants={fadeUp}>
                <Card>
                  <CardHeader
                    icon={<CalendarDays size={18} />}
                    iconClassName="bg-amber-50 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400"
                    title="Key Dates"
                  />
                  <div className="flex flex-col text-sm">
                    {keyDates.map((d) => (
                      <div key={d.label} className="flex items-center justify-between border-b border-slate-100 py-2.5 last:border-0 dark:border-slate-700/50">
                        <span className="text-slate-500 dark:text-slate-400">{d.label}</span>
                        <span className="font-semibold tabular-nums text-slate-900 dark:text-white">{d.value ? d.value.toLocaleDateString() : "—"}</span>
                      </div>
                    ))}
                    <div
                      className={clsx(
                        "-mx-6 mt-2 flex items-center justify-between px-6 py-3",
                        followUpUrgency === "overdue"
                          ? "bg-red-50/70 dark:bg-red-500/10"
                          : followUpUrgency === "today"
                            ? "bg-amber-50/70 dark:bg-amber-500/10"
                            : "bg-blue-50/70 dark:bg-blue-500/10"
                      )}
                    >
                      <span
                        className={clsx(
                          "font-medium",
                          followUpUrgency === "overdue"
                            ? "text-red-900 dark:text-red-200"
                            : followUpUrgency === "today"
                              ? "text-amber-900 dark:text-amber-200"
                              : "text-blue-900 dark:text-blue-200"
                        )}
                      >
                        Next Follow-up
                      </span>
                      <span
                        className={clsx(
                          "font-bold tabular-nums",
                          followUpUrgency === "overdue"
                            ? "text-red-700 dark:text-red-300"
                            : followUpUrgency === "today"
                              ? "text-amber-700 dark:text-amber-300"
                              : "text-blue-700 dark:text-blue-300"
                        )}
                      >
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
                      <span key={source} className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
                        {source.replaceAll("_", " ")} ×{count}
                      </span>
                    ))}
                    {Object.entries(lead.messagesByChannel).map(([channel, count]) => (
                      <span key={channel} className="rounded-full bg-fuchsia-50 px-2.5 py-1 text-xs font-medium text-fuchsia-700 dark:bg-fuchsia-500/15 dark:text-fuchsia-300">
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
                    <CardHeader icon={<PhoneCall size={16} />} iconClassName="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400" title="AI Call History" />
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
