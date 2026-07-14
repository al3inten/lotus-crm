import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import clsx from "clsx";
import {
  ClipboardList,
  KeyRound,
  Percent,
  CircleX,
  PhoneOutgoing,
  UserPlus,
  Inbox,
  BarChart3,
  PhoneCall,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  Sparkles,
  MoreHorizontal
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useSummaryReport, useYoyReport, useTrendReport, useSourcePerformanceReport } from "../hooks/useReports";
import { useLeads, useReminders } from "../hooks/useLeads";
import { Card } from "../components/common/Card";
import { TrendChart } from "../components/reports/TrendChart";
import { HBarList } from "../components/reports/HBarList";
import { VIZ } from "../components/reports/vizTheme";
import { Avatar } from "../components/common/Avatar";
import { StatusBadge } from "../components/common/StatusBadge";
import { CountUp } from "../components/common/CountUp";
import { Sparkline } from "../components/common/Sparkline";
import { Skeleton } from "@/components/ui/skeleton";

// Refined framer-motion variants for a snappy, modern feel
const springTransition = { type: "spring", stiffness: 300, damping: 30 };
const pageFade = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { staggerChildren: 0.1, ...springTransition } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: springTransition },
};

const REPORT_VISIBLE_ROLES = ["SUPER_ADMIN", "ADMIN", "BRANCH_MANAGER"];

const QUICK_ACTIONS = [
  { to: "/leads", icon: <UserPlus size={16} />, title: "New Lead", roles: undefined },
  { to: "/social-inbox", icon: <Inbox size={16} />, title: "Inbox", roles: ["SUPER_ADMIN", "ADMIN", "BRANCH_MANAGER", "CR_TEAM"] },
  { to: "/call-campaigns", icon: <PhoneCall size={16} />, title: "Campaigns", roles: ["SUPER_ADMIN", "ADMIN", "BRANCH_MANAGER", "CR_TEAM"] },
  { to: "/reports", icon: <BarChart3 size={16} />, title: "Reports", roles: REPORT_VISIBLE_ROLES },
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
    <div className="flex items-center justify-between w-full mb-5">
      <h2 className="text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-100">{title}</h2>
      {to && cta && (
        <Link to={to} className="group flex items-center gap-1 text-[13px] font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 transition-colors">
          {cta}
          <ArrowUpRight size={14} className="opacity-50 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100" />
        </Link>
      )}
    </div>
  );
}

function DeltaBadge({ delta, upIsGood = true }: { delta?: number | null; upIsGood?: boolean }) {
  if (delta == null || Number.isNaN(delta)) return null;
  const positive = delta >= 0;
  const good = upIsGood ? positive : !positive;
  return (
    <div
      className={clsx(
        "flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium tabular-nums tracking-wide border",
        good
          ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400"
          : "bg-rose-500/10 text-rose-600 border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400"
      )}
    >
      {positive ? <TrendingUp size={12} strokeWidth={2.5} /> : <TrendingDown size={12} strokeWidth={2.5} />}
      {Math.abs(delta)}%
    </div>
  );
}

/* ---------- 2026 Minimalist KPI Cell ---------- */
function KpiCell({
  label, value, suffix, icon, accentHex, series, delta, upIsGood = true,
}: {
  label: string; value: number; suffix?: string; icon: ReactNode; accentHex: string; series?: number[]; delta?: number | null; upIsGood?: boolean;
}) {
  return (
    <motion.div
      variants={fadeUp}
      className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/60 bg-white/50 p-5 backdrop-blur-xl transition-all duration-300 hover:shadow-sm dark:border-white/[0.08] dark:bg-slate-900/40"
    >
      {/* Subtle top gradient line for premium feel */}
      <div className="absolute top-0 left-0 right-0 h-[2px] opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{ background: `linear-gradient(90deg, transparent, ${accentHex}, transparent)` }} />

      <div className="flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
          {icon}
        </div>
        {series && series.length > 1 && (
          <div className="w-24 opacity-60 grayscale transition-all duration-300 group-hover:opacity-100 group-hover:grayscale-0">
            <Sparkline data={series} color={accentHex} width={96} height={24} className="w-full" />
          </div>
        )}
      </div>

      <div className="mt-6 flex items-end justify-between">
        <div>
          <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-1 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white tabular-nums">
            <CountUp value={value} />{suffix}
          </p>
        </div>
        <div className="mb-1">
          <DeltaBadge delta={delta} upIsGood={upIsGood} />
        </div>
      </div>
    </motion.div>
  );
}

/* ---------- Refined Conversion Ring ---------- */
function ConversionRing({ rate }: { rate: number }) {
  const r = 58;
  const c = 2 * Math.PI * r;
  const off = c * (1 - Math.min(100, Math.max(0, rate)) / 100);
  return (
    <div className="relative flex items-center justify-center h-48 w-48 mx-auto">
      <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90">
        <circle cx="70" cy="70" r={r} fill="none" strokeWidth="8" className="stroke-slate-100 dark:stroke-slate-800" />
        <circle
          cx="70"
          cy="70"
          r={r}
          fill="none"
          strokeWidth="8"
          stroke="currentColor"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={off}
          className="text-violet-500 dark:text-violet-400 drop-shadow-sm"
          style={{ transition: "stroke-dashoffset 1.5s cubic-bezier(0.16, 1, 0.3, 1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-semibold tracking-tight tabular-nums text-slate-900 dark:text-white">
          <CountUp value={rate} />%
        </span>
        <span className="mt-1 text-[11px] font-medium tracking-wide text-slate-500 dark:text-slate-400">Conversion</span>
      </div>
    </div>
  );
}

function ActionRequiredList({ data }: { data: ReturnType<typeof useReminders>["data"] }) {
  if (!data || data.length === 0) return null;

  return (
    <Card padded={false} className="overflow-hidden rounded-3xl border-rose-100 bg-rose-50/30 dark:border-rose-900/30 dark:bg-rose-950/10">
      <div className="px-6 py-5 border-b border-rose-100/60 dark:border-rose-900/30 flex justify-between items-center">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-900/50 dark:text-rose-400">
            <PhoneOutgoing size={14} />
          </div>
          <h2 className="text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-100">Action Required</h2>
        </div>
        <span className="px-2.5 py-1 text-[11px] font-semibold bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300 rounded-full">
          {data.length} pending
        </span>
      </div>
      <div className="divide-y divide-rose-100/50 dark:divide-rose-900/20">
        {data.slice(0, 5).map((enquiry) => {
          const isOverdue = new Date(enquiry.followUpDueAt!) < new Date() && new Date(enquiry.followUpDueAt!).toDateString() !== new Date().toDateString();
          return (
            <Link key={enquiry.id} to={`/leads/${enquiry.leadId}`} className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-white/50 dark:hover:bg-slate-900/50">
              <Avatar name={enquiry.lead.name} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-slate-900 dark:text-slate-200">{enquiry.lead.name}</p>
                <p className="truncate text-[12px] text-slate-500 dark:text-slate-400">{enquiry.carModel}</p>
              </div>
              <span className={clsx("rounded-md px-2 py-1 text-[10px] font-semibold tracking-wide", isOverdue ? "bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400" : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400")}>
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
  const maxSource = Math.max(1, ...(sources ?? []).map((s) => s.total));
  const conversionRate = yoy?.currentPeriod.conversionRate ?? 0;
  const statsLoading = canSeeStats && !summary;

  return (
    <motion.div variants={pageFade} initial="hidden" animate="show" className="mx-auto flex w-full max-w-[1400px] flex-col gap-8 pb-12">

      {/* ============ NEO-HEADER ============ */}
      <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400 mb-1">
            {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Lotus D-CRM
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {visibleActions.map((action) => (
            <Link key={action.to} to={action.to}>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-[13px] font-medium text-slate-700 shadow-sm ring-1 ring-inset ring-slate-200/50 transition-all hover:bg-slate-50 dark:bg-slate-900/50 dark:text-slate-300 dark:ring-white/[0.08] dark:hover:bg-slate-800"
              >
                <span className="text-slate-400 dark:text-slate-500">{action.icon}</span>
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
                  <Skeleton key={i} className="h-40 rounded-3xl" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <KpiCell
                  label="Total Enquiries"
                  value={summary?.totalEnquiries ?? 0}
                  delta={yoy?.growth.total}
                  icon={<ClipboardList size={20} />}
                  accentHex="#8b5cf6"
                  series={trend?.map((p) => p.total)}
                />
                <KpiCell
                  label="Converted Leads"
                  value={summary?.converted ?? 0}
                  delta={yoy?.growth.converted}
                  icon={<KeyRound size={20} />}
                  accentHex="#10b981"
                  series={trend?.map((p) => p.converted)}
                />
                <KpiCell
                  label="Pending Follow-ups"
                  value={summary?.followUpPending ?? 0}
                  icon={<PhoneOutgoing size={20} />}
                  accentHex="#f59e0b"
                />
                <KpiCell
                  label="Lost Opportunities"
                  value={summary?.lost ?? 0}
                  delta={yoy?.growth.lost}
                  upIsGood={false}
                  icon={<CircleX size={20} />}
                  accentHex="#ef4444"
                  series={trend?.map((p) => p.lost)}
                />
              </div>
            )}

            {/* Performance Chart */}
            <motion.div variants={fadeUp}>
              <Card className="rounded-3xl border border-slate-200/60 bg-white/50 p-6 dark:border-white/[0.08] dark:bg-slate-900/40 backdrop-blur-xl">
                <SectionHeader title="Performance Trend" to="/reports" cta="Detailed Report" />
                <div className="min-h-[280px] w-full mt-4">
                  {trend ? <TrendChart points={trend} /> : <Skeleton className="h-[280px] w-full rounded-2xl" />}
                </div>
              </Card>
            </motion.div>

            {/* Recent Leads Table-style */}
            <motion.div variants={fadeUp}>
              <Card padded={false} className="rounded-3xl border border-slate-200/60 bg-white/50 dark:border-white/[0.08] dark:bg-slate-900/40 backdrop-blur-xl overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800/50">
                  <SectionHeader title="Live Pipeline" to="/leads" cta="View All Leads" />
                </div>
                <div className="divide-y divide-slate-100/80 dark:divide-slate-800/50">
                  {!recentLeads ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-4 px-6 py-4">
                        <Skeleton className="h-9 w-9 rounded-full" />
                        <div className="flex-1 space-y-2"><Skeleton className="h-4 w-1/3" /><Skeleton className="h-3 w-1/4" /></div>
                      </div>
                    ))
                  ) : recentLeads.items.length > 0 ? (
                    recentLeads.items.slice(0, 5).map((enquiry) => (
                      <Link key={enquiry.id} to={`/leads/${enquiry.leadId}`} className="group flex items-center gap-4 px-6 py-4 transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <Avatar name={enquiry.lead.name} size="sm" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-medium text-slate-900 dark:text-slate-200">{enquiry.lead.name}</p>
                          <p className="truncate text-[12px] text-slate-500 dark:text-slate-400">{enquiry.carModel} · {enquiry.branch.name}</p>
                        </div>
                        <StatusBadge status={enquiry.status} />
                        <div className="hidden lg:flex items-center gap-2 w-24 justify-end text-[12px] text-slate-400">
                          {timeAgo(enquiry.createdAt)}
                          <MoreHorizontal size={14} className="opacity-0 transition-opacity group-hover:opacity-100" />
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="py-12 text-center text-[13px] text-slate-500">No leads in the pipeline yet.</div>
                  )}
                </div>
              </Card>
            </motion.div>
          </div>

          {/* Insights Rail (Right 4 Columns) */}
          <div className="lg:col-span-4 flex flex-col gap-6">

            {/* Conversion Widget */}
            <motion.div variants={fadeUp}>
              <Card className="rounded-3xl border border-slate-200/60 bg-white/50 p-6 dark:border-white/[0.08] dark:bg-slate-900/40 backdrop-blur-xl">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-100">Win Rate</h3>
                  <DeltaBadge delta={yoy?.growth.conversionRate} />
                </div>
                {summary ? <ConversionRing rate={conversionRate} /> : <div className="h-48 flex items-center justify-center"><Skeleton className="h-40 w-40 rounded-full" /></div>}

                <div className="mt-8 grid grid-cols-2 gap-4">
                  <div className="flex flex-col items-center justify-center rounded-2xl bg-slate-50/50 py-3 dark:bg-slate-800/30">
                    <span className="text-[11px] font-medium text-slate-500 mb-1">Total</span>
                    <span className="text-lg font-semibold text-slate-900 dark:text-white tabular-nums"><CountUp value={summary?.totalEnquiries ?? 0} /></span>
                  </div>
                  <div className="flex flex-col items-center justify-center rounded-2xl bg-violet-50/50 py-3 dark:bg-violet-900/10">
                    <span className="text-[11px] font-medium text-slate-500 mb-1">Won</span>
                    <span className="text-lg font-semibold text-violet-600 dark:text-violet-400 tabular-nums"><CountUp value={summary?.converted ?? 0} /></span>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Top Sources */}
            <motion.div variants={fadeUp}>
              <Card className="rounded-3xl border border-slate-200/60 bg-white/50 p-6 dark:border-white/[0.08] dark:bg-slate-900/40 backdrop-blur-xl">
                <SectionHeader title="Acquisition Channels" />
                <div className="mt-2">
                  {sources && sources.length > 0 ? (
                    <HBarList
                      rows={[...sources].sort((a, b) => b.total - a.total).slice(0, 5).map((s) => ({
                        label: s.source.replaceAll("_", " "),
                        value: s.total,
                        fraction: s.total / maxSource,
                        valueLabel: `${s.total}`
                      }))}
                      color="#8b5cf6"
                    />
                  ) : sources ? (
                    <p className="py-6 text-center text-[13px] text-slate-400">No channel data available.</p>
                  ) : (
                    <div className="space-y-4">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8 w-full rounded-md" />)}</div>
                  )}
                </div>
              </Card>
            </motion.div>

            {/* Action Required */}
            <motion.div variants={fadeUp}>
              <ActionRequiredList data={actionItems} />
            </motion.div>

          </div>
        </div>
      ) : (
        /* Focused view for non-stat roles */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ActionRequiredList data={actionItems} />
          <Card padded={false} className="rounded-3xl border border-slate-200/60 bg-white/50 overflow-hidden dark:border-white/[0.08] dark:bg-slate-900/40">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800/50">
              <SectionHeader title="Your Recent Leads" to="/leads" cta="View All" />
            </div>
            {/* ... reuse the recentLeads map logic from above here ... */}
          </Card>
        </div>
      )}
    </motion.div>
  );
}