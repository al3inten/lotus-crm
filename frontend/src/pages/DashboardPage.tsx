import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
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
  ArrowDownRight,
  ChevronRight,
  AlarmClock,
  CalendarClock,
  CalendarDays,
  Phone,
  MessageCircle,
} from "lucide-react";
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
import { Avatar } from "../components/common/Avatar";
import { StatusBadge } from "../components/common/StatusBadge";
import { CountUp } from "../components/common/CountUp";
import { Sparkline } from "../components/common/Sparkline";
import { TeamActivityCard } from "../components/dashboard/TeamActivityCard";
import { Skeleton } from "@/components/ui/skeleton";

/* ────────────────────────────────────────────────────────────────────────────
   Design system — "Quiet Precision"
   One surface color, hairline borders, a single indigo accent reserved for
   data. Numbers are the hero: tabular, tight-tracked, oversized. Everything
   else recedes. Motion is one orchestrated entrance, then near-silence.
──────────────────────────────────────────────────────────────────────────── */

const ACCENT = "#5B5BD6"; // restrained indigo — used only where data lives

const SURFACE =
  "rounded-2xl border border-slate-200/70 bg-white dark:border-white/[0.07] dark:bg-[#0E1015]";

const HAIRLINE = "border-slate-200/70 dark:border-white/[0.07]";

const REPORT_VISIBLE_ROLES = ["SUPER_ADMIN", "ADMIN", "BRANCH_MANAGER"];

const QUICK_ACTIONS = [
  { to: "/leads", icon: <UserPlus size={15} strokeWidth={1.75} />, title: "New lead", roles: undefined },
  { to: "/social-inbox", icon: <Inbox size={15} strokeWidth={1.75} />, title: "Inbox", roles: ["SUPER_ADMIN", "ADMIN", "BRANCH_MANAGER", "CR_TEAM"] },
  { to: "/call-campaigns", icon: <PhoneCall size={15} strokeWidth={1.75} />, title: "Campaigns", roles: ["SUPER_ADMIN", "ADMIN", "BRANCH_MANAGER", "CR_TEAM"] },
  { to: "/reports", icon: <BarChart3 size={15} strokeWidth={1.75} />, title: "Reports", roles: REPORT_VISIBLE_ROLES },
];

/* ── Utilities ─────────────────────────────────────────────────────────── */

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

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

/* ── Micro-components ──────────────────────────────────────────────────── */

function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
      {children}
    </span>
  );
}

function SectionHeader({ title, to, cta }: { title: string; to?: string; cta?: string }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-[13px] font-semibold tracking-tight text-slate-900 dark:text-slate-100">
        {title}
      </h2>
      {to && cta && (
        <Link
          to={to}
          className="group inline-flex items-center gap-0.5 rounded-md text-[12px] font-medium text-slate-500 transition-colors hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 dark:text-slate-400 dark:hover:text-slate-100"
        >
          {cta}
          <ChevronRight
            size={13}
            className="translate-x-0 opacity-60 transition-transform duration-200 group-hover:translate-x-0.5"
          />
        </Link>
      )}
    </div>
  );
}

/* Stripe-style delta: no chip, no border — a small signed figure. */
function Delta({ delta, upIsGood = true }: { delta?: number | null; upIsGood?: boolean }) {
  if (delta == null || Number.isNaN(delta)) return null;
  const positive = delta >= 0;
  const good = upIsGood ? positive : !positive;
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-0.5 text-[12px] font-medium tabular-nums",
        good ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
      )}
    >
      {positive ? <ArrowUpRight size={12} strokeWidth={2.25} /> : <ArrowDownRight size={12} strokeWidth={2.25} />}
      {Math.abs(delta)}%
    </span>
  );
}

/* ── Signature element: one continuous stat ledger ──────────────────────
   Instead of four floating cards, a single surface divided by hairlines —
   the way Stripe and Vercel present headline metrics. Sparklines sit as
   quiet baselines under each number.                                       */

function StatCell({
  label, value, suffix, icon, series, delta, upIsGood = true,
}: {
  label: string;
  value: number;
  suffix?: string;
  icon: ReactNode;
  series?: number[];
  delta?: number | null;
  upIsGood?: boolean;
}) {
  return (
    <div className="group relative flex flex-col gap-4 p-5 lg:p-6 transition-colors hover:bg-slate-50/60 dark:hover:bg-white/[0.02]">
      <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500">
        <span className="[&>svg]:h-[15px] [&>svg]:w-[15px]">{icon}</span>
        <span className="text-[12px] font-medium text-slate-500 dark:text-slate-400">{label}</span>
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[28px] font-semibold leading-none tracking-[-0.02em] text-slate-900 tabular-nums dark:text-white">
          <CountUp value={value} />
          {suffix}
        </span>
        <Delta delta={delta} upIsGood={upIsGood} />
      </div>

      {series && series.length > 1 ? (
        <div className="h-6 opacity-40 transition-opacity duration-300 group-hover:opacity-90">
          <Sparkline data={series} color={ACCENT} width={140} height={24} className="w-full" />
        </div>
      ) : (
        <div className="h-6" />
      )}
    </div>
  );
}

/* ── Win-rate ring — thin stroke, tick marks, one accent ────────────────── */

function ConversionRing({ rate }: { rate: number }) {
  const r = 56;
  const c = 2 * Math.PI * r;
  const clamped = Math.min(100, Math.max(0, rate));
  const off = c * (1 - clamped / 100);
  return (
    <div className="relative mx-auto flex h-44 w-44 items-center justify-center">
      <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90">
        {/* tick marks every 10% */}
        {Array.from({ length: 10 }).map((_, i) => {
          const a = (i / 10) * 2 * Math.PI;
          const x1 = 70 + Math.cos(a) * 64;
          const y1 = 70 + Math.sin(a) * 64;
          const x2 = 70 + Math.cos(a) * 67;
          const y2 = 70 + Math.sin(a) * 67;
          return (
            <line
              key={i}
              x1={x1} y1={y1} x2={x2} y2={y2}
              className="stroke-slate-200 dark:stroke-white/10"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          );
        })}
        <circle cx="70" cy="70" r={r} fill="none" strokeWidth="5" className="stroke-slate-100 dark:stroke-white/[0.06]" />
        <circle
          cx="70" cy="70" r={r}
          fill="none"
          strokeWidth="5"
          stroke={ACCENT}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={off}
          style={{ transition: "stroke-dashoffset 1.4s cubic-bezier(0.16, 1, 0.3, 1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[34px] font-semibold leading-none tracking-[-0.02em] tabular-nums text-slate-900 dark:text-white">
          <CountUp value={rate} />
          <span className="text-[18px] text-slate-400 dark:text-slate-500">%</span>
        </span>
        <span className="mt-1.5 text-[11px] font-medium tracking-wide text-slate-400 dark:text-slate-500">
          of enquiries won
        </span>
      </div>
    </div>
  );
}

/* ── Follow-ups due — neutral surface, urgency lives in the badge only ─── */

function ActionRequiredList({ data }: { data: ReturnType<typeof useReminders>["data"] }) {
  if (!data || data.length === 0) return null;

  return (
    <Card padded={false} className={clsx(SURFACE, "overflow-hidden")}>
      <div className={clsx("flex items-center justify-between border-b px-5 py-4", HAIRLINE)}>
        <div className="flex items-center gap-2">
          <PhoneOutgoing size={14} strokeWidth={1.75} className="text-slate-400 dark:text-slate-500" />
          <h2 className="text-[13px] font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Follow-ups due
          </h2>
        </div>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-slate-600 dark:bg-white/[0.06] dark:text-slate-300">
          {data.length}
        </span>
      </div>
      <div className={clsx("divide-y", "divide-slate-100 dark:divide-white/[0.05]")}>
        {data.slice(0, 5).map((enquiry) => {
          const due = new Date(enquiry.followUpDueAt!);
          const isOverdue = due < new Date() && due.toDateString() !== new Date().toDateString();
          return (
            <Link
              key={enquiry.id}
              to={`/leads/${enquiry.leadId}`}
              className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-slate-50/60 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-indigo-500 dark:hover:bg-white/[0.02]"
            >
              <Avatar name={enquiry.lead.name} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-slate-900 dark:text-slate-200">
                  {enquiry.lead.name}
                </p>
                <p className="truncate text-[12px] text-slate-500 dark:text-slate-400">{enquiry.carModel}</p>
              </div>
              <span
                className={clsx(
                  "shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                  isOverdue
                    ? "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400"
                    : "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
                )}
              >
                {isOverdue ? "Overdue" : "Today"}
              </span>
            </Link>
          );
        })}
      </div>
    </Card>
  );
}

/* ── CR reminder ledger — overdue / today / this week, sourced server-side
   from the follow-ups module so it's scoped to the logged-in CR automatically ── */

function ReminderStrip({ stats }: { stats: { overdue: number; today: number; thisWeek: number } | undefined }) {
  return (
    <div
      className={clsx(
        SURFACE,
        "grid grid-cols-3 divide-x divide-slate-200/70 overflow-hidden dark:divide-white/[0.07]"
      )}
    >
      <StatCell label="Overdue" value={stats?.overdue ?? 0} icon={<AlarmClock strokeWidth={1.75} />} upIsGood={false} />
      <StatCell label="Due today" value={stats?.today ?? 0} icon={<CalendarClock strokeWidth={1.75} />} />
      <StatCell label="Due this week" value={stats?.thisWeek ?? 0} icon={<CalendarDays strokeWidth={1.75} />} />
    </div>
  );
}

/* Richer follow-up reminder list — includes a due-bucket badge, the last
   remark left on the enquiry, and one-tap Call / WhatsApp so a CR can act
   without leaving the dashboard. */
function UpcomingFollowUpsCard({ data, isLoading }: { data: ReturnType<typeof useUpcomingFollowUps>["data"]; isLoading: boolean }) {
  const items = data?.items ?? [];

  return (
    <Card padded={false} className={clsx(SURFACE, "overflow-hidden")}>
      <div className={clsx("flex items-center justify-between border-b px-5 py-4", HAIRLINE)}>
        <div className="flex items-center gap-2">
          <PhoneOutgoing size={14} strokeWidth={1.75} className="text-slate-400 dark:text-slate-500" />
          <h2 className="text-[13px] font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Upcoming follow-ups
          </h2>
        </div>
        <Link
          to="/follow-ups"
          className="group inline-flex items-center gap-0.5 rounded-md text-[12px] font-medium text-slate-500 transition-colors hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 dark:text-slate-400 dark:hover:text-slate-100"
        >
          All follow-ups
          <ChevronRight size={13} className="opacity-60 transition-transform duration-200 group-hover:translate-x-0.5" />
        </Link>
      </div>

      {isLoading ? (
        <div className="divide-y divide-slate-100 dark:divide-white/[0.05]">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-3.5">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-1/3" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="px-5 py-12 text-center">
          <p className="text-[13px] font-medium text-slate-900 dark:text-slate-200">You're all caught up</p>
          <p className="mt-1 text-[12px] text-slate-500 dark:text-slate-400">No follow-ups due this week.</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-white/[0.05]">
          {items.slice(0, 6).map((item) => {
            const due = new Date(item.followUpDueAt);
            const now = new Date();
            const sameDay = due.toDateString() === now.toDateString();
            const isOverdue = due < now && !sameDay;
            const phoneDigits = item.phoneRaw?.replace(/\D/g, "") ?? "";
            return (
              <div
                key={item.enquiryId}
                className="group flex items-center gap-3 px-5 py-3 transition-colors hover:bg-slate-50/60 dark:hover:bg-white/[0.02]"
              >
                <Link to={`/leads/${item.leadId}`} className="flex min-w-0 flex-1 items-center gap-3">
                  <Avatar name={item.leadName} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-slate-900 dark:text-slate-200">
                      {item.leadName}
                    </p>
                    <p className="truncate text-[12px] text-slate-500 dark:text-slate-400">
                      {item.carModel}
                      {item.lastFollowUp?.remark ? ` · ${item.lastFollowUp.remark}` : ""}
                    </p>
                  </div>
                  <span
                    className={clsx(
                      "shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                      isOverdue
                        ? "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400"
                        : sameDay
                          ? "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
                          : "bg-slate-100 text-slate-600 dark:bg-white/[0.06] dark:text-slate-300"
                    )}
                  >
                    {isOverdue ? "Overdue" : sameDay ? "Today" : due.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  </span>
                </Link>
                <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                  <a
                    href={`tel:${item.phoneRaw}`}
                    aria-label={`Call ${item.leadName}`}
                    onClick={(e) => e.stopPropagation()}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-emerald-50 hover:text-emerald-600 dark:text-slate-500 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-400"
                  >
                    <Phone size={14} />
                  </a>
                  <a
                    href={phoneDigits ? `https://wa.me/${phoneDigits}` : undefined}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`WhatsApp ${item.leadName}`}
                    onClick={(e) => e.stopPropagation()}
                    className={clsx(
                      "flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-emerald-50 hover:text-emerald-600 dark:text-slate-500 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-400",
                      !phoneDigits && "pointer-events-none opacity-30"
                    )}
                  >
                    <MessageCircle size={14} />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

/* ── Pipeline rows (shared between both role views) ─────────────────────── */

function PipelineRows({ data }: { data: ReturnType<typeof useLeads>["data"] }) {
  if (!data) {
    return (
      <>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-5 py-3.5">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-1/3" />
              <Skeleton className="h-3 w-1/4" />
            </div>
          </div>
        ))}
      </>
    );
  }
  if (data.items.length === 0) {
    return (
      <div className="px-5 py-12 text-center">
        <p className="text-[13px] font-medium text-slate-900 dark:text-slate-200">No leads yet</p>
        <p className="mt-1 text-[12px] text-slate-500 dark:text-slate-400">
          Add your first lead to start tracking the pipeline.
        </p>
        <Link
          to="/leads"
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-[12px] font-medium text-white transition-colors hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
        >
          <UserPlus size={13} /> New lead
        </Link>
      </div>
    );
  }
  return (
    <>
      {data.items.slice(0, 5).map((enquiry) => (
        <Link
          key={enquiry.id}
          to={`/leads/${enquiry.leadId}`}
          className="group grid grid-cols-[auto_1fr_auto_auto] items-center gap-3 px-5 py-3.5 transition-colors hover:bg-slate-50/60 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-indigo-500 dark:hover:bg-white/[0.02]"
        >
          <Avatar name={enquiry.lead.name} size="sm" />
          <div className="min-w-0">
            <p className="truncate text-[13px] font-medium text-slate-900 dark:text-slate-200">
              {enquiry.lead.name}
            </p>
            <p className="truncate text-[12px] text-slate-500 dark:text-slate-400">
              {enquiry.carModel} · {enquiry.branch.name}
            </p>
          </div>
          <StatusBadge status={enquiry.status} />
          <span className="hidden w-12 text-right text-[12px] tabular-nums text-slate-400 dark:text-slate-500 sm:block">
            {timeAgo(enquiry.createdAt)}
          </span>
        </Link>
      ))}
    </>
  );
}

/* ── Page ───────────────────────────────────────────────────────────────── */

export function DashboardPage() {
  const { user } = useAuth();
  const variants = useVariants();
  const canSeeStats = user?.role && REPORT_VISIBLE_ROLES.includes(user.role);

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
  const { data: upcomingFollowUps, isLoading: followUpsLoading } = useUpcomingFollowUps({
    timeframe: "week",
    pageSize: 8,
    sortBy: "dueDate",
    order: "asc",
  });

  const visibleActions = QUICK_ACTIONS.filter((a) => !a.roles || (user && a.roles.includes(user.role)));
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
                "inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-[13px] font-medium transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 active:scale-[0.98]",
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

              <motion.div variants={variants.item}>
                <ActionRequiredList data={actionItems} />
              </motion.div>
            </div>
          </div>
        </>
      ) : (
        /* ── Focused view for CR / consultant roles ── */
        <>
          <motion.div variants={variants.item}>
            <ReminderStrip stats={upcomingFollowUps?.stats} />
          </motion.div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[60fr_40fr] lg:items-start">
            <motion.div variants={variants.item}>
              <UpcomingFollowUpsCard data={upcomingFollowUps} isLoading={followUpsLoading} />
            </motion.div>
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
          </div>
        </>
      )}
    </motion.div>
  );
}