import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import clsx from "clsx";
import {
  ClipboardList,
  KeyRound,
  CircleX,
  PhoneOutgoing,
  UserPlus,
  Inbox,
  BarChart3,
  PhoneCall,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  Flower2,
  ChevronRight
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useSummaryReport, useYoyReport, useTrendReport, useSourcePerformanceReport } from "../hooks/useReports";
import { useLeads, useReminders } from "../hooks/useLeads";
import { Card } from "../components/common/Card";
import { TrendChart } from "../components/reports/TrendChart";
import { HBarList } from "../components/reports/HBarList";
import { Avatar } from "../components/common/Avatar";
import { StatusBadge } from "../components/common/StatusBadge";
import { CountUp } from "../components/common/CountUp";
import { Sparkline } from "../components/common/Sparkline";
import { Skeleton } from "@/components/ui/skeleton";

// Elegant, fluid transitions tailored for the Lotus theme
const fluidTransition = { type: "spring", stiffness: 280, damping: 28, mass: 1 };
const staggerContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } }
};
const fadeUp = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: fluidTransition },
};

const REPORT_VISIBLE_ROLES = ["SUPER_ADMIN", "ADMIN", "BRANCH_MANAGER"];

const QUICK_ACTIONS = [
  { to: "/leads", icon: <UserPlus size={16} strokeWidth={2.5} />, title: "New Lead", roles: undefined },
  { to: "/social-inbox", icon: <Inbox size={16} strokeWidth={2.5} />, title: "Inbox", roles: ["SUPER_ADMIN", "ADMIN", "BRANCH_MANAGER", "CR_TEAM"] },
  { to: "/call-campaigns", icon: <PhoneCall size={16} strokeWidth={2.5} />, title: "Campaigns", roles: ["SUPER_ADMIN", "ADMIN", "BRANCH_MANAGER", "CR_TEAM"] },
];

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function SectionHeader({ title, to, cta }: { title: string; to?: string; cta?: string }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-[15px] font-bold tracking-tight text-slate-800">{title}</h2>
      {to && cta && (
        <Link to={to} className="group flex items-center gap-1 text-[13px] font-semibold text-rose-500 transition-colors hover:text-rose-700">
          {cta}
          <ChevronRight size={14} strokeWidth={3} className="transition-transform duration-300 group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}

function LotusBadge({ delta, upIsGood = true }: { delta?: number | null; upIsGood?: boolean }) {
  if (delta == null || Number.isNaN(delta)) return null;
  const positive = delta >= 0;
  const good = upIsGood ? positive : !positive;
  return (
    <div
      className={clsx(
        "flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold tabular-nums tracking-wide shadow-sm ring-1 ring-inset backdrop-blur-md",
        good
          ? "bg-emerald-50/80 text-emerald-600 ring-emerald-500/20"
          : "bg-rose-50/80 text-rose-600 ring-rose-500/20"
      )}
    >
      {positive ? <TrendingUp size={12} strokeWidth={3} /> : <TrendingDown size={12} strokeWidth={3} />}
      {Math.abs(delta)}%
    </div>
  );
}

/* ---------- Lotus-Themed KPI Card ---------- */
function LotusKpi({
  label, value, suffix, icon, accentClass, series, delta, upIsGood = true,
}: {
  label: string; value: number; suffix?: string; icon: ReactNode; accentClass: string; series?: number[]; delta?: number | null; upIsGood?: boolean;
}) {
  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ y: -4, scale: 1.01 }}
      className="group relative flex flex-col justify-between overflow-hidden rounded-[24px] bg-white p-6 shadow-[0_4px_24px_-6px_rgba(225,29,72,0.05)] ring-1 ring-slate-100 transition-all duration-300 hover:shadow-[0_12px_40px_-10px_rgba(225,29,72,0.12)]"
    >
      <div className="flex items-start justify-between">
        <div className={clsx("flex h-12 w-12 items-center justify-center rounded-2xl shadow-sm ring-1 ring-inset", accentClass)}>
          {icon}
        </div>
        <LotusBadge delta={delta} upIsGood={upIsGood} />
      </div>

      <div className="mt-8 flex items-end justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1">{label}</p>
          <p className="text-3xl font-black tracking-tight text-slate-800 tabular-nums">
            <CountUp value={value} />{suffix}
          </p>
        </div>
        {series && series.length > 1 && (
          <div className="mb-1 w-24 opacity-30 transition-opacity duration-300 group-hover:opacity-80">
            <Sparkline data={series} color="#e11d48" width={96} height={24} className="w-full grayscale group-hover:grayscale-0 transition-all" />
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ---------- Lotus Signature Conversion Ring ---------- */
function LotusConversionRing({ rate }: { rate: number }) {
  const r = 58;
  const c = 2 * Math.PI * r;
  const off = c * (1 - Math.min(100, Math.max(0, rate)) / 100);
  return (
    <div className="relative flex items-center justify-center h-48 w-48 mx-auto">
      <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90">
        <defs>
          <linearGradient id="lotusGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f43f5e" /> {/* Rose */}
            <stop offset="100%" stopColor="#d946ef" /> {/* Fuchsia */}
          </linearGradient>
        </defs>
        <circle cx="70" cy="70" r={r} fill="none" strokeWidth="8" className="stroke-slate-50" />
        <circle
          cx="70"
          cy="70"
          r={r}
          fill="none"
          strokeWidth="8"
          stroke="url(#lotusGradient)"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={off}
          className="drop-shadow-sm"
          style={{ transition: "stroke-dashoffset 1.5s cubic-bezier(0.16, 1, 0.3, 1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-black tracking-tight tabular-nums text-slate-800">
          <CountUp value={rate} />%
        </span>
        <span className="mt-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">Win Rate</span>
      </div>
    </div>
  );
}

function ProfessionalActionList({ data }: { data: ReturnType<typeof useReminders>["data"] }) {
  if (!data || data.length === 0) return null;

  return (
    <Card padded={false} className="overflow-hidden rounded-[24px] bg-white shadow-[0_4px_24px_-6px_rgba(225,29,72,0.05)] ring-1 ring-slate-100">
      <div className="px-6 py-5 border-b border-slate-50 flex justify-between items-center bg-rose-50/30">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-100 text-rose-600 ring-1 ring-rose-500/20 shadow-sm">
            <PhoneOutgoing size={14} strokeWidth={2.5} />
          </div>
          <h2 className="text-[15px] font-bold tracking-tight text-slate-800">Attention Required</h2>
        </div>
        <span className="px-3 py-1 text-[11px] font-bold bg-white text-slate-600 rounded-full shadow-sm ring-1 ring-slate-100">
          {data.length} pending
        </span>
      </div>
      <div className="divide-y divide-slate-50">
        {data.slice(0, 5).map((enquiry) => {
          const isOverdue = new Date(enquiry.followUpDueAt!) < new Date() && new Date(enquiry.followUpDueAt!).toDateString() !== new Date().toDateString();
          return (
            <Link key={enquiry.id} to={`/leads/${enquiry.leadId}`} className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-slate-50/80">
              <Avatar name={enquiry.lead.name} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-bold text-slate-800">{enquiry.lead.name}</p>
                <p className="truncate text-[12px] text-slate-500 font-medium">{enquiry.carModel}</p>
              </div>
              <span className={clsx("rounded-md px-2.5 py-1 text-[10px] font-bold tracking-wide uppercase shadow-sm", isOverdue ? "bg-rose-50 text-rose-600 ring-1 ring-inset ring-rose-500/20" : "bg-slate-50 text-slate-600 ring-1 ring-inset ring-slate-500/20")}>
                {isOverdue ? "Overdue" : "Today"}
              </span>
            </Link>
          );
        })}
      </div>
    </Card>
  );
}

export function DashboardPage() {
  const { user } = useAuth();
  const canSeeStats = user?.role && REPORT_VISIBLE_ROLES.includes(user.role);

  const { data: reminders } = useReminders();
  const actionItems = reminders?.filter((r) => {
    if (!r.followUpDueAt) return false;
    const due = new Date(r.followUpDueAt);
    const now = new Date();
    return (due < now && due.toDateString() !== now.toDateString()) || (due.toDateString() === now.toDateString());
  }) ?? [];

  const { data: summary } = useSummaryReport({}, canSeeStats);
  const { data: yoy } = useYoyReport({}, canSeeStats);
  const { data: trend } = useTrendReport({ granularity: "week" }, canSeeStats);
  const { data: sources } = useSourcePerformanceReport({}, canSeeStats);
  const { data: recentLeads } = useLeads({ page: 1, pageSize: 6 });

  const visibleActions = QUICK_ACTIONS.filter((a) => !a.roles || (user && a.roles.includes(user.role)));
  const conversionRate = yoy?.currentPeriod.conversionRate ?? 0;
  const statsLoading = canSeeStats && !summary;

  return (
    <div className="min-h-screen bg-[#FCFCFD] px-4 py-8 relative overflow-hidden font-sans">

      {/* Signature Lotus Background Glows */}
      <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-rose-100/40 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[30%] h-[40%] bg-fuchsia-100/30 rounded-full blur-[100px] pointer-events-none" />

      <motion.div variants={staggerContainer} initial="hidden" animate="show" className="relative z-10 mx-auto flex w-full max-w-[1300px] flex-col gap-8">

        {/* ============ LOTUS BRANDED HEADER ============ */}
        <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between rounded-[24px] bg-white/70 p-8 shadow-[0_4px_24px_-6px_rgba(225,29,72,0.05)] ring-1 ring-slate-100 backdrop-blur-2xl">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="bg-gradient-to-br from-rose-400 to-fuchsia-600 p-1.5 rounded-[10px] shadow-sm">
                <Flower2 size={18} className="text-white" strokeWidth={2.5} />
              </div>
              <span className="font-black tracking-tight text-slate-800 text-[15px] uppercase tracking-wider">Lotus CRM</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 mt-1">
              Welcome back{user?.name ? `, ${user.name.split(" ")[0]}` : ""}
            </h1>
            <p className="text-[13px] font-medium text-slate-500 mt-1">
              Here is your live pipeline and performance overview for {new Date().toLocaleDateString(undefined, { month: "long", day: "numeric" })}.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {visibleActions.map((action) => (
              <Link key={action.to} to={action.to}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-[13px] font-bold text-slate-700 shadow-sm ring-1 ring-inset ring-slate-200 transition-all hover:bg-rose-50 hover:text-rose-700 hover:ring-rose-200"
                >
                  <span className="text-rose-500">{action.icon}</span>
                  {action.title}
                </motion.button>
              </Link>
            ))}
          </div>
        </header>

        {/* ============ BENTO GRID ============ */}
        {canSeeStats ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* Main Canvas (Left 8 Columns) */}
            <div className="lg:col-span-8 flex flex-col gap-6">

              {/* KPI Row */}
              {statsLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-[180px] rounded-[24px] bg-white/50" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <LotusKpi
                    label="Total Enquiries"
                    value={summary?.totalEnquiries ?? 0}
                    delta={yoy?.growth.total}
                    icon={<ClipboardList size={22} strokeWidth={2.5} />}
                    accentClass="bg-fuchsia-50 text-fuchsia-600 ring-fuchsia-500/20"
                    series={trend?.map((p) => p.total)}
                  />
                  <LotusKpi
                    label="Converted Leads"
                    value={summary?.converted ?? 0}
                    delta={yoy?.growth.converted}
                    icon={<KeyRound size={22} strokeWidth={2.5} />}
                    accentClass="bg-emerald-50 text-emerald-600 ring-emerald-500/20"
                    series={trend?.map((p) => p.converted)}
                  />
                  <LotusKpi
                    label="Pending Follow-ups"
                    value={summary?.followUpPending ?? 0}
                    icon={<PhoneOutgoing size={22} strokeWidth={2.5} />}
                    accentClass="bg-amber-50 text-amber-600 ring-amber-500/20"
                  />
                  <LotusKpi
                    label="Lost Opportunities"
                    value={summary?.lost ?? 0}
                    delta={yoy?.growth.lost}
                    upIsGood={false}
                    icon={<CircleX size={22} strokeWidth={2.5} />}
                    accentClass="bg-slate-50 text-slate-600 ring-slate-500/20"
                    series={trend?.map((p) => p.lost)}
                  />
                </div>
              )}

              {/* Performance Chart */}
              <motion.div variants={fadeUp}>
                <Card className="rounded-[24px] bg-white p-8 shadow-[0_4px_24px_-6px_rgba(225,29,72,0.05)] ring-1 ring-slate-100">
                  <SectionHeader title="Performance Trend" to="/reports" cta="View Report" />
                  <div className="min-h-[280px] w-full mt-2">
                    {trend ? <TrendChart points={trend} /> : <Skeleton className="h-[280px] w-full rounded-[16px]" />}
                  </div>
                </Card>
              </motion.div>

              {/* Live Pipeline */}
              <motion.div variants={fadeUp}>
                <Card padded={false} className="rounded-[24px] bg-white shadow-[0_4px_24px_-6px_rgba(225,29,72,0.05)] ring-1 ring-slate-100 overflow-hidden">
                  <div className="px-8 py-6 border-b border-slate-50 bg-slate-50/30">
                    <SectionHeader title="Live Pipeline" to="/leads" cta="View Database" />
                  </div>
                  <div className="divide-y divide-slate-50">
                    {!recentLeads ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-4 px-8 py-5">
                          <Skeleton className="h-10 w-10 rounded-full" />
                          <div className="flex-1 space-y-2"><Skeleton className="h-4 w-1/3" /><Skeleton className="h-3 w-1/4" /></div>
                        </div>
                      ))
                    ) : recentLeads.items.length > 0 ? (
                      recentLeads.items.slice(0, 5).map((enquiry) => (
                        <Link key={enquiry.id} to={`/leads/${enquiry.leadId}`} className="group flex items-center gap-5 px-8 py-5 transition-colors hover:bg-slate-50/80">
                          <Avatar name={enquiry.lead.name} size="sm" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[13px] font-bold text-slate-800">{enquiry.lead.name}</p>
                            <p className="truncate text-[12px] font-medium text-slate-500">{enquiry.carModel} <span className="mx-1 text-slate-300">•</span> {enquiry.branch.name}</p>
                          </div>
                          <StatusBadge status={enquiry.status} />
                          <div className="hidden lg:flex items-center justify-end w-24 text-[12px] font-bold text-slate-400 group-hover:text-rose-500 transition-colors">
                            {timeAgo(enquiry.createdAt)}
                          </div>
                        </Link>
                      ))
                    ) : (
                      <div className="py-12 text-center text-[13px] font-medium text-slate-500">Pipeline is currently empty.</div>
                    )}
                  </div>
                </Card>
              </motion.div>
            </div>

            {/* Insights Rail (Right 4 Columns) */}
            <div className="lg:col-span-4 flex flex-col gap-6">

              {/* Conversion Widget */}
              <motion.div variants={fadeUp}>
                <Card className="rounded-[24px] bg-white p-6 shadow-[0_4px_24px_-6px_rgba(225,29,72,0.05)] ring-1 ring-slate-100">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-[15px] font-bold tracking-tight text-slate-800">Conversion Rate</h3>
                    <LotusBadge delta={yoy?.growth.conversionRate} />
                  </div>

                  {summary ? <LotusConversionRing rate={conversionRate} /> : <div className="h-48 flex items-center justify-center"><Skeleton className="h-40 w-40 rounded-full" /></div>}

                  <div className="mt-8 flex gap-3">
                    <div className="flex flex-1 flex-col items-center justify-center rounded-[16px] bg-slate-50 py-3 ring-1 ring-inset ring-slate-100">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Total</span>
                      <span className="text-lg font-black text-slate-800 tabular-nums"><CountUp value={summary?.totalEnquiries ?? 0} /></span>
                    </div>
                    <div className="flex flex-1 flex-col items-center justify-center rounded-[16px] bg-rose-50 py-3 ring-1 ring-inset ring-rose-500/10">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500 mb-1">Won</span>
                      <span className="text-lg font-black text-rose-600 tabular-nums"><CountUp value={summary?.converted ?? 0} /></span>
                    </div>
                  </div>
                </Card>
              </motion.div>

              {/* Action Required */}
              <motion.div variants={fadeUp}>
                <ProfessionalActionList data={actionItems} />
              </motion.div>

              {/* Top Sources */}
              <motion.div variants={fadeUp}>
                <Card className="rounded-[24px] bg-white p-6 shadow-[0_4px_24px_-6px_rgba(225,29,72,0.05)] ring-1 ring-slate-100">
                  <SectionHeader title="Acquisition Channels" />
                  <div className="mt-2">
                    {sources && sources.length > 0 ? (
                      <HBarList
                        rows={[...sources].sort((a, b) => b.total - a.total).slice(0, 5).map((s) => ({
                          label: s.source.replaceAll("_", " "),
                          value: s.total,
                          fraction: s.total / Math.max(1, ...sources.map((s) => s.total)),
                          valueLabel: `${s.total}`
                        }))}
                        color="#f43f5e" // Lotus Rose
                      />
                    ) : sources ? (
                      <p className="py-6 text-center text-[13px] font-medium text-slate-500">No channel data available.</p>
                    ) : (
                      <div className="space-y-4">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8 w-full rounded-[8px]" />)}</div>
                    )}
                  </div>
                </Card>
              </motion.div>
            </div>
          </div>
        ) : (
          /* Focused view for non-stat roles */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ProfessionalActionList data={actionItems} />
            <Card padded={false} className="rounded-[24px] bg-white shadow-[0_4px_24px_-6px_rgba(225,29,72,0.05)] ring-1 ring-slate-100 overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-50 bg-slate-50/30">
                <SectionHeader title="Your Recent Leads" to="/leads" cta="View All" />
              </div>
              {/* Map recent leads identically to above */}
            </Card>
          </div>
        )}
      </motion.div>
    </div>
  );
}