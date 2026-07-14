import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import clsx from "clsx";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeft,
  Eye,
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
  Layers,
  XCircle,
  AlertCircle,
  Plus,
  Check,
  X,
  ArrowRightLeft,
} from "lucide-react";
import { useLeadHistory } from "../hooks/useLeads";
import { useEnquiry, useReassign, useUpdateEnquiryDetails } from "../hooks/useEnquiry";
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
import { Modal } from "../components/common/Modal";
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
import { CopyButton } from "../components/common/CopyButton";
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

type DetailTab = "forms" | "activity" | "details";
const DETAIL_TAB_LABELS: Record<DetailTab, string> = {
  forms: "Pipeline & Forms",
  activity: "Activity",
  details: "Details & Contact",
};
const DETAIL_TAB_ICONS: Record<DetailTab, LucideIcon> = {
  forms: Layers,
  activity: MessagesSquare,
  details: CalendarDays,
};

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

/** The deal's current "mood" — active/won/lost — used to tint the hero accent bar, the
 * pipeline card's edge, and the avatar ring so the whole page reads the outcome at a glance. */
type Mood = "blue" | "emerald" | "red";
const MOOD_STYLES: Record<Mood, { cover: string; border: string; glow: string }> = {
  blue: {
    cover: "from-blue-600 via-indigo-600 to-violet-600",
    border: "border-l-blue-500",
    glow: "shadow-[0_30px_80px_-25px_rgba(79,70,229,0.5)] dark:shadow-[0_30px_80px_-25px_rgba(79,70,229,0.35)]",
  },
  emerald: {
    cover: "from-emerald-600 via-teal-600 to-cyan-600",
    border: "border-l-emerald-500",
    glow: "shadow-[0_30px_80px_-25px_rgba(5,150,105,0.5)] dark:shadow-[0_30px_80px_-25px_rgba(5,150,105,0.35)]",
  },
  red: {
    cover: "from-rose-600 via-red-600 to-orange-600",
    border: "border-l-red-500",
    glow: "shadow-[0_30px_80px_-25px_rgba(225,29,72,0.5)] dark:shadow-[0_30px_80px_-25px_rgba(225,29,72,0.35)]",
  },
};

function moodOf(enquiry?: Enquiry): Mood {
  if (!enquiry || enquiry.status !== "CLOSED") return "blue";
  return enquiry.lossReason ? "red" : "emerald";
}

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

/** Tier gradient + glow for the score ring — same "gradient stroke + drop-shadow glow"
 * language as the DashboardPage conversion ring, so the two premium metrics feel like one family. */
function scoreTier(score: number): { stops: [string, string]; glow: string; text: string } {
  if (score >= 70) return { stops: ["#34d399", "#0d9488"], glow: "rgba(16,185,129,0.45)", text: "from-emerald-500 to-teal-500 dark:from-emerald-400 dark:to-teal-400" };
  if (score >= 45) return { stops: ["#60a5fa", "#4f46e5"], glow: "rgba(59,130,246,0.45)", text: "from-blue-500 to-indigo-500 dark:from-blue-400 dark:to-indigo-400" };
  if (score >= 25) return { stops: ["#fbbf24", "#ea580c"], glow: "rgba(217,119,6,0.45)", text: "from-amber-500 to-orange-600 dark:from-amber-400 dark:to-orange-400" };
  return { stops: ["#fb7185", "#dc2626"], glow: "rgba(220,38,38,0.45)", text: "from-rose-500 to-red-600 dark:from-rose-400 dark:to-red-400" };
}

function ScoreRing({ score }: { score: number }) {
  const r = 34;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - score / 100);
  const tier = scoreTier(score);
  const gradId = "leadScoreGrad";
  return (
    <div className="relative h-16 w-16 shrink-0">
      <div
        className="pointer-events-none absolute inset-1 animate-pulse rounded-full blur-xl"
        style={{ backgroundColor: tier.glow, animationDuration: "3s" }}
      />
      <svg viewBox="0 0 80 80" className="relative h-16 w-16 -rotate-90" aria-hidden>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={tier.stops[0]} />
            <stop offset="100%" stopColor={tier.stops[1]} />
          </linearGradient>
        </defs>
        <circle cx="40" cy="40" r={r} fill="none" strokeWidth="7" className="stroke-slate-200 dark:stroke-slate-700" />
        <circle
          cx="40"
          cy="40"
          r={r}
          fill="none"
          strokeWidth="7"
          stroke={`url(#${gradId})`}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: "stroke-dashoffset 0.8s cubic-bezier(0.22, 1, 0.36, 1)",
            filter: `drop-shadow(0 0 5px ${tier.glow})`,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={clsx("bg-gradient-to-br bg-clip-text text-lg font-extrabold tabular-nums text-transparent", tier.text)}>{score}</span>
        <span className="text-[9px] font-semibold uppercase tracking-widest text-slate-400">score</span>
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

/** Compact chip for optional context (category/profession/location) — only ever rendered when there's a real value, so unknowns don't leave dashes cluttering the hero. */
function MetaPill({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-slate-700/60 dark:text-slate-300">
      {icon}
      {children}
    </span>
  );
}

const ACTION_TONES = {
  default:
    "border border-slate-200 bg-white text-slate-600 hover:-translate-y-0.5 hover:border-slate-300 hover:text-slate-900 hover:shadow-md hover:shadow-slate-900/5 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:text-white",
  call: "border border-blue-200 bg-blue-50 text-blue-700 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md hover:shadow-blue-500/20 dark:border-blue-500/25 dark:bg-blue-500/10 dark:text-blue-300 dark:hover:border-blue-500/40",
  whatsapp:
    "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md hover:shadow-emerald-500/20 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300 dark:hover:border-emerald-500/40",
  primary:
    "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/30 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-600/40 hover:from-blue-500 hover:to-indigo-500",
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
    "inline-flex h-11 min-w-11 items-center justify-center gap-1.5 rounded-full px-4 text-sm font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50",
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
  const [reassignTo, setReassignTo] = useState("");
  const [assignOpen, setAssignOpen] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const [showNewEnquiry, setShowNewEnquiry] = useState(false);
  const [consultantEdit, setConsultantEdit] = useState(false);
  const [consultantValue, setConsultantValue] = useState("");
  const [activeTab, setActiveTab] = useState<DetailTab>("activity");

  const prevStatusRef = useRef<EnquiryStatus | null>(null);
  const assignRef = useRef<HTMLDivElement>(null);

  const { data: lead, isLoading: leadLoading, isError: leadError, refetch: refetchLead } = useLeadHistory(leadId);
  const activeEnquiryId = enquiryIdParam ?? lead?.enquiries[0]?.id;
  const { data: enquiry, isLoading: enquiryLoading, isError: enquiryError, refetch: refetchEnquiry } = useEnquiry(activeEnquiryId);
  const reassign = useReassign(activeEnquiryId ?? "");
  const updateDetails = useUpdateEnquiryDetails(activeEnquiryId ?? "");
  const { data: crTeam } = useBranchStaff(enquiry?.branchId, "CR_TEAM");
  const { data: consultants } = useBranchStaff(enquiry?.branchId, "CONSULTANT");
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

  // Switching to a different enquiry (repeat-lead switcher) should land back on
  // the default tab rather than keep whatever tab the previous enquiry had open.
  useEffect(() => {
    setActiveTab("activity");
  }, [activeEnquiryId]);

  // Dismiss the Assign popover on outside-click or Escape.
  useEffect(() => {
    if (!assignOpen) return;
    const onDown = (e: MouseEvent) => {
      if (assignRef.current && !assignRef.current.contains(e.target as Node)) setAssignOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAssignOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [assignOpen]);

  if (leadLoading) {
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

  if (leadError || !lead) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-5 py-20 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-300">
          <AlertCircle size={30} />
        </span>
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Couldn't load this lead</h1>
          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
            It may have been removed, or you don't have access to it. Try again, or head back to your leads.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button variant="secondary" onClick={() => refetchLead()}>
            Retry
          </Button>
          <Button icon={<ArrowLeft size={14} />} onClick={() => navigate("/leads")}>
            Back to Leads
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
  const mood = moodOf(enquiry);
  const moodStyle = MOOD_STYLES[mood];

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

      {/* ---------- HERO HEADER (identity, actions, and info all live in one card now) ---------- */}
      <motion.div variants={fadeUp} className={clsx("relative overflow-hidden rounded-3xl", moodStyle.glow)}>
        {/* Cover banner — the deal's mood (active/won/lost), bold and unmissable */}
        <div className={clsx("grain-overlay relative h-20 overflow-hidden bg-gradient-to-br sm:h-24", moodStyle.cover)}>
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" />
          <div className="pointer-events-none absolute -right-8 -top-14 h-40 w-40 rounded-full bg-white/20 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-10 left-10 h-28 w-28 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute right-1/3 top-0 h-24 w-24 rounded-full bg-white/10 blur-3xl" />
          <Link
            to="/leads"
            aria-label="Back to Leads"
            className="absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm transition-colors hover:bg-white/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          >
            <ArrowLeft size={17} />
          </Link>
          {enquiry && (
            <button
              type="button"
              onClick={() => setShowCustomerView(true)}
              aria-label="View full customer details"
              className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm transition-colors hover:bg-white/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            >
              <Eye size={16} />
            </button>
          )}
        </div>

        <div className="glass-panel relative px-4 pb-4 sm:px-5 sm:pb-5">
          <div className="flex flex-wrap items-end gap-3 pb-3">
            <span className="-mt-10 shrink-0 rounded-full ring-[5px] ring-white sm:-mt-12 dark:ring-slate-900">
              <Avatar name={lead.name} size="xl" />
            </span>
            <div className="min-w-0 flex-1 pb-1">
              <h1 className="truncate text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">{lead.name}</h1>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                {enquiry && <StatusBadge status={enquiry.status} lossReason={enquiry.lossReason} />}
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

          <div className="flex flex-wrap items-center gap-1.5 pb-3">
            <ActionButton icon={<Phone size={16} />} label="Call" href={`tel:${lead.phoneRaw}`} tone="call" disabled={!lead.phoneRaw} />
            <ActionButton
              icon={<MessageCircle size={16} />}
              label="WhatsApp"
              href={phoneDigits ? `https://wa.me/${phoneDigits}` : undefined}
              external
              tone="whatsapp"
              disabled={!phoneDigits}
            />
            <ActionButton icon={<Zap size={16} />} label="Follow-up" onClick={openFollowUp} tone="primary" disabled={!enquiry || enquiry.status === "CLOSED"} />
            <ActionButton icon={<Pencil size={16} />} label="Edit" onClick={() => setShowDetailsWizard(true)} disabled={!enquiry} />
            {canReassign && (
              <div className="relative" ref={assignRef}>
                <ActionButton icon={<UserPlus size={16} />} label="Assign" onClick={() => setAssignOpen((o) => !o)} disabled={!enquiry} />
                {assignOpen && enquiry && (
                  <div className="absolute left-0 top-full z-40 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-3 shadow-xl dark:border-slate-700 dark:bg-slate-900">
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

          {enquiry && (
            <div className="flex flex-col gap-3 border-t border-slate-100 pt-3 dark:border-slate-700/60">
              {/* ---- Essentials: always known, always shown ---- */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 text-sm sm:grid-cols-5">
                <InfoField
                  icon={<Phone size={13} />}
                  label="Mobile Number"
                  value={
                    <span className="inline-flex items-center gap-1.5">
                      {lead.phoneRaw}
                      <CopyButton value={lead.phoneRaw} label="Copy phone number" />
                    </span>
                  }
                />
                <InfoField
                  icon={<Mail size={13} />}
                  label="Email"
                  value={
                    <span className="inline-flex items-center gap-1.5">
                      {lead.email || "—"}
                      {lead.email && <CopyButton value={lead.email} label="Copy email" />}
                    </span>
                  }
                />
                <InfoField icon={<Car size={13} />} label="Interested Vehicle" value={enquiry.carModel} />
                <InfoField icon={<UserCircle2 size={13} />} label="Sales CR" value={enquiry.assignedCr?.name ?? "Unassigned"} />
                <div>
                  <p className="mb-1 flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                    <UserCircle2 size={13} /> Consultant
                  </p>
                  {consultantEdit ? (
                    <div className="flex items-center gap-1.5">
                      <Select value={consultantValue} onChange={(e) => setConsultantValue(e.target.value)} className="w-full text-sm">
                        <option value="">Select…</option>
                        {consultants?.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </Select>
                      <button
                        type="button"
                        aria-label="Save consultant"
                        disabled={!consultantValue || updateDetails.isPending}
                        onClick={() => {
                          updateDetails.mutate({ consultantId: consultantValue });
                          setConsultantEdit(false);
                        }}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white transition-colors hover:bg-blue-500 disabled:opacity-40"
                      >
                        <Check size={15} />
                      </button>
                      <button
                        type="button"
                        aria-label="Cancel"
                        onClick={() => setConsultantEdit(false)}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                      >
                        <X size={15} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{enquiry.consultant?.name ?? "—"}</p>
                      {canReassign && (
                        <button
                          type="button"
                          onClick={() => {
                            setConsultantValue(enquiry.consultantId ?? "");
                            setConsultantEdit(true);
                          }}
                          className="text-xs font-semibold text-blue-600 transition-colors hover:underline dark:text-blue-400"
                        >
                          Change
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* ---- Optional context: only rendered when there's something real to say ---- */}
              {(enquiry.enquiryCategory || lead.profession || enquiry.location) && (
                <div className="flex flex-wrap items-center gap-1.5">
                  {enquiry.enquiryCategory && (
                    <MetaPill icon={<Tag size={11} />}>{enquiry.enquiryCategory}</MetaPill>
                  )}
                  {lead.profession && <MetaPill icon={<Briefcase size={11} />}>{lead.profession}</MetaPill>}
                  {enquiry.location && <MetaPill icon={<MapPin size={11} />}>{enquiry.location}</MetaPill>}
                </div>
              )}
            </div>
          )}

          {/* ---- AI Insights, its own elevated panel so it reads as a feature, not filler ---- */}
          {enquiry && enquiry.status !== "CLOSED" && (
            <div className="flex flex-col gap-3 rounded-2xl border border-blue-100/80 bg-gradient-to-br from-blue-50/80 via-white to-white p-3.5 sm:flex-row sm:items-center sm:gap-5 dark:border-blue-500/15 dark:from-blue-500/10 dark:via-slate-900/40 dark:to-slate-900/40">
              <div className="flex items-center gap-2.5 shrink-0">
                <ScoreRing score={leadScore} />
                <h2 className="flex items-center gap-1.5 text-sm font-semibold text-slate-900 dark:text-white">
                  <Sparkles size={14} className="text-blue-500 dark:text-blue-400" />
                  AI Insights
                </h2>
              </div>
              <ul className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-2">
                {insights.slice(0, 4).map((ins, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs">
                    <span className={clsx("mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-lg", INSIGHT_TONE[ins.tone])}>
                      {ins.icon}
                    </span>
                    <span className="text-slate-700 dark:text-slate-300">{ins.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </motion.div>

      {/* ---------- ENQUIRY SWITCHER (repeat leads) ---------- */}
      {lead.enquiries.length > 1 && (
        <motion.div variants={fadeUp}>
          <Card padded={false} className="overflow-hidden">
            <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3 dark:border-slate-800">
              <Layers size={16} className="text-blue-500 dark:text-blue-400" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Enquiries</h2>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600 dark:bg-slate-700/60 dark:text-slate-300">
                {lead.enquiries.length}
              </span>
              <button
                type="button"
                onClick={() => setShowNewEnquiry(true)}
                className="ml-auto inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600 transition-colors hover:border-blue-300 hover:text-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 dark:border-slate-700 dark:text-slate-300 dark:hover:border-blue-500/40 dark:hover:text-blue-400"
              >
                <Plus size={13} /> New enquiry
              </button>
            </div>
            <div className="flex gap-2 overflow-x-auto p-3 [scrollbar-width:thin]">
              {lead.enquiries.map((enq) => {
                const active = enq.id === activeEnquiryId;
                return (
                  <button
                    key={enq.id}
                    type="button"
                    onClick={() => navigate(`/leads/${leadId}/enquiries/${enq.id}`)}
                    aria-current={active}
                    className={clsx(
                      "flex min-w-[190px] flex-col gap-1.5 rounded-xl border p-3 text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                      active
                        ? "border-blue-300 bg-gradient-to-br from-blue-50 to-indigo-50/60 shadow-sm shadow-blue-500/10 dark:border-blue-500/40 dark:from-blue-500/10 dark:to-indigo-500/5"
                        : "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-blue-200 dark:border-slate-700 dark:bg-slate-900/40 dark:hover:border-blue-500/30"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-semibold text-slate-900 dark:text-white">{enq.carModel}</span>
                      {active && <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-blue-600 dark:text-blue-400">Viewing</span>}
                    </div>
                    <StatusBadge status={enq.status} lossReason={enq.lossReason} />
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      {new Date(enq.createdAt).toLocaleDateString()} · {enq.source.replaceAll("_", " ")}
                    </span>
                  </button>
                );
              })}
            </div>
          </Card>
        </motion.div>
      )}

      {lead.enquiries.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 py-14 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300">
            <ClipboardEdit size={26} />
          </span>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">No enquiries yet</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              This customer doesn't have any enquiries. Create one to start the pipeline.
            </p>
          </div>
          <Button icon={<Plus size={14} />} onClick={() => setShowNewEnquiry(true)}>
            New enquiry
          </Button>
        </Card>
      ) : enquiryLoading ? (
        <div className="h-64 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
      ) : enquiryError || !enquiry ? (
        <Card className="flex flex-col items-center gap-3 py-14 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-300">
            <AlertCircle size={26} />
          </span>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Couldn't load this enquiry</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Something went wrong fetching the enquiry details.</p>
          </div>
          <Button variant="secondary" onClick={() => refetchEnquiry()}>
            Retry
          </Button>
        </Card>
      ) : (
        <>
          {/* ---------- LOSS BANNER (closed-lost) ---------- */}
          {enquiry.status === "CLOSED" && enquiry.lossReason && (
            <motion.div
              variants={fadeUp}
              className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-500/25 dark:bg-red-500/10"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-300">
                <XCircle size={18} />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-bold text-red-800 dark:text-red-300">Enquiry lost — {enquiry.lossReason.replaceAll("_", " ")}</p>
                {enquiry.lossNote && <p className="mt-0.5 text-sm text-red-700/80 dark:text-red-300/70">{enquiry.lossNote}</p>}
              </div>
            </motion.div>
          )}

          {/* ---------- STAGE PROGRESS + SMART NEXT STEP ---------- */}
          <motion.div variants={fadeUp}>
            <Card className={clsx("flex flex-col gap-5 border-l-4", moodStyle.border)}>
              <PipelineStepper status={enquiry.status} lossReason={enquiry.lossReason} statusHistory={enquiry.statusHistory} />
              {enquiry.status !== "CLOSED" && (
                <div className="flex flex-col gap-4 rounded-2xl border border-blue-100 bg-blue-50/60 p-5 dark:border-blue-500/20 dark:bg-blue-500/10">
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
                    <Button size="sm" icon={<Zap size={14} />} onClick={openFollowUp}>
                      Add Follow-up
                    </Button>
                    <QuickActions status={enquiry.status} onChangeStatus={handleQuickActionStatus} />
                    <button
                      type="button"
                      onClick={() => handleQuickActionStatus(undefined)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-white/70 px-3 py-1.5 text-sm font-semibold text-blue-700 transition-colors hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300 dark:hover:bg-blue-500/20"
                    >
                      <ArrowRightLeft size={14} />
                      Change status
                    </button>
                  </div>
                </div>
              )}
            </Card>
          </motion.div>

          {/* ---------- TAB BAR ---------- */}
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
                <div role="tablist" className="flex w-fit items-center gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800/60">
                  {tabs.map((tab) => {
                    const Icon = DETAIL_TAB_ICONS[tab];
                    return (
                      <button
                        key={tab}
                        type="button"
                        role="tab"
                        aria-selected={activeTab === tab}
                        onClick={() => setActiveTab(tab)}
                        className={clsx(
                          "relative flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50",
                          activeTab === tab
                            ? "text-blue-700 dark:text-blue-300"
                            : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                        )}
                      >
                        {activeTab === tab && (
                          <motion.span
                            layoutId="leadDetailActiveTab"
                            className="absolute inset-0 -z-10 rounded-lg bg-white shadow-sm dark:bg-slate-700"
                            transition={{ type: "spring", stiffness: 500, damping: 35 }}
                          />
                        )}
                        <Icon size={14} />
                        {DETAIL_TAB_LABELS[tab]}
                      </button>
                    );
                  })}
                </div>

                {/* ---------- PIPELINE & FORMS TAB (CONDITIONAL) ---------- */}
                {activeTab === "forms" && hasForms && (
                  <div className="flex flex-col gap-4">
                    {(showTestDrive || showQuotation) && (
                      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
                        {showTestDrive && <TestDriveForm enquiryId={enquiry.id} branchId={enquiry.branchId} existing={enquiry.testDriveFeedbacks} />}
                        {showQuotation && <QuotationForm enquiryId={enquiry.id} branchId={enquiry.branchId} existing={enquiry.quotation} />}
                      </div>
                    )}
                    {showExchange && <ExchangeForm enquiryId={enquiry.id} branchId={enquiry.branchId} existing={enquiry.exchangeEvaluation} />}
                    {showFinance && <FinanceForm enquiryId={enquiry.id} existing={enquiry.financeApplication} />}
                    {showDelivery && <DeliveryForm enquiryId={enquiry.id} existing={enquiry.deliveryDetails} />}
                  </div>
                )}

                {/* ---------- ACTIVITY TAB ---------- */}
                {activeTab === "activity" && (
                  <div className="flex flex-col gap-6">
                    {/* ---------- FOLLOW-UP HISTORY ---------- */}
                    <motion.div variants={fadeUp}>
                      <FollowUpTable
                        followUps={enquiry.followUps || []}
                        onAddClick={openFollowUp}
                        canAdd={false}
                        limit={4}
                        onViewAll={() => setShowFollowUpsModal(true)}
                      />
                    </motion.div>

                    {/* ---------- ACTIVITY TIMELINE ---------- */}
                    <motion.div variants={fadeUp}>
                      <Card>
                        <CardHeader
                          icon={<MessagesSquare size={18} />}
                          iconClassName="bg-blue-50 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400"
                          title="Activity Timeline"
                          subtitle="Complete audit history of stage changes and follow-ups"
                          actions={
                            <button
                              type="button"
                              onClick={() => setShowTimelineModal(true)}
                              aria-label="View full timeline"
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-blue-400"
                            >
                              <Eye size={16} />
                            </button>
                          }
                        />
                        <div className="max-h-[360px] overflow-y-auto pr-1 [scrollbar-width:thin]">
                          <UnifiedTimeline enquiryId={enquiry.id} statusHistory={enquiry.statusHistory || []} followUps={enquiry.followUps || []} />
                        </div>
                      </Card>
                    </motion.div>
                  </div>
                )}

                {/* ---------- DETAILS & CONTACT TAB ---------- */}
                {activeTab === "details" && (
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
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
                          actions={
                            lead.touches.length > 4 && (
                              <button
                                type="button"
                                onClick={() => setShowContactHistoryModal(true)}
                                aria-label="View all contact history"
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-blue-400"
                              >
                                <Eye size={16} />
                              </button>
                            )
                          }
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
                          <CardHeader
                            icon={<PhoneCall size={16} />}
                            iconClassName="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400"
                            title="AI Call History"
                            actions={
                              callLogs.length > 3 && (
                                <button
                                  type="button"
                                  onClick={() => setShowCallHistoryModal(true)}
                                  aria-label="View all call history"
                                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-blue-400"
                                >
                                  <Eye size={16} />
                                </button>
                              )
                            }
                          />
                          <ul className="flex flex-col gap-2">
                            {callLogs.slice(0, 3).map((call) => (
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

          <Modal
            isOpen={showCustomerView}
            onClose={() => setShowCustomerView(false)}
            title="Customer Details"
            maxWidth="max-w-xl"
          >
            <div className="grid grid-cols-1 gap-x-6 gap-y-4 text-sm sm:grid-cols-2">
              <InfoField icon={<UserCircle2 size={13} />} label="Name" value={lead.name} />
              <InfoField
                icon={<Phone size={13} />}
                label="Mobile Number"
                value={
                  <span className="inline-flex items-center gap-1.5">
                    {lead.phoneRaw}
                    <CopyButton value={lead.phoneRaw} label="Copy phone number" />
                  </span>
                }
              />
              <InfoField icon={<Phone size={13} />} label="Alternate Mobile" value={lead.alternateMobile || "—"} />
              <InfoField
                icon={<Mail size={13} />}
                label="Email"
                value={
                  <span className="inline-flex items-center gap-1.5">
                    {lead.email || "—"}
                    {lead.email && <CopyButton value={lead.email} label="Copy email" />}
                  </span>
                }
              />
              <InfoField icon={<CalendarDays size={13} />} label="Date of Birth" value={lead.dob ? new Date(lead.dob).toLocaleDateString() : "—"} />
              <InfoField icon={<Briefcase size={13} />} label="Profession" value={lead.profession || "—"} />
              <InfoField icon={<MapPin size={13} />} label="Pincode" value={lead.pincode || "—"} />
              <InfoField icon={<MapPin size={13} />} label="Address" className="sm:col-span-2" value={lead.address || "—"} />
              <InfoField icon={<Car size={13} />} label="Interested Vehicle" value={enquiry.carModel} />
              <InfoField icon={<Car size={13} />} label="Variant" value={enquiry.variant || "—"} />
              <InfoField icon={<Tag size={13} />} label="Customer Category" value={enquiry.enquiryCategory || "—"} />
              <InfoField icon={<Tag size={13} />} label="Enquiry Type" value={enquiry.enquiryType.replaceAll("_", " ")} />
              <InfoField icon={<MapPin size={13} />} label="Location" value={enquiry.location || "—"} />
              <div className="col-span-full mt-1 grid grid-cols-1 gap-x-6 gap-y-4 border-t border-slate-100 pt-4 sm:grid-cols-2 dark:border-slate-700/60">
                <InfoField icon={<Building2 size={13} />} label="Branch" value={enquiry.branch.name} />
                <InfoField icon={<Radio size={13} />} label="Source" value={enquiry.source.replaceAll("_", " ")} />
                <InfoField icon={<UserCircle2 size={13} />} label="Sales Consultant (CR)" value={enquiry.assignedCr?.name ?? "Unassigned"} />
                <InfoField icon={<UserCircle2 size={13} />} label="Showroom Consultant" value={enquiry.consultant?.name ?? "—"} />
              </div>
              {enquiry.remarks && (
                <div className="col-span-full border-t border-slate-100 pt-4 dark:border-slate-700/60">
                  <InfoField
                    icon={<ClipboardEdit size={13} />}
                    label="Remarks"
                    value={<span className="font-normal whitespace-pre-wrap">{enquiry.remarks}</span>}
                  />
                </div>
              )}
            </div>
          </Modal>

          <Modal isOpen={showFollowUpForm} onClose={() => setShowFollowUpForm(false)} title="Add Follow-up" maxWidth="max-w-2xl">
            <FollowUpForm enquiryId={enquiry.id} onSuccess={() => setShowFollowUpForm(false)} onCancel={() => setShowFollowUpForm(false)} />
          </Modal>

          <Modal isOpen={showFollowUpsModal} onClose={() => setShowFollowUpsModal(false)} title="Follow-up History" maxWidth="max-w-4xl">
            <FollowUpTable followUps={enquiry.followUps || []} onAddClick={openFollowUp} canAdd={false} />
          </Modal>

          <Modal isOpen={showTimelineModal} onClose={() => setShowTimelineModal(false)} title="Activity Timeline" maxWidth="max-w-2xl">
            <UnifiedTimeline enquiryId={enquiry.id} statusHistory={enquiry.statusHistory || []} followUps={enquiry.followUps || []} />
          </Modal>

          <Modal isOpen={showContactHistoryModal} onClose={() => setShowContactHistoryModal(false)} title="Contact History" maxWidth="max-w-lg">
            <ul className="flex flex-col gap-1.5">
              {lead.touches.map((touch) => (
                <li key={touch.id} className="rounded-lg bg-slate-50 px-3 py-2 text-xs dark:bg-slate-800/60">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{touch.source.replaceAll("_", " ")}</span>
                    <span className="text-slate-400 dark:text-slate-500">{new Date(touch.createdAt).toLocaleDateString()}</span>
                  </div>
                  {touch.note && <p className="mt-0.5 text-slate-500 dark:text-slate-400">{touch.note}</p>}
                </li>
              ))}
            </ul>
          </Modal>

          <Modal isOpen={showCallHistoryModal} onClose={() => setShowCallHistoryModal(false)} title="AI Call History" maxWidth="max-w-lg">
            <ul className="flex flex-col gap-2">
              {callLogs?.map((call) => (
                <li key={call.id} className="rounded-lg bg-slate-50 p-2.5 text-sm dark:bg-slate-800/60">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-800 dark:text-slate-200">{call.status.replaceAll("_", " ")}</span>
                    <span className="text-slate-400 dark:text-slate-500">{new Date(call.createdAt).toLocaleString()}</span>
                  </div>
                  {call.recordingUrl && <audio controls src={call.recordingUrl} className="mt-1.5 h-8 w-full" />}
                </li>
              ))}
            </ul>
          </Modal>

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

      {/* New enquiry for this (returning) customer — prefilled with their contact details. */}
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
