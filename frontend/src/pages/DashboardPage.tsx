import { motion, useReducedMotion } from "framer-motion";
import clsx from "clsx";
import {
  ClipboardList,
  KeyRound,
  CircleX,
  PhoneOutgoing,
  UserPlus,
  BarChart3,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  useSummaryReport,
  useYoyReport,
  useTrendReport,
  useSourcePerformanceReport,
} from "../hooks/useReports";
import { useLeads, useReminders } from "../hooks/useLeads";
import { useUpcomingFollowUps } from "../hooks/useFollowUps";
import { Card } from "../components/common/Card";
import { TrendChart } from "../components/reports/TrendChart";
import { HBarList } from "../components/reports/HBarList";
import { CountUp } from "../components/common/CountUp";
import { TeamActivityCard } from "../components/dashboard/TeamActivityCard";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ACCENT,
  SURFACE,
  HAIRLINE,
  Eyebrow,
  SectionHeader,
  Delta,
  greeting,
} from "../components/dashboard/DashboardPrimitives";
import { StatCell } from "../components/dashboard/StatCell";
import { ConversionRing } from "../components/dashboard/ConversionRing";
import { PipelineRows } from "../components/dashboard/PipelineRows";

const QUICK_ACTIONS = [
  { to: "/leads", icon: <UserPlus size={15} strokeWidth={1.75} />, title: "New lead", module: undefined },
  { to: "/reports", icon: <BarChart3 size={15} strokeWidth={1.75} />, title: "Reports", module: "reports" as const },
];

/* ── Motion (respects prefers-reduced-motion) ──────────────────────────── */

function useVariants() {
  const reduce = useReducedMotion();
  const spring = { type: "spring" as const, stiffness: 320, damping: 34 };
  return {
    page: {
      hidden: { opacity: reduce ? 1 : 0 },
      show: { opacity: 1, transition: { staggerChildren: reduce ? 0 : 0.06 } },
    },
    item: {
      hidden: reduce ? { opacity: 1 } : { opacity: 0, y: 12 },
      show: { opacity: 1, y: 0, transition: spring },
    },
  };
}

/* ── Page ───────────────────────────────────────────────────────────────── */

export function DashboardPage() {
  const { user } = useAuth();
  const variants = useVariants();
  const canSeeStats = !!user && (user.role === "SUPER_ADMIN" || user.permissions.reports === "read" || user.permissions.reports === "write");

  const { data: reminders } = useReminders();
  const actionItems =
    reminders?.filter((r) => {
      if (!r.followUpDueAt) return false;
      const due = new Date(r.followUpDueAt);
      const now = new Date();
      return (due < now && due.toDateString() !== now.toDateString()) || due.toDateString() === now.toDateString();
    }) ?? [];

  const { data: summary } = useSummaryReport({}, canSeeStats);
  const { data: yoy } = useYoyReport({}, canSeeStats);
  const { data: trend } = useTrendReport({ granularity: "week" }, canSeeStats);
  const { data: sources } = useSourcePerformanceReport({}, canSeeStats);
  const { data: recentLeads } = useLeads({ page: 1, pageSize: 6 });
  const { data: upcomingFollowUps } = useUpcomingFollowUps({
    timeframe: "week",
    pageSize: 8,
    sortBy: "dueDate",
    order: "asc",
  });

  const visibleActions = QUICK_ACTIONS.filter(
    (a) =>
      !a.module ||
      (!!user && (user.role === "SUPER_ADMIN" || user.permissions[a.module] === "read" || user.permissions[a.module] === "write"))
  );
  const maxSource = Math.max(1, ...(sources ?? []).map((s) => s.total));
  const conversionRate = yoy?.currentPeriod.conversionRate ?? 0;
  const statsLoading = canSeeStats && !summary;
  const firstName = user?.name?.split(" ")[0];
  const dueNowCount = canSeeStats
    ? actionItems.length
    : (upcomingFollowUps?.stats.overdue ?? 0) + (upcomingFollowUps?.stats.today ?? 0);

  return (
    <motion.div
      variants={variants.page}
      initial="hidden"
      animate="show"
      className="mx-auto flex w-full max-w-[1360px] flex-col gap-8 pb-16"
    >
      {/* ── Header ── */}
      <motion.header
        variants={variants.item}
        className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between"
      >
        <div className="flex flex-col gap-1.5">
          <Eyebrow>
            {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
          </Eyebrow>
          <h1 className="text-[26px] font-semibold tracking-[-0.02em] text-slate-900 dark:text-white">
            {greeting()}
            {firstName ? `, ${firstName}` : ""}
          </h1>
          <p className="flex items-center gap-2 text-[13px] text-slate-500 dark:text-slate-400">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </span>
            {dueNowCount > 0
              ? `${dueNowCount} follow-up${dueNowCount === 1 ? "" : "s"} need attention today`
              : "Pipeline is up to date D-CRM"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {visibleActions.map((action, i) => (
            <Link
              key={action.to}
              to={action.to}
              className={clsx(
                "inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-[13px] font-medium transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 active:scale-[0.98]",
                i === 0
                  ? "bg-slate-900 text-white shadow-sm hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                  : "border border-slate-200/80 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-slate-300 dark:hover:bg-white/[0.06]"
              )}
            >
              <span className={i === 0 ? "opacity-80" : "text-slate-400 dark:text-slate-500"}>
                {action.icon}
              </span>
              {action.title}
            </Link>
          ))}
        </div>
      </motion.header>

      {canSeeStats ? (
        <>
          {/* ── Stat ledger: one surface, hairline-divided ── */}
          <motion.div variants={variants.item}>
            {statsLoading ? (
              <Skeleton className="h-[136px] w-full rounded-2xl" />
            ) : (
              <div
                className={clsx(
                  SURFACE,
                  "grid grid-cols-1 divide-y sm:grid-cols-2 sm:divide-y lg:grid-cols-4 lg:divide-y-0 lg:divide-x",
                  "divide-slate-200/70 dark:divide-white/[0.07] overflow-hidden"
                )}
              >
                <StatCell
                  label="Enquiries"
                  value={summary?.totalEnquiries ?? 0}
                  delta={yoy?.growth.total}
                  icon={<ClipboardList strokeWidth={1.75} />}
                  series={trend?.map((p) => p.total)}
                />
                <StatCell
                  label="Converted"
                  value={summary?.converted ?? 0}
                  delta={yoy?.growth.converted}
                  icon={<KeyRound strokeWidth={1.75} />}
                  series={trend?.map((p) => p.converted)}
                />
                <StatCell
                  label="Awaiting follow-up"
                  value={summary?.followUpPending ?? 0}
                  icon={<PhoneOutgoing strokeWidth={1.75} />}
                />
                <StatCell
                  label="Lost"
                  value={summary?.lost ?? 0}
                  delta={yoy?.growth.lost}
                  upIsGood={false}
                  icon={<CircleX strokeWidth={1.75} />}
                  series={trend?.map((p) => p.lost)}
                />
              </div>
            )}
          </motion.div>

          {/* ── Bento: canvas + rail ── */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="flex flex-col gap-6 lg:col-span-8">
              {/* Trend */}
              <motion.div variants={variants.item}>
                <Card className={clsx(SURFACE, "p-6")}>
                  <SectionHeader title="Weekly performance" to="/reports" cta="Full report" />
                  <div className="mt-5 min-h-[280px] w-full">
                    {trend ? <TrendChart points={trend} /> : <Skeleton className="h-[280px] w-full rounded-xl" />}
                  </div>
                </Card>
              </motion.div>

              {/* Pipeline */}
              <motion.div variants={variants.item}>
                <Card padded={false} className={clsx(SURFACE, "overflow-hidden")}>
                  <div className={clsx("border-b px-5 py-4", HAIRLINE)}>
                    <SectionHeader title="Live pipeline" to="/leads" cta="All leads" />
                  </div>
                  <div className="divide-y divide-slate-100 dark:divide-white/[0.05]">
                    <PipelineRows data={recentLeads} />
                  </div>
                </Card>
              </motion.div>
            </div>

            {/* Rail */}
            <div className="flex flex-col gap-6 lg:col-span-4">
              <motion.div variants={variants.item}>
                <TeamActivityCard className={SURFACE} />
              </motion.div>

              <motion.div variants={variants.item}>
                <Card className={clsx(SURFACE, "p-6")}>
                  <div className="flex items-center justify-between">
                    <h3 className="text-[13px] font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                      Win rate
                    </h3>
                    <Delta delta={yoy?.growth.conversionRate} />
                  </div>

                  <div className="mt-6">
                    {summary ? (
                      <ConversionRing rate={conversionRate} />
                    ) : (
                      <div className="flex h-44 items-center justify-center">
                        <Skeleton className="h-40 w-40 rounded-full" />
                      </div>
                    )}
                  </div>

                  <div className={clsx("mt-6 grid grid-cols-2 divide-x border-t pt-4", HAIRLINE, "divide-slate-200/70 dark:divide-white/[0.07]")}>
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">Enquiries</span>
                      <span className="text-lg font-semibold tabular-nums tracking-tight text-slate-900 dark:text-white">
                        <CountUp value={summary?.totalEnquiries ?? 0} />
                      </span>
                    </div>
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">Won</span>
                      <span className="text-lg font-semibold tabular-nums tracking-tight" style={{ color: ACCENT }}>
                        <CountUp value={summary?.converted ?? 0} />
                      </span>
                    </div>
                  </div>
                </Card>
              </motion.div>

              <motion.div variants={variants.item}>
                <Card className={clsx(SURFACE, "p-6")}>
                  <SectionHeader title="Where leads come from" />
                  <div className="mt-4">
                    {sources && sources.length > 0 ? (
                      <HBarList
                        rows={[...sources]
                          .sort((a, b) => b.total - a.total)
                          .slice(0, 5)
                          .map((s) => ({
                            label: s.source.replaceAll("_", " "),
                            value: s.total,
                            fraction: s.total / maxSource,
                            valueLabel: `${s.total}`,
                          }))}
                        color={ACCENT}
                      />
                    ) : sources ? (
                      <p className="py-6 text-center text-[13px] text-slate-400 dark:text-slate-500">
                        Channel data appears once leads have a source.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Skeleton key={i} className="h-7 w-full rounded-md" />
                        ))}
                      </div>
                    )}
                  </div>
                </Card>
              </motion.div>
            </div>
          </div>
        </>
      ) : (
        /* ── Focused view for CR / consultant roles ── */
        <motion.div variants={variants.item}>
          <Card padded={false} className={clsx(SURFACE, "overflow-hidden")}>
            <div className={clsx("border-b px-5 py-4", HAIRLINE)}>
              <SectionHeader title="Your recent leads" to="/leads" cta="All leads" />
            </div>
            <div className="divide-y divide-slate-100 dark:divide-white/[0.05]">
              <PipelineRows data={recentLeads} />
            </div>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}
