import { Link } from "react-router-dom";
import { motion } from "framer-motion";
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
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useSummaryReport, useYoyReport, useTrendReport, useSourcePerformanceReport } from "../hooks/useReports";
import { useLeads } from "../hooks/useLeads";
import { Card } from "../components/common/Card";
import { StatTile } from "../components/reports/StatTile";
import { TrendChart } from "../components/reports/TrendChart";
import { HBarList } from "../components/reports/HBarList";
import { VIZ } from "../components/reports/vizTheme";
import { Avatar } from "../components/common/Avatar";
import { StatusBadge } from "../components/common/StatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { fadeUp, staggerContainer, pageFade } from "@/lib/motion";

const REPORT_VISIBLE_ROLES = ["SUPER_ADMIN", "ADMIN", "BRANCH_MANAGER"];

const QUICK_ACTIONS = [
  {
    to: "/leads",
    icon: <UserPlus size={16} />,
    title: "New Lead",
    hoverClass: "hover:bg-blue-50 hover:text-blue-700 hover:ring-blue-300",
    iconHoverClass: "group-hover:text-blue-600",
    roles: undefined as string[] | undefined,
  },
  {
    to: "/social-inbox",
    icon: <Inbox size={16} />,
    title: "Social Inbox",
    hoverClass: "hover:bg-fuchsia-50 hover:text-fuchsia-700 hover:ring-fuchsia-300",
    iconHoverClass: "group-hover:text-fuchsia-600",
    roles: ["SUPER_ADMIN", "ADMIN", "BRANCH_MANAGER", "CR_TEAM"] as string[] | undefined,
  },
  {
    to: "/call-campaigns",
    icon: <PhoneCall size={16} />,
    title: "Campaigns",
    hoverClass: "hover:bg-emerald-50 hover:text-emerald-700 hover:ring-emerald-300",
    iconHoverClass: "group-hover:text-emerald-600",
    roles: ["SUPER_ADMIN", "ADMIN", "BRANCH_MANAGER", "CR_TEAM"] as string[] | undefined,
  },
  {
    to: "/reports",
    icon: <BarChart3 size={16} />,
    title: "Reports",
    hoverClass: "hover:bg-amber-50 hover:text-amber-700 hover:ring-amber-300",
    iconHoverClass: "group-hover:text-amber-600",
    roles: REPORT_VISIBLE_ROLES as string[] | undefined,
  },
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

/** Section card header with a title and an optional "view all" link. */
function SectionHeader({ title, to, cta }: { title: string; to?: string; cta?: string }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-base font-semibold tracking-tight text-slate-900 dark:text-white">{title}</h2>
      {to && cta && (
        <Link
          to={to}
          className="group flex items-center gap-1 text-sm font-medium text-blue-600 transition-colors hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          {cta}
          <ArrowUpRight
            size={14}
            className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          />
        </Link>
      )}
    </div>
  );
}

export function DashboardPage() {
  const { user } = useAuth();
  const canSeeStats = !!user && REPORT_VISIBLE_ROLES.includes(user.role);
  const { data: summary } = useSummaryReport({}, canSeeStats);
  const { data: yoy } = useYoyReport({}, canSeeStats);
  const { data: trend } = useTrendReport({ granularity: "week" }, canSeeStats);
  const { data: sources } = useSourcePerformanceReport({}, canSeeStats);
  const { data: recentLeads } = useLeads({ page: 1, pageSize: 6 });
  const visibleActions = QUICK_ACTIONS.filter((a) => !a.roles || (user && a.roles.includes(user.role)));

  const maxSource = Math.max(1, ...(sources ?? []).map((s) => s.total));
  const today = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });

  // Per-KPI mini trend series derived from the weekly trend report.
  const totalSeries = trend?.map((p) => p.total);
  const convertedSeries = trend?.map((p) => p.converted);
  const convRateSeries = trend?.map((p) => (p.total ? Math.round((p.converted / p.total) * 100) : 0));
  const lostSeries = trend?.map((p) => p.lost);

  const statsLoading = canSeeStats && !summary;

  return (
    <motion.div variants={pageFade} initial="hidden" animate="show" className="mx-auto w-full max-w-7xl flex flex-col gap-6">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 px-6 py-8 shadow-xl dark:bg-slate-950 sm:px-8 sm:py-10">
        {/* Lag-free animated gradient mesh - CSS driven */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden mix-blend-screen opacity-50">
          <div 
            className="absolute -top-[50%] -left-[10%] w-[60%] h-[200%] animate-pulse rounded-full bg-blue-600/30 blur-[100px] dark:bg-blue-600/20" 
            style={{ animationDuration: '4s' }} 
          />
          <div 
            className="absolute top-[-20%] -right-[20%] w-[60%] h-[150%] animate-pulse rounded-full bg-indigo-500/20 blur-[120px] dark:bg-indigo-500/10" 
            style={{ animationDuration: '6s', animationDelay: '2s' }} 
          />
        </div>

        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <span className="inline-flex items-center rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs sm:text-sm font-medium text-blue-300 ring-1 ring-inset ring-blue-500/20 backdrop-blur-md">
              {today}
            </span>
            <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              Welcome back{user?.name ? `, ${user.name.split(" ")[0]}` : ""}!
            </h1>
            <p className="mt-2 text-sm sm:text-base text-slate-300">
              Here is what's happening with your leads and campaigns today.
            </p>
          </div>
          
          {/* Quick Actions inside Hero */}
          <div className="flex flex-wrap items-center gap-3">
            {visibleActions.map((action) => (
              <Link key={action.to} to={action.to}>
                <motion.button
                  whileHover={{ y: -3, scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className="group relative flex cursor-pointer items-center gap-2 overflow-hidden rounded-xl bg-white/[0.08] px-4 py-2.5 text-sm font-medium text-white shadow-lg ring-1 ring-inset ring-white/[0.15] backdrop-blur-md transition-colors hover:bg-white/[0.15] hover:ring-white/30"
                >
                  <span className="text-blue-300 transition-colors group-hover:text-blue-200">
                    {action.icon}
                  </span>
                  {action.title}
                </motion.button>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* KPI row — loading skeletons */}
      {statsLoading && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-slate-200/70 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <Skeleton className="h-11 w-11 rounded-xl" />
              <Skeleton className="mt-4 h-3 w-20" />
              <Skeleton className="mt-3 h-7 w-16" />
              <Skeleton className="mt-3 h-3 w-24" />
            </div>
          ))}
        </div>
      )}

      {/* KPI row */}
      {canSeeStats && !statsLoading && (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 gap-4 lg:grid-cols-5"
        >
          {[
            <StatTile
              key="total"
              label="Total Enquiries"
              value={summary?.totalEnquiries ?? 0}
              delta={yoy?.growth.total}
              deltaLabel="vs last year"
              icon={<ClipboardList size={20} />}
              iconClassName="bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400"
              sparkline={totalSeries}
              sparkColor="#2563EB"
            />,
            <StatTile
              key="converted"
              label="Converted"
              value={summary?.converted ?? 0}
              delta={yoy?.growth.converted}
              deltaLabel="vs last year"
              icon={<KeyRound size={20} />}
              iconClassName="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400"
              sparkline={convertedSeries}
              sparkColor={VIZ.series2}
            />,
            <StatTile
              key="rate"
              label="Conversion Rate"
              value={yoy?.currentPeriod.conversionRate ?? 0}
              suffix="%"
              delta={yoy?.growth.conversionRate}
              deltaLabel="pts vs last yr"
              icon={<Percent size={20} />}
              iconClassName="bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400"
              sparkline={convRateSeries}
              sparkColor="#8b5cf6"
            />,
            <StatTile
              key="pending"
              label="Follow-up Pending"
              value={summary?.followUpPending ?? 0}
              icon={<PhoneOutgoing size={20} />}
              iconClassName="bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400"
            />,
            <StatTile
              key="lost"
              label="Lost"
              value={summary?.lost ?? 0}
              delta={yoy?.growth.lost}
              deltaLabel="vs last year"
              upIsGood={false}
              icon={<CircleX size={20} />}
              iconClassName="bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-400"
              sparkline={lostSeries}
              sparkColor={VIZ.series6}
            />,
          ].map((tile, i) => (
            <motion.div key={i} variants={fadeUp} whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
              {tile}
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Main content grid */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-6 lg:grid-cols-3"
      >
        {canSeeStats && (
          <>
            {/* Trend chart */}
            <motion.div variants={fadeUp} className="lg:col-span-2">
              <Card className="flex h-full flex-col">
                <div className="mb-6 flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400">
                    <TrendingUp size={17} />
                  </span>
                  <div className="flex-1">
                    <SectionHeader title="Enquiry Trend" to="/reports" cta="View report" />
                  </div>
                </div>
                <div className="min-h-[250px] flex-1">
                  {trend ? (
                    <TrendChart points={trend} />
                  ) : (
                    <div className="space-y-3 pt-4">
                      <Skeleton className="h-40 w-full" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>

            {/* Top sources */}
            <motion.div variants={fadeUp} className="lg:col-span-1">
              <Card className="h-full">
                <div className="mb-6">
                  <SectionHeader title="Top Lead Sources" />
                </div>
                {sources && sources.length > 0 ? (
                  <HBarList
                    rows={[...sources]
                      .sort((a, b) => b.total - a.total)
                      .slice(0, 5)
                      .map((s) => ({
                        label: s.source.replaceAll("_", " "),
                        value: s.total,
                        fraction: s.total / maxSource,
                        valueLabel: `${s.total} (${s.conversionRate}%)`,
                      }))}
                    color={VIZ.series1}
                  />
                ) : sources ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                      <BarChart3 size={22} />
                    </span>
                    <p className="mt-3 text-sm font-medium text-slate-600 dark:text-slate-300">No source data yet</p>
                    <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">Leads will appear here as they come in.</p>
                  </div>
                ) : (
                  <div className="space-y-4 pt-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-8 w-full" />
                    ))}
                  </div>
                )}
              </Card>
            </motion.div>
          </>
        )}

        {/* Recent leads */}
        <motion.div variants={fadeUp} className="lg:col-span-3">
          <Card padded={false} className="overflow-hidden">
            <div className="border-b border-slate-100 px-6 py-5 dark:border-slate-800">
              <SectionHeader title="Recent Leads" to="/leads" cta="View all" />
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {!recentLeads ? (
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
              ) : recentLeads.items.length > 0 ? (
                recentLeads.items.slice(0, 5).map((enquiry) => (
                  <Link
                    key={enquiry.id}
                    to={`/leads/${enquiry.leadId}`}
                    className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  >
                    <Avatar name={enquiry.lead.name} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-200">{enquiry.lead.name}</p>
                      <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                        {enquiry.carModel} · {enquiry.branch.name}
                      </p>
                    </div>
                    <StatusBadge status={enquiry.status} />
                    <span className="hidden w-20 shrink-0 text-right text-xs text-slate-400 dark:text-slate-500 sm:block">
                      {timeAgo(enquiry.createdAt)}
                    </span>
                  </Link>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                    <UserPlus size={22} />
                  </span>
                  <p className="mt-3 text-sm font-medium text-slate-600 dark:text-slate-300">No leads yet</p>
                  <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">New enquiries will show up here.</p>
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
