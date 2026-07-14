import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeft, Eye, Phone, Mail, UserCircle2, Car, ClipboardEdit, MapPin, Tag, Briefcase,
  MessagesSquare, PhoneCall, MessageCircle, Building2, Radio, CalendarDays, Hash, Sparkles,
  AlertTriangle, CalendarClock, Flame, Wallet, TrendingUp, Clock, CheckCircle2, UserPlus,
  Zap, Pencil, Layers, XCircle, AlertCircle, Plus, Check, X, ArrowRightLeft
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

const WIN_STATUS: EnquiryStatus = "RETAIL_DONE";
const REASSIGN_ROLES = ["SUPER_ADMIN", "ADMIN", "BRANCH_MANAGER"];
const PIPELINE_ORDER: EnquiryStatus[] = ["NEW", "UNDER_FOLLOW_UP", "APPOINTMENT_FIXED", "TEST_DRIVE", "BOOKED", "RETAIL_DONE", "CLOSED"];

const toDateInput = (iso?: string | null) => (iso ? iso.slice(0, 10) : undefined);
const toDatetimeLocalInput = (iso?: string | null) => (iso ? iso.slice(0, 16) : undefined);
const daysBetween = (a: Date, b: Date) => Math.floor((a.getTime() - b.getTime()) / 86_400_000);

type DetailTab = "forms" | "activity" | "details";
const DETAIL_TAB_LABELS: Record<DetailTab, string> = { forms: "Pipeline & Forms", activity: "Activity", details: "Details & Contact" };
const DETAIL_TAB_ICONS: Record<DetailTab, LucideIcon> = { forms: Layers, activity: MessagesSquare, details: CalendarDays };

type InsightTone = "urgent" | "warn" | "positive" | "info";
interface Insight { tone: InsightTone; icon: ReactNode; text: string; }

const INSIGHT_TONE: Record<InsightTone, string> = {
  urgent: "bg-red-50 text-red-600 border-red-100",
  warn: "bg-amber-50 text-amber-600 border-amber-100",
  positive: "bg-emerald-50 text-emerald-600 border-emerald-100",
  info: "bg-blue-50 text-blue-600 border-blue-100",
};

type Mood = "blue" | "emerald" | "red";
const MOOD_STYLES: Record<Mood, { cover: string; border: string; }> = {
  blue: { cover: "bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-violet-500/10", border: "border-blue-200" },
  emerald: { cover: "bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-cyan-500/10", border: "border-emerald-200" },
  red: { cover: "bg-gradient-to-br from-rose-500/10 via-red-500/5 to-orange-500/10", border: "border-red-200" },
};

function moodOf(enquiry?: Enquiry): Mood {
  if (!enquiry || enquiry.status !== "CLOSED") return "blue";
  return enquiry.lossReason ? "red" : "emerald";
}

function buildInsights(lead: LeadWithHistory, enquiry: Enquiry): Insight[] {
  const out: Insight[] = [];
  const now = new Date();
  if (enquiry.status !== "CLOSED") {
    if (enquiry.followUpDueAt) {
      const due = new Date(enquiry.followUpDueAt);
      const overdueDays = daysBetween(now, due);
      if (due < now && due.toDateString() !== now.toDateString()) {
        out.push({ tone: "urgent", icon: <AlertTriangle size={14} />, text: `Follow-up overdue by ${Math.max(1, overdueDays)} day(s) — reach out now.` });
      } else if (due.toDateString() === now.toDateString()) {
        out.push({ tone: "warn", icon: <CalendarClock size={14} />, text: "Follow-up is due today." });
      }
    } else {
      out.push({ tone: "warn", icon: <CalendarClock size={14} />, text: "No follow-up scheduled — set one to keep momentum." });
    }
  }
  if (enquiry.enquiryCategory === "HOT") out.push({ tone: "urgent", icon: <Flame size={14} />, text: "High-intent HOT lead — prioritise today." });
  else if (enquiry.enquiryCategory === "COLD") out.push({ tone: "info", icon: <TrendingUp size={14} />, text: "Cold lead — nurture with value before pushing to book." });

  if (out.length === 0) out.push({ tone: "positive", icon: <CheckCircle2 size={14} />, text: "This lead is on track — keep the momentum going." });
  return out.slice(0, 4);
}

function computeLeadScore(lead: LeadWithHistory, enquiry: Enquiry): number {
  let score = enquiry.enquiryCategory === "HOT" ? 45 : enquiry.enquiryCategory === "WARM" ? 30 : enquiry.enquiryCategory === "COLD" ? 15 : 25;
  const stageIdx = Math.min(PIPELINE_ORDER.indexOf(enquiry.status), 5);
  if (stageIdx > 0) score += stageIdx * 6;
  score += Math.min(lead.touches.length, 5) * 3;
  if (enquiry.testDriveInterested) score += 5;
  if (enquiry.appointmentScheduled) score += 5;
  return Math.max(5, Math.min(100, Math.round(score)));
}

function ScoreRing({ score }: { score: number }) {
  const r = 34;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - score / 100);
  const color = score >= 70 ? "#10b981" : score >= 45 ? "#3b82f6" : score >= 25 ? "#f59e0b" : "#ef4444";

  return (
    <div className="relative h-20 w-20 shrink-0 drop-shadow-sm">
      <svg viewBox="0 0 80 80" className="relative h-20 w-20 -rotate-90">
        <circle cx="40" cy="40" r={r} fill="none" strokeWidth="6" className="stroke-slate-100" />
        <circle cx="40" cy="40" r={r} fill="none" strokeWidth="6" stroke={color} strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} style={{ transition: "stroke-dashoffset 1s ease-out" }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-extrabold tabular-nums tracking-tight text-slate-800">{score}</span>
      </div>
    </div>
  );
}

function InfoField({ icon, label, value, className }: { icon: ReactNode; label: string; value?: ReactNode; className?: string }) {
  return (
    <div className={clsx("flex flex-col gap-1 rounded-2xl bg-white/50 border border-white p-3 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)] backdrop-blur-sm transition-all hover:bg-white/80", className)}>
      <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">{icon}{label}</p>
      <p className="text-sm font-bold text-slate-800 break-words">{value ?? "—"}</p>
    </div>
  );
}

const ACTION_TONES = {
  default: "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200/60 shadow-sm",
  call: "bg-gradient-to-b from-blue-500 to-blue-600 text-white shadow-blue-500/25 shadow-md border border-blue-500/50 hover:from-blue-400 hover:to-blue-500",
  whatsapp: "bg-gradient-to-b from-emerald-500 to-emerald-600 text-white shadow-emerald-500/25 shadow-md border border-emerald-500/50 hover:from-emerald-400 hover:to-emerald-500",
  primary: "bg-gradient-to-b from-slate-800 to-slate-900 text-white shadow-slate-900/20 shadow-md border border-slate-800 hover:from-slate-700 hover:to-slate-800",
} as const;

function ActionButton({ icon, label, onClick, href, external, tone = "default", disabled }: { icon: ReactNode; label: string; onClick?: () => void; href?: string; external?: boolean; tone?: keyof typeof ACTION_TONES; disabled?: boolean; }) {
  const cls = clsx(
    "group relative inline-flex h-11 items-center justify-center gap-2 rounded-2xl px-4 text-sm font-semibold transition-all active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/20 overflow-hidden",
    ACTION_TONES[tone],
    disabled && "pointer-events-none opacity-40 grayscale"
  );

  const inner = (
    <>
      <span className="relative z-10 flex items-center gap-2">
        {icon} <span className="hidden sm:inline">{label}</span>
      </span>
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-white/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
    </>
  );

  return href && !disabled ? (
    <a href={href} aria-label={label} className={cls} {...(external ? { target: "_blank", rel: "noreferrer" } : {})}>{inner}</a>
  ) : (
    <button type="button" onClick={onClick} aria-label={label} disabled={disabled} className={cls}>{inner}</button>
  );
}

export function LeadDetailPage() {
  const { leadId, enquiryId: enquiryIdParam } = useParams<{ leadId: string; enquiryId?: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusModalTarget, setStatusModalTarget] = useState<EnquiryStatus | undefined>();
  const [showDetailsWizard, setShowDetailsWizard] = useState(false);
  const [showFollowUpForm, setShowFollowUpForm] = useState(false);
  const [showNewEnquiry, setShowNewEnquiry] = useState(false);
  const [activeTab, setActiveTab] = useState<DetailTab>("activity");
  const [celebrate, setCelebrate] = useState(false);
  
  // Modals for details
  const [showFollowUpsModal, setShowFollowUpsModal] = useState(false);
  const [showTimelineModal, setShowTimelineModal] = useState(false);
  const [showContactHistoryModal, setShowContactHistoryModal] = useState(false);
  const [showCallHistoryModal, setShowCallHistoryModal] = useState(false);

  const prevStatusRef = useRef<EnquiryStatus | null>(null);

  const { data: lead, isLoading: leadLoading, isError: leadError, refetch: refetchLead } = useLeadHistory(leadId);
  const activeEnquiryId = enquiryIdParam ?? lead?.enquiries[0]?.id;
  const { data: enquiry, isLoading: enquiryLoading } = useEnquiry(activeEnquiryId);
  const { data: callLogs } = useCallLogsForLead(leadId);
  const { data: settings } = useSettings();

  useEffect(() => {
    const status = enquiry?.status;
    if (!status) return;
    const prev = prevStatusRef.current;
    if (prev && prev !== status && status === WIN_STATUS) setCelebrate(true);
    prevStatusRef.current = status;
  }, [enquiry?.status]);

  useEffect(() => {
    setActiveTab("activity");
  }, [activeEnquiryId]);

  if (leadLoading) {
    return (
      <div className="mx-auto flex h-screen max-w-7xl items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
      </div>
    );
  }

  if (leadError || !lead) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-5 py-20 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-600">
          <AlertCircle size={30} />
        </span>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Couldn't load this lead</h1>
          <p className="mt-1.5 text-sm text-slate-500">It may have been removed, or you don't have access.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => refetchLead()}>Retry</Button>
          <Button icon={<ArrowLeft size={14} />} onClick={() => navigate("/leads")}>Back to Leads</Button>
        </div>
      </div>
    );
  }

  const handleQuickActionStatus = (target?: EnquiryStatus) => { setStatusModalTarget(target); setShowStatusModal(true); };
  const openFollowUp = () => setShowFollowUpForm(true);

  const phoneDigits = lead.phoneRaw?.replace(/\D/g, "") ?? "";
  const insights = enquiry ? buildInsights(lead, enquiry) : [];
  const leadScore = enquiry ? computeLeadScore(lead, enquiry) : 0;
  const mood = moodOf(enquiry);
  const moodStyle = MOOD_STYLES[mood];

  // Logic for dynamic tabs display
  const showTestDrive = enquiry && (enquiry.status === "APPOINTMENT_FIXED" || enquiry.status === "TEST_DRIVE" || (enquiry.testDriveFeedbacks?.length ?? 0) > 0);
  const showQuotation = enquiry && (settings?.quotationEnabled !== false && (["TEST_DRIVE", "BOOKED", "RETAIL_DONE"].includes(enquiry.status) || !!enquiry.quotation));
  const showExchange = enquiry && (enquiry.status === "BOOKED" || !!enquiry.exchangeEvaluation);
  const showFinance = enquiry && (enquiry.status === "BOOKED" || !!enquiry.financeApplication);
  const showDelivery = enquiry && (enquiry.status === "RETAIL_DONE" || !!enquiry.deliveryDetails);
  const hasForms = showTestDrive || showQuotation || showExchange || showFinance || showDelivery;

  // Key Dates Extraction
  const bookingDate = enquiry?.statusHistory?.find((h) => h.toStatus === "BOOKED")?.createdAt;
  const retailDate = enquiry?.statusHistory?.find((h) => h.toStatus === "RETAIL_DONE")?.createdAt;
  const tdFeedback = enquiry?.testDriveFeedbacks?.[0];
  const tdDate = tdFeedback?.completedAt ?? tdFeedback?.scheduledAt ?? null;
  const keyDates = [
    { label: "Enquiry Date", value: enquiry ? new Date(enquiry.createdAt) : null },
    { label: "Appointment Date", value: enquiry?.appointmentAt ? new Date(enquiry.appointmentAt) : null },
    { label: "Test Drive Date", value: tdDate ? new Date(tdDate) : null },
    { label: "Booking Date", value: bookingDate ? new Date(bookingDate) : null },
    { label: "Retail Date", value: retailDate ? new Date(retailDate) : null },
  ];

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 font-sans text-slate-900 selection:bg-blue-200">
      {celebrate && <ConfettiBurst customerName={lead.name} carModel={enquiry?.carModel} onDone={() => setCelebrate(false)} />}

      {/* FLOATING GLASS HEADER */}
      <div className="sticky top-4 z-40 mx-4 max-w-7xl md:mx-auto">
        <div className="flex h-16 items-center justify-between rounded-[2rem] border border-white/60 bg-white/70 px-4 shadow-[0_8px_30px_rgb(0,0,0,0.06)] backdrop-blur-2xl">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/leads")} className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm transition-transform hover:scale-105 active:scale-95 text-slate-600 border border-slate-200/60">
              <ArrowLeft size={18} />
            </button>
            <div className="hidden sm:block">
              <h1 className="text-sm font-extrabold tracking-tight text-slate-800">{lead.name}</h1>
              <p className="text-xs font-semibold text-slate-400">{lead.phoneRaw}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ActionButton icon={<Phone size={16} />} label="Call" href={`tel:${lead.phoneRaw}`} tone="call" disabled={!lead.phoneRaw} />
            <ActionButton icon={<MessageCircle size={16} />} label="WhatsApp" href={phoneDigits ? `https://wa.me/${phoneDigits}` : undefined} external tone="whatsapp" disabled={!phoneDigits} />
            <div className="mx-2 hidden h-6 w-px bg-slate-200 sm:block" />
            <ActionButton icon={<Zap size={16} />} label="Follow-up" onClick={openFollowUp} tone="primary" disabled={!enquiry || enquiry.status === "CLOSED"} />
            <ActionButton icon={<Pencil size={16} />} label="Edit" onClick={() => setShowDetailsWizard(true)} disabled={!enquiry} />
          </div>
        </div>
      </div>

      <motion.div variants={staggerContainer} initial="hidden" animate="show" className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">

        {/* BENTO GRID LAYOUT */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">

          {/* HERO CARD (Span 8) */}
          <motion.div variants={fadeUp} className={clsx("relative col-span-1 lg:col-span-8 overflow-hidden rounded-[2.5rem] border bg-white p-8 shadow-sm transition-all", moodStyle.border)}>
            <div className={clsx("absolute inset-0 opacity-40", moodStyle.cover)} />
            <div className="relative z-10 flex flex-col md:flex-row md:items-end gap-6">
              <span className="shrink-0 rounded-full border-4 border-white shadow-lg">
                <Avatar name={lead.name} size="xl" />
              </span>
              <div className="flex-1">
                <h1 className="text-4xl font-black tracking-tighter text-slate-900">{lead.name}</h1>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {enquiry ? (
                    <StatusBadge status={enquiry.status} lossReason={enquiry.lossReason} />
                  ) : (
                    <span className="text-xs font-medium text-slate-400">Loading enquiry...</span>
                  )}
                  {enquiry && (
                    <span className="inline-flex items-center gap-1 rounded-xl bg-white/80 px-3 py-1 text-xs font-bold text-slate-600 shadow-sm backdrop-blur-md">
                      <Hash size={12} /> {enquiry.id.slice(-6).toUpperCase()}
                    </span>
                  )}
                  {enquiry && (
                    <span className="inline-flex items-center gap-1 rounded-xl bg-white/80 px-3 py-1 text-xs font-bold text-slate-600 shadow-sm backdrop-blur-md">
                      <Building2 size={12} /> {enquiry.branch.name}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {enquiry && (
              <div className="relative z-10 mt-8 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                <InfoField icon={<Car size={14} />} label="Interested Vehicle" value={enquiry.carModel} />
                <InfoField icon={<Mail size={14} />} label="Email Address" value={lead.email} />
                <InfoField icon={<UserCircle2 size={14} />} label="Sales CR" value={enquiry.assignedCr?.name ?? "Unassigned"} />
                <InfoField icon={<Tag size={14} />} label="Category" value={enquiry.enquiryCategory} />
              </div>
            )}
          </motion.div>

          {/* AI INSIGHTS CARD (Span 4) */}
          <motion.div variants={fadeUp} className="col-span-1 lg:col-span-4 flex flex-col justify-between rounded-[2.5rem] border border-blue-100 bg-gradient-to-b from-blue-50/50 to-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="flex items-center gap-2 text-base font-bold text-blue-900">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100 text-blue-600 shadow-inner">
                  <Sparkles size={16} />
                </span>
                Smart Insights
              </h2>
              <ScoreRing score={leadScore} />
            </div>

            <ul className="space-y-2.5 flex-1">
              {insights.map((ins, i) => (
                <li key={i} className={clsx("flex items-start gap-3 rounded-2xl border bg-white p-3 shadow-sm transition-all hover:shadow-md", INSIGHT_TONE[ins.tone])}>
                  <span className="mt-0.5 shrink-0">{ins.icon}</span>
                  <span className="text-sm font-semibold leading-tight">{ins.text}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* REPEAT LEAD SWITCHER (Conditional, Span 12) */}
          {lead.enquiries.length > 1 && (
            <motion.div variants={fadeUp} className="col-span-1 lg:col-span-12">
              <div className="rounded-[2.5rem] border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between px-2">
                  <div className="flex items-center gap-2">
                    <Layers size={16} className="text-blue-500" />
                    <h2 className="text-sm font-bold text-slate-800">Multiple Enquiries</h2>
                  </div>
                  <button onClick={() => setShowNewEnquiry(true)} className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 bg-blue-50 px-3 py-1.5 rounded-lg">
                    <Plus size={14} /> New
                  </button>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
                  {lead.enquiries.map((enq) => {
                    const active = enq.id === activeEnquiryId;
                    return (
                      <button
                        key={enq.id}
                        onClick={() => navigate(`/leads/${leadId}/enquiries/${enq.id}`)}
                        className={clsx(
                          "flex min-w-[220px] flex-col gap-2 rounded-[1.5rem] border p-4 text-left transition-all",
                          active ? "border-blue-300 bg-blue-50/50 shadow-md scale-[1.02]" : "border-slate-100 bg-white hover:border-blue-200 hover:shadow-sm"
                        )}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate text-sm font-extrabold text-slate-800">{enq.carModel}</span>
                          {active && <span className="shrink-0 text-[10px] font-black uppercase tracking-widest text-blue-600">Active</span>}
                        </div>
                        <StatusBadge status={enq.status} lossReason={enq.lossReason} />
                        <span className="text-xs font-semibold text-slate-400">{new Date(enq.createdAt).toLocaleDateString()}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* PIPELINE FULL WIDTH (Span 12) */}
          {enquiry && (
            <motion.div variants={fadeUp} className="col-span-1 lg:col-span-12 rounded-[2.5rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="text-lg font-black tracking-tight text-slate-800">Pipeline Status</h3>
                <QuickActions status={enquiry.status} onChangeStatus={handleQuickActionStatus} />
              </div>
              <PipelineStepper status={enquiry.status} lossReason={enquiry.lossReason} statusHistory={enquiry.statusHistory} />
            </motion.div>
          )}

          {/* DYNAMIC TABS & CONTENT (Span 12) */}
          {enquiry && (
            <div className="col-span-1 lg:col-span-12 mt-4">
              <div className="flex gap-2 p-1.5 bg-slate-200/50 backdrop-blur-md rounded-2xl w-fit mb-6 overflow-x-auto max-w-full">
                {(["activity", "forms", "details"] as DetailTab[]).map((tab) => {
                  const Icon = DETAIL_TAB_ICONS[tab];
                  const isActive = activeTab === tab;
                  return (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={clsx(
                        "relative flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all whitespace-nowrap",
                        isActive ? "text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                      )}
                    >
                      {isActive && <motion.div layoutId="activeTab" className="absolute inset-0 -z-10 rounded-xl bg-white" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />}
                      <Icon size={16} /> {DETAIL_TAB_LABELS[tab]}
                    </button>
                  );
                })}
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  
                  {/* --- ACTIVITY TAB --- */}
                  {activeTab === "activity" && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <Card className="rounded-[2.5rem] p-6 border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader 
                          icon={<MessagesSquare size={20} />} 
                          iconClassName="bg-blue-100 text-blue-600 rounded-xl" 
                          title="Activity Timeline" 
                          actions={
                            <button onClick={() => setShowTimelineModal(true)} className="h-8 w-8 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-blue-600 flex items-center justify-center transition-colors">
                              <Eye size={16} />
                            </button>
                          }
                        />
                        <div className="mt-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                          <UnifiedTimeline enquiryId={enquiry.id} statusHistory={enquiry.statusHistory || []} followUps={enquiry.followUps || []} />
                        </div>
                      </Card>
                      <Card className="rounded-[2.5rem] p-6 border-slate-200 shadow-sm hover:shadow-md transition-shadow h-fit">
                        <CardHeader 
                          icon={<Zap size={20} />} 
                          iconClassName="bg-amber-100 text-amber-600 rounded-xl" 
                          title="Recent Follow-ups" 
                          actions={
                            <button onClick={() => setShowFollowUpsModal(true)} className="h-8 w-8 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-amber-600 flex items-center justify-center transition-colors">
                              <Eye size={16} />
                            </button>
                          }
                        />
                        <div className="mt-4">
                          <FollowUpTable followUps={enquiry.followUps || []} onAddClick={openFollowUp} canAdd={false} limit={4} />
                        </div>
                      </Card>
                    </div>
                  )}

                  {/* --- FORMS TAB --- */}
                  {activeTab === "forms" && (
                    <div className="flex flex-col gap-6">
                      {hasForms ? (
                        <>
                          {(showTestDrive || showQuotation) && (
                            <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
                              {showTestDrive && <TestDriveForm enquiryId={enquiry.id} branchId={enquiry.branchId} existing={enquiry.testDriveFeedbacks} />}
                              {showQuotation && <QuotationForm enquiryId={enquiry.id} branchId={enquiry.branchId} existing={enquiry.quotation} />}
                            </div>
                          )}
                          {showExchange && <ExchangeForm enquiryId={enquiry.id} branchId={enquiry.branchId} existing={enquiry.exchangeEvaluation} />}
                          {showFinance && <FinanceForm enquiryId={enquiry.id} existing={enquiry.financeApplication} />}
                          {showDelivery && <DeliveryForm enquiryId={enquiry.id} existing={enquiry.deliveryDetails} />}
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center rounded-[2.5rem] border-2 border-slate-200 border-dashed bg-white/50 py-20 text-center">
                          <Layers className="h-12 w-12 text-slate-300 mb-4" />
                          <h3 className="text-lg font-bold text-slate-700">No active forms</h3>
                          <p className="mt-1 text-sm text-slate-500">Pipeline forms will appear here as the deal progresses.</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* --- DETAILS TAB --- */}
                  {activeTab === "details" && (
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                      {/* Key Dates Card */}
                      <Card className="rounded-[2.5rem] p-6 border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader icon={<CalendarDays size={20} />} iconClassName="bg-emerald-100 text-emerald-600 rounded-xl" title="Key Dates" />
                        <div className="mt-6 flex flex-col gap-4 text-sm">
                          {keyDates.map((d) => (
                            <div key={d.label} className="flex flex-col gap-1 border-b border-slate-100 pb-3 last:border-0">
                              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{d.label}</span>
                              <span className="font-extrabold text-slate-800">{d.value ? d.value.toLocaleDateString() : "—"}</span>
                            </div>
                          ))}
                        </div>
                      </Card>

                      {/* Contact History & Full Profile Info */}
                      <div className="flex flex-col gap-6 lg:col-span-2">
                        <Card className="rounded-[2.5rem] p-6 border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                          <CardHeader 
                            icon={<MessagesSquare size={20} />} 
                            iconClassName="bg-fuchsia-100 text-fuchsia-600 rounded-xl" 
                            title="Contact History" 
                            actions={
                              lead.touches.length > 4 && (
                                <button onClick={() => setShowContactHistoryModal(true)} className="h-8 w-8 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-fuchsia-600 flex items-center justify-center transition-colors">
                                  <Eye size={16} />
                                </button>
                              )
                            }
                          />
                          <div className="mt-4 flex flex-wrap gap-2 mb-4">
                            {Object.entries(lead.touchesBySource).map(([source, count]) => (
                              <span key={source} className="rounded-xl bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 border border-blue-100">
                                {source.replaceAll("_", " ")} ×{count}
                              </span>
                            ))}
                          </div>
                          <ul className="flex flex-col gap-2">
                            {lead.touches.slice(0, 4).map((touch) => (
                              <li key={touch.id} className="rounded-[1rem] bg-slate-50 border border-slate-100 p-3 text-sm">
                                <div className="flex items-center justify-between">
                                  <span className="font-extrabold text-slate-800">{touch.source.replaceAll("_", " ")}</span>
                                  <span className="text-xs font-semibold text-slate-400">{new Date(touch.createdAt).toLocaleDateString()}</span>
                                </div>
                                {touch.note && <p className="mt-1 text-slate-600">{touch.note}</p>}
                              </li>
                            ))}
                          </ul>
                        </Card>
                        
                        {callLogs && callLogs.length > 0 && (
                          <Card className="rounded-[2.5rem] p-6 border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                            <CardHeader 
                              icon={<PhoneCall size={20} />} 
                              iconClassName="bg-indigo-100 text-indigo-600 rounded-xl" 
                              title="AI Call History" 
                              actions={
                                callLogs.length > 3 && (
                                  <button onClick={() => setShowCallHistoryModal(true)} className="h-8 w-8 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-indigo-600 flex items-center justify-center transition-colors">
                                    <Eye size={16} />
                                  </button>
                                )
                              }
                            />
                            <ul className="mt-4 flex flex-col gap-3">
                              {callLogs.slice(0, 3).map((call) => (
                                <li key={call.id} className="rounded-[1rem] bg-slate-50 border border-slate-100 p-4">
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="font-extrabold text-slate-800">{call.status.replaceAll("_", " ")}</span>
                                    <span className="text-xs font-semibold text-slate-400">{new Date(call.createdAt).toLocaleString()}</span>
                                  </div>
                                  {call.recordingUrl && <audio controls src={call.recordingUrl} className="mt-3 h-10 w-full rounded-lg" />}
                                </li>
                              ))}
                            </ul>
                          </Card>
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          )}

        </div>
      </motion.div>

      {/* --- ALL MODALS --- */}
      
      {enquiry && (
        <StatusChangeModal
          enquiryId={enquiry.id}
          branchId={enquiry.branchId}
          currentStatus={enquiry.status}
          isOpen={showStatusModal}
          onClose={() => setShowStatusModal(false)}
          initialTargetStatus={statusModalTarget}
        />
      )}

      {enquiry && (
        <Modal isOpen={showFollowUpForm} onClose={() => setShowFollowUpForm(false)} title="Add Follow-up" maxWidth="max-w-2xl">
          <FollowUpForm enquiryId={enquiry.id} onSuccess={() => setShowFollowUpForm(false)} onCancel={() => setShowFollowUpForm(false)} />
        </Modal>
      )}

      {enquiry && (
        <Modal isOpen={showFollowUpsModal} onClose={() => setShowFollowUpsModal(false)} title="Follow-up History" maxWidth="max-w-4xl">
          <FollowUpTable followUps={enquiry.followUps || []} onAddClick={openFollowUp} canAdd={false} />
        </Modal>
      )}

      {enquiry && (
        <Modal isOpen={showTimelineModal} onClose={() => setShowTimelineModal(false)} title="Activity Timeline" maxWidth="max-w-2xl">
          <UnifiedTimeline enquiryId={enquiry.id} statusHistory={enquiry.statusHistory || []} followUps={enquiry.followUps || []} />
        </Modal>
      )}

      <Modal isOpen={showContactHistoryModal} onClose={() => setShowContactHistoryModal(false)} title="Contact History" maxWidth="max-w-lg">
        <ul className="flex flex-col gap-2">
          {lead.touches.map((touch) => (
            <li key={touch.id} className="rounded-[1rem] bg-slate-50 border border-slate-100 p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-slate-800">{touch.source.replaceAll("_", " ")}</span>
                <span className="text-xs font-semibold text-slate-400">{new Date(touch.createdAt).toLocaleDateString()}</span>
              </div>
              {touch.note && <p className="mt-1 text-slate-600">{touch.note}</p>}
            </li>
          ))}
        </ul>
      </Modal>

      <Modal isOpen={showCallHistoryModal} onClose={() => setShowCallHistoryModal(false)} title="AI Call History" maxWidth="max-w-lg">
        <ul className="flex flex-col gap-3">
          {callLogs?.map((call) => (
            <li key={call.id} className="rounded-[1rem] bg-slate-50 border border-slate-100 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="font-extrabold text-slate-800">{call.status.replaceAll("_", " ")}</span>
                <span className="text-xs font-semibold text-slate-400">{new Date(call.createdAt).toLocaleString()}</span>
              </div>
              {call.recordingUrl && <audio controls src={call.recordingUrl} className="mt-3 h-10 w-full rounded-lg" />}
            </li>
          ))}
        </ul>
      </Modal>

      {enquiry && (
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
      )}

      {/* New enquiry for this returning customer */}
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

    </div>
  );
}