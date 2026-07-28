import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CalendarClock, AlertTriangle, CalendarDays, CalendarRange, Clock, Layers, Loader2 } from "lucide-react";
import clsx from "clsx";
import { useUpcomingFollowUps, useFollowUpCalendar } from "../hooks/useFollowUps";
import { useBranches } from "../hooks/useBranches";
import type { FollowUpFilters, FollowUpTimeframe, UpcomingFollowUp } from "../api/followUps.api";
import { fadeUp, staggerContainer } from "../lib/motion";
import { FollowUpToolbar } from "../components/followUps/FollowUpToolbar";
import { FollowUpList } from "../components/followUps/FollowUpList";
import { DateDetailModal } from "../components/followUps/DateDetailModal";
import { RepBreakdownPanel } from "../components/followUps/RepBreakdownPanel";

const PAGE_SIZE = 20;

const TIMEFRAMES: { key: FollowUpTimeframe; label: string; icon: ReactNode; tone: string; statKey: "overdue" | "today" | "thisWeek" | "later" | "total" }[] = [
  { key: "overdue", label: "Overdue", icon: <AlertTriangle size={20} />, tone: "bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400", statKey: "overdue" },
  { key: "today", label: "Due today", icon: <CalendarDays size={20} />, tone: "bg-primary-100 text-primary-600 dark:bg-primary-500/15 dark:text-primary-400", statKey: "today" },
  { key: "week", label: "This week", icon: <CalendarRange size={20} />, tone: "bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400", statKey: "thisWeek" },
  { key: "later", label: "Later", icon: <Clock size={20} />, tone: "bg-slate-100 text-slate-600 dark:bg-slate-700/40 dark:text-slate-300", statKey: "later" },
  { key: "all", label: "All", icon: <Layers size={20} />, tone: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400", statKey: "total" },
];

/** KPI tile that doubles as a timeframe filter. */
function TimeframeTile({
  icon,
  label,
  value,
  tone,
  active,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  tone: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={clsx(
        "group relative flex items-center gap-3.5 overflow-hidden rounded-2xl border p-4 text-left transition-all hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500",
        active
          ? "border-primary-400 bg-primary-50/60 ring-1 ring-primary-300 dark:border-primary-500/50 dark:bg-primary-500/10 dark:ring-primary-500/30"
          : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/50 dark:hover:border-slate-700"
      )}
    >
      <span className={clsx("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", tone)}>{icon}</span>
      <div className="min-w-0">
        <p className="text-2xl font-bold leading-none tabular-nums text-slate-900 dark:text-white">{value.toLocaleString()}</p>
        <p className="mt-1 truncate text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
      </div>
    </button>
  );
}

export function FollowUpsPage() {
  const navigate = useNavigate();
  const listRef = useRef<HTMLDivElement>(null);
  const [filters, setFilters] = useState<FollowUpFilters>({ timeframe: "all", sortBy: "dueDate", order: "asc", page: 1, pageSize: PAGE_SIZE });
  const [searchInput, setSearchInput] = useState("");

  const { data: branches } = useBranches();
  const { data, isLoading, isFetching } = useUpcomingFollowUps(filters);

  // Calendar heat view. The range is driven by the calendar's own week/month nav;
  // an optional CR selection narrows both the day counts and the detail list.
  const [calRange, setCalRange] = useState<{ start: string; end: string } | null>(null);
  const [calCrId, setCalCrId] = useState<string | undefined>(undefined);
  const onRangeChange = useCallback((start: string, end: string) => setCalRange({ start, end }), []);
  const { data: calendar } = useFollowUpCalendar(
    calRange
      ? { start: calRange.start, end: calRange.end, branchId: filters.branchId, assignedCrId: calCrId }
      : null
  );

  // Day counts shown on the calendar: total across the team, or a single CR's when one
  // is picked from the breakdown.
  const calCounts = useMemo(() => {
    if (!calendar) return {};
    if (calCrId) {
      return calendar.byCr.find((c) => c.id === calCrId)?.countsByDate ?? {};
    }
    return calendar.counts;
  }, [calendar, calCrId]);

  // Day the "who has follow-ups" popup is showing. Populated when a calendar cell is
  // clicked; the per-person rows are derived from the already-loaded calendar data.
  const [popupDate, setPopupDate] = useState<string | null>(null);
  const popupCrs = useMemo(() => {
    if (!popupDate || !calendar) return [];
    return calendar.byCr
      .map((cr) => ({ id: cr.id, name: cr.name, count: cr.countsByDate[popupDate] ?? 0 }))
      .filter((cr) => cr.count > 0)
      .sort((a, b) => b.count - a.count);
  }, [popupDate, calendar]);
  const popupTotal = popupDate ? calendar?.counts[popupDate] ?? 0 : 0;

  useEffect(() => {
    const next = searchInput || undefined;
    if (next === filters.search) return;
    const t = setTimeout(() => setFilters((f) => ({ ...f, search: next, page: 1 })), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const page = data?.page ?? 1;
  const total = data?.total ?? 0;
  const stats = data?.stats;
  const canSeeOthers = data?.canSeeOthers ?? false;
  const crossBranch = data?.crossBranch ?? false;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const patch = (p: Partial<FollowUpFilters>) => setFilters((f) => ({ ...f, ...p, page: 1 }));
  const goToPage = (p: number) => setFilters((f) => ({ ...f, page: Math.min(Math.max(1, p), totalPages) }));

  // Carries this page of the follow-up queue along as nav state, so the detail page can
  // offer "Next/Prev lead" through exactly the follow-ups the CR is working through.
  const queue = (data?.items ?? []).map((item) => ({ leadId: item.leadId, enquiryId: item.enquiryId }));
  const open = (item: UpcomingFollowUp) =>
    navigate(`/leads/${item.leadId}/enquiries/${item.enquiryId}`, {
      state: { queue, from: { path: "/follow-ups", label: "Follow-ups" } },
    });

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="flex flex-col gap-5">
      {/* ---------- HERO HEADER ---------- */}
      <motion.div variants={fadeUp} className="relative overflow-hidden rounded-3xl bg-[#0B0F19] px-6 py-8 shadow-2xl shadow-primary-900/10 ring-1 ring-slate-900/5 dark:bg-slate-950 dark:ring-white/10 sm:px-9 sm:py-9">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h1v1H0V0zm23 23h1v1h-1v-1z' fill='white'/%3E%3C/svg%3E\")", backgroundSize: "24px 24px" }}
        />
        <div className="pointer-events-none absolute -left-20 -top-20 h-[300px] w-[300px] rounded-full bg-primary-500/10 blur-[80px]" />
        <div className="relative z-10 flex items-center gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-white shadow-inner ring-1 ring-white/20 backdrop-blur-md">
            <CalendarClock size={26} />
          </span>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">Follow-ups</h1>
            <p className="mt-1.5 flex items-center gap-2 text-sm font-medium text-slate-300">
              <CalendarClock size={15} className="text-primary-400" />
              {isLoading ? (
                <span className="inline-block h-4 w-40 animate-pulse rounded bg-white/15" />
              ) : canSeeOthers ? (
                <>
                  <span className="font-bold text-white tabular-nums">{(stats?.total ?? 0).toLocaleString()}</span>
                  scheduled follow-ups across your team
                </>
              ) : (
                <>
                  <span className="font-bold text-white tabular-nums">{(stats?.total ?? 0).toLocaleString()}</span>
                  follow-ups assigned to you
                </>
              )}
            </p>
          </div>
        </div>
      </motion.div>

      {/* ---------- TIMEFRAME TILES (double as filters) ---------- */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {TIMEFRAMES.map((tf) => (
          <TimeframeTile
            key={tf.key}
            icon={tf.icon}
            tone={tf.tone}
            label={tf.label}
            value={stats?.[tf.statKey] ?? 0}
            active={filters.timeframe === tf.key && !filters.dueDate}
            onClick={() => {
              patch({ timeframe: tf.key, dueDate: undefined });
              requestAnimationFrame(() => {
                document.getElementById("follow-up-list")?.scrollIntoView({ behavior: "smooth" });
              });
            }}
          />
        ))}
      </motion.div>

      {/* ---------- CALENDAR HEAT VIEW + BY-REP PANEL ---------- */}
      <motion.div variants={fadeUp}>
        <RepBreakdownPanel
          calCounts={calCounts}
          selectedDateStr={filters.dueDate ?? popupDate ?? undefined}
          onRangeChange={onRangeChange}
          onSelectDate={(date) => setPopupDate(date)}
          canSeeOthers={canSeeOthers}
          calendar={calendar}
          calCrId={calCrId}
          onSelectCr={(crId) => {
            setCalCrId(crId);
            patch({ assignedCrId: crId === "unassigned" ? undefined : crId });
          }}
        />
      </motion.div>

      {/* ---------- TOOLBAR ---------- */}
      <motion.div variants={fadeUp}>
        <FollowUpToolbar
          searchInput={searchInput}
          onSearchInputChange={setSearchInput}
          filters={filters}
          patch={patch}
          canSeeOthers={canSeeOthers}
          crossBranch={crossBranch}
          branches={branches}
          crs={data?.crs}
        />
      </motion.div>

      {/* ---------- RESULT SUMMARY ---------- */}
      <div id="follow-up-list" ref={listRef} className="scroll-mt-4" />
      {!isLoading && data && (
        <div className="flex items-center justify-between gap-3 px-1 text-sm">
          <p className="text-slate-500 dark:text-slate-400">
            {total === 0 ? (
              "No follow-ups match"
            ) : (
              <>
                <span className="font-semibold text-slate-700 tabular-nums dark:text-slate-200">{total.toLocaleString()}</span>{" "}
                {total === 1 ? "follow-up" : "follow-ups"}
              </>
            )}
          </p>
          {isFetching && (
            <span className="flex items-center gap-1.5 text-xs font-medium text-primary-600 dark:text-primary-400">
              <Loader2 size={13} className="animate-spin" /> Updating…
            </span>
          )}
        </div>
      )}

      {/* ---------- LIST ---------- */}
      <FollowUpList
        isLoading={isLoading || !data}
        total={total}
        items={data?.items ?? []}
        isFetching={isFetching}
        canSeeOthers={canSeeOthers}
        onOpen={open}
        page={page}
        totalPages={totalPages}
        onPageChange={goToPage}
      />

      {/* ---------- DATE DETAIL POPUP ---------- */}
      <DateDetailModal
        popupDate={popupDate}
        popupTotal={popupTotal}
        popupCrs={popupCrs}
        canSeeOthers={canSeeOthers}
        onClose={() => setPopupDate(null)}
        onViewAll={() => {
          if (popupDate) patch({ dueDate: popupDate, timeframe: "all", assignedCrId: undefined });
          setCalCrId(undefined);
          setPopupDate(null);
          requestAnimationFrame(() => listRef.current?.scrollIntoView({ behavior: "smooth" }));
        }}
        onSelectCr={(crId) => {
          if (popupDate)
            patch({
              dueDate: popupDate,
              timeframe: "all",
              assignedCrId: crId === "unassigned" ? undefined : crId,
            });
          setCalCrId(crId === "unassigned" ? undefined : crId);
          setPopupDate(null);
          requestAnimationFrame(() => listRef.current?.scrollIntoView({ behavior: "smooth" }));
        }}
      />
    </motion.div>
  );
}
