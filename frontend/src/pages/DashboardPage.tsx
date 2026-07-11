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
import { fadeUp, staggerContainer, pageFade } from "@/lib/motion";

const REPORT_VISIBLE_ROLES = ["SUPER_ADMIN", "ADMIN", "BRANCH_MANAGER"];

const QUICK_ACTIONS = [
  { to: "/leads", icon: <UserPlus size={16} />, title: "New Lead", roles: undefined as string[] | undefined },
  { to: "/social-inbox", icon: <Inbox size={16} />, title: "Social Inbox", roles: ["SUPER_ADMIN", "ADMIN", "BRANCH_MANAGER", "CR_TEAM"] as string[] | undefined },
  { to: "/call-campaigns", icon: <PhoneCall size={16} />, title: "Campaigns", roles: ["SUPER_ADMIN", "ADMIN", "BRANCH_MANAGER", "CR_TEAM"] as string[] | undefined },
  { to: "/reports", icon: <BarChart3 size={16} />, title: "Reports", roles: REPORT_VISIBLE_ROLES as string[] | undefined },
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
    <div className="flex items-center justify-between">
      <h2 className="text-base font-semibold tracking-tight text-slate-900 dark:text-white">{title}</h2>
      {to && cta && (
        <Link to={to} className="group flex items-center gap-1 text-sm font-medium text-blue-600 transition-colors hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
          {cta}
          <ArrowUpRight size={14} className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
      )}
    </div>
  );
}

function DeltaChip({ delta, upIsGood = true }: { delta?: number | null; upIsGood?: boolean }) {
  if (delta == null || Number.isNaN(delta)) return null;
  const positive = delta >= 0;
  const good = upIsGood ? positive : !positive;
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-bold tabular-nums",
        good ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400" : "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400"
      )}
    >
      {positive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
      {Math.abs(delta)}%
    </span>
  );
}

/* ---------- Futuristic KPI cell ---------- */
function Kpi({
  label,
  value,
  suffix,
  icon,
  accent,
  accentHex,
  series,
  delta,
  upIsGood = true,
  featured,
}: {
  label: string;
  value: number;
  suffix?: string;
  icon: ReactNode;
  accent: string;
  accentHex: string;
  series?: number[];
  delta?: number | null;
  upIsGood?: boolean;
  featured?: boolean;
}) {
  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className={clsx(
        "group relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white/70 p-4 backdrop-blur-xl transition-colors dark:border-white/10 dark:bg-white/[0.04]",
        featured && "glow-border"
      )}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[3px]" style={{ background: `linear-gradient(90deg, transparent, ${accentHex}, transparent)` }} />
      <div className={clsx("pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100", accent)} />
      <div className="relative flex h-full flex-col">
        <div className="flex items-start justify-between">
          <span className={clsx("flex h-10 w-10 items-center justify-center rounded-xl ring-1 ring-inset ring-white/10", accent)}>{icon}</span>
          <DeltaChip delta={delta} upIsGood={upIsGood} />
        </div>
        <p className="mt-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</p>
        <p
          className={clsx(
            "mt-0.5 text-3xl font-bold tabular-nums",
            featured
              ? "bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-500 bg-clip-text text-transparent dark:from-violet-400 dark:via-fuchsia-400 dark:to-cyan-400"
              : "text-slate-900 dark:text-white"
          )}
        >
          <CountUp value={value} />
          {suffix}
        </p>
        {series && series.length > 1 && (
          <div className="mt-auto pt-2">
            <Sparkline data={series} color={accentHex} width={160} height={30} className="w-full" />
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ---------- Glowing conversion ring ---------- */
function ConversionRing({ rate }: { rate: number }) {
  const r = 54;
  const c = 2 * Math.PI * r;
  const off = c * (1 - Math.min(100, Math.max(0, rate)) / 100);
  return (
    <div className="relative h-44 w-44">
      <div className="pointer-events-none absolute inset-4 animate-pulse rounded-full bg-fuchsia-500/15 blur-2xl" style={{ animationDuration: "3s" }} />
      <svg viewBox="0 0 140 140" className="relative h-44 w-44 -rotate-90" aria-hidden>
        <defs>
          <linearGradient id="convgrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#a855f7" />
            <stop offset="50%" stopColor="#ec4899" />
            <stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>
        </defs>
        <circle cx="70" cy="70" r={r} fill="none" strokeWidth="11" className="stroke-slate-200 dark:stroke-white/10" />
        <circle
          cx="70"
          cy="70"
          r={r}
          fill="none"
          strokeWidth="11"
          stroke="url(#convgrad)"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={off}
          style={{ transition: "stroke-dashoffset 1.1s cubic-bezier(0.22,1,0.36,1)", filter: "drop-shadow(0 0 8px rgba(236,72,153,0.55))" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-4xl font-extrabold tabular-nums text-transparent">
          <CountUp value={rate} />%
        </span>
        <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">Conversion</span>
      </div>
    </div>
  );
}

function ActionCard({
  overdue,
  today,
}: {
  overdue: ReturnType<typeof useReminders>["data"];
  today: ReturnType<typeof useReminders>["data"];
}) {
  const rows = [...(overdue ?? []), ...(today ?? [])].slice(0, 6);
  if (rows.length === 0) return null;
  return (
    <Card padded={false} className="overflow-hidden border-amber-200/60 bg-amber-50/20 dark:border-amber-900/50 dark:bg-amber-900/10">
      <div className="flex items-center gap-2 border-b border-amber-100/60 px-5 py-4 dark:border-amber-900/50">
        <PhoneOutgoing className="text-amber-600 dark:text-amber-400" size={17} />
        <h2 className="text-base font-semibold tracking-tight text-slate-900 dark:text-white">Action Required</h2>
        <span className="ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">{rows.length}</span>
      </div>
      <div className="divide-y divide-amber-100/60 dark:divide-amber-900/40">
        {rows.map((enquiry) => {
          const isOverdue =
            new Date(enquiry.followUpDueAt!) < new Date() && new Date(enquiry.followUpDueAt!).toDateString() !== new Date().toDateString();
          return (
            <Link key={enquiry.id} to={`/leads/${enquiry.leadId}`} className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-amber-50 dark:hover:bg-amber-900/20">
              <Avatar name={enquiry.lead.name} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-200">{enquiry.lead.name}</p>
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">{enquiry.carModel}</p>
              </div>
              <span className={clsx("rounded px-2 py-1 text-[10px] font-bold uppercase", isOverdue ? "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400" : "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400")}>
                {isOverdue ? "Overdue" : "Today"}
              </span>
            </Link>
          );
        })}
      </div>
    </Card>
  );
}

function RecentLeadsCard({ data }: { data: ReturnType<typeof useLeads>["data"] }) {
  return (
    <Card padded={false} className="overflow-hidden">
      <div className="border-b border-slate-100 px-6 py-5 dark:border-slate-800">
        <SectionHeader title="Recent Leads" to="/leads" cta="View all" />
      </div>
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {!data ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-6 py-4">
              <Skeleton className="h-9 w-9 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3.5 w-40" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          ))
        ) : data.items.length > 0 ? (
          data.items.slice(0, 6).map((enquiry) => (
            <Link key={enquiry.id} to={`/leads/${enquiry.leadId}`} className="flex items-center gap-4 px-6 py-3.5 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50">
              <Avatar name={enquiry.lead.name} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-200">{enquiry.lead.name}</p>
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">{enquiry.carModel} · {enquiry.branch.name}</p>
              </div>
              <StatusBadge status={enquiry.status} />
              <span className="hidden w-20 shrink-0 text-right text-xs text-slate-400 dark:text-slate-500 sm:block">{timeAgo(enquiry.createdAt)}</span>
            </Link>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
              <UserPlus size={22} />
            </span>
            <p className="mt-3 text-sm font-medium text-slate-600 dark:text-slate-300">No leads yet</p>
          </div>
        )}
      </div>
    </Card>
  );
}

export function DashboardPage() {
  const { user } = useAuth();
  const canSeeStats = user?.role && REPORT_VISIBLE_ROLES.includes(user.role);

  const { data: reminders } = useReminders();
  const todayReminders = reminders?.filter((r) => r.followUpDueAt && new Date(r.followUpDueAt).toDateString() === new Date().toDateString()) ?? [];
  const overdueReminders =
    reminders?.filter((r) => {
      if (!r.followUpDueAt) return false;
      const due = new Date(r.followUpDueAt);
      const now = new Date();
      return due < now && due.toDateString() !== now.toDateString();
    }) ?? [];

  const { data: summary } = useSummaryReport({}, canSeeStats);
  const { data: yoy } = useYoyReport({}, canSeeStats);
  const { data: trend } = useTrendReport({ granularity: "week" }, canSeeStats);
  const { data: sources } = useSourcePerformanceReport({}, canSeeStats);
  const { data: recentLeads } = useLeads({ page: 1, pageSize: 6 });
  const visibleActions = QUICK_ACTIONS.filter((a) => !a.roles || (user && a.roles.includes(user.role)));

  const maxSource = Math.max(1, ...(sources ?? []).map((s) => s.total));
  const today = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });

  const totalSeries = trend?.map((p) => p.total);
  const convertedSeries = trend?.map((p) => p.converted);
  const lostSeries = trend?.map((p) => p.lost);
  const conversionRate = yoy?.currentPeriod.conversionRate ?? 0;
  const statsLoading = canSeeStats && !summary;

  return (
    <motion.div variants={pageFade} initial="hidden" animate="show" className="mx-auto flex w-full max-w-7xl flex-col gap-5">
      {/* ============ HERO ============ */}
      <div className="relative overflow-hidden rounded-[1.75rem] bg-[#0b0618] px-6 py-7 shadow-2xl shadow-violet-950/40 sm:px-9">
        <div className="aurora-layer pointer-events-none absolute inset-0 opacity-20 blur-2xl" />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.1]"
          style={{ backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)", backgroundSize: "22px 22px", maskImage: "radial-gradient(ellipse 80% 80% at 50% 0%, #000 40%, transparent 100%)" }}
        />
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-[10%] -top-[60%] h-[220%] w-[45%] animate-pulse rounded-full bg-violet-600/40 blur-[110px]" style={{ animationDuration: "5s" }} />
          <div className="absolute -right-[12%] top-[-40%] h-[190%] w-[50%] animate-pulse rounded-full bg-fuchsia-500/30 blur-[120px]" style={{ animationDuration: "7s", animationDelay: "1.5s" }} />
          <div className="absolute bottom-[-60%] left-[35%] h-[160%] w-[45%] animate-pulse rounded-full bg-cyan-400/20 blur-[120px]" style={{ animationDuration: "8s" }} />
        </div>
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-fuchsia-400/70 to-transparent" />

        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-xs font-medium text-fuchsia-200 ring-1 ring-inset ring-white/10 backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-400" />
              </span>
              {today}
            </span>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Welcome back
              {user?.name ? (
                <>
                  ,{" "}
                  <span className="bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300 bg-clip-text text-transparent">{user.name.split(" ")[0]}</span>
                </>
              ) : (
                ""
              )}
            </h1>
            <p className="mt-2 text-sm text-slate-300 sm:text-base">Your live command center — leads, conversion and campaigns at a glance.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {visibleActions.map((action) => (
              <Link key={action.to} to={action.to}>
                <motion.button
                  whileHover={{ y: -3 }}
                  whileTap={{ scale: 0.97 }}
                  className="group flex cursor-pointer items-center gap-2 rounded-xl bg-white/[0.06] px-4 py-2.5 text-sm font-semibold text-white ring-1 ring-inset ring-white/[0.12] backdrop-blur-md transition-colors hover:bg-white/[0.12] hover:ring-fuchsia-400/40"
                >
                  <span className="text-fuchsia-300 transition-colors group-hover:text-cyan-200">{action.icon}</span>
                  {action.title}
                </motion.button>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ============ CANVAS + INSIGHTS RAIL ============ */}
      {canSeeStats ? (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {/* MAIN CANVAS */}
          <div className="flex flex-col gap-5 lg:col-span-2">
            {/* KPI bento 2×2 */}
            {statsLoading ? (
              <div className="grid grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-36 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" style={{ animationDelay: `${i * 60}ms` }} />
                ))}
              </div>
            ) : (
              <motion.div variants={staggerContainer} initial="hidden" animate="show" className="grid grid-cols-2 gap-4">
                <Kpi featured label="Total Enquiries" value={summary?.totalEnquiries ?? 0} delta={yoy?.growth.total} icon={<ClipboardList size={20} className="text-violet-300" />} accent="bg-violet-500/20" accentHex="#8b5cf6" series={totalSeries} />
                <Kpi label="Converted" value={summary?.converted ?? 0} delta={yoy?.growth.converted} icon={<KeyRound size={18} className="text-emerald-300" />} accent="bg-emerald-500/20" accentHex={VIZ.series2} series={convertedSeries} />
                <Kpi label="Follow-up Pending" value={summary?.followUpPending ?? 0} icon={<PhoneOutgoing size={18} className="text-amber-300" />} accent="bg-amber-500/20" accentHex="#f59e0b" />
                <Kpi label="Lost" value={summary?.lost ?? 0} delta={yoy?.growth.lost} upIsGood={false} icon={<CircleX size={18} className="text-red-300" />} accent="bg-red-500/20" accentHex={VIZ.series6} series={lostSeries} />
              </motion.div>
            )}

            {/* Trend */}
            <motion.div variants={fadeUp} initial="hidden" animate="show">
              <Card className="flex flex-col">
                <div className="mb-6 flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-cyan-500/10 text-violet-600 ring-1 ring-inset ring-violet-500/10 dark:text-violet-400">
                    <TrendingUp size={17} />
                  </span>
                  <div className="flex-1">
                    <SectionHeader title="Enquiry Trend" to="/reports" cta="View report" />
                  </div>
                </div>
                <div className="min-h-[250px]">{trend ? <TrendChart points={trend} /> : <Skeleton className="h-56 w-full" />}</div>
              </Card>
            </motion.div>

            {/* Recent leads */}
            <motion.div variants={fadeUp} initial="hidden" animate="show">
              <RecentLeadsCard data={recentLeads} />
            </motion.div>
          </div>

          {/* INSIGHTS RAIL */}
          <div className="flex flex-col gap-5">
            {/* Conversion ring */}
            <motion.div variants={fadeUp} initial="hidden" animate="show">
              <Card className="flex flex-col items-center">
                <div className="mb-3 flex w-full items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-fuchsia-500/20 to-cyan-500/10 text-fuchsia-600 ring-1 ring-inset ring-fuchsia-500/10 dark:text-fuchsia-400">
                      <Percent size={15} />
                    </span>
                    <h2 className="text-base font-semibold tracking-tight text-slate-900 dark:text-white">Conversion</h2>
                  </div>
                  <DeltaChip delta={yoy?.growth.conversionRate} />
                </div>
                {summary ? <ConversionRing rate={conversionRate} /> : <div className="h-44 w-44 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />}
                <div className="mt-4 grid w-full grid-cols-2 gap-3">
                  <div className="rounded-xl bg-slate-50 p-3 text-center dark:bg-slate-800/50">
                    <p className="text-xl font-bold tabular-nums text-slate-900 dark:text-white"><CountUp value={summary?.totalEnquiries ?? 0} /></p>
                    <p className="mt-0.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">Enquiries</p>
                  </div>
                  <div className="rounded-xl bg-emerald-50 p-3 text-center dark:bg-emerald-500/10">
                    <p className="text-xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400"><CountUp value={summary?.converted ?? 0} /></p>
                    <p className="mt-0.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">Converted</p>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Top sources */}
            <motion.div variants={fadeUp} initial="hidden" animate="show">
              <Card>
                <div className="mb-5 flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-500/20 to-violet-500/10 text-fuchsia-600 ring-1 ring-inset ring-fuchsia-500/10 dark:text-fuchsia-400">
                    <Sparkles size={17} />
                  </span>
                  <SectionHeader title="Top Sources" />
                </div>
                {sources && sources.length > 0 ? (
                  <HBarList
                    rows={[...sources].sort((a, b) => b.total - a.total).slice(0, 5).map((s) => ({ label: s.source.replaceAll("_", " "), value: s.total, fraction: s.total / maxSource, valueLabel: `${s.total} (${s.conversionRate}%)` }))}
                    color={VIZ.series1}
                  />
                ) : sources ? (
                  <p className="py-6 text-center text-sm text-slate-400 dark:text-slate-500">No source data yet</p>
                ) : (
                  <div className="space-y-4">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
                )}
              </Card>
            </motion.div>

            {/* Action required */}
            <motion.div variants={fadeUp} initial="hidden" animate="show">
              <ActionCard overdue={overdueReminders} today={todayReminders} />
            </motion.div>
          </div>
        </div>
      ) : (
        /* Non-stat roles: focused view */
        <div className="flex flex-col gap-5">
          <ActionCard overdue={overdueReminders} today={todayReminders} />
          <RecentLeadsCard data={recentLeads} />
        </div>
      )}
    </motion.div>
  );
}
