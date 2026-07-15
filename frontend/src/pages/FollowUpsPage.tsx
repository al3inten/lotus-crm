import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import clsx from "clsx";
import {
  CalendarClock,
  Search,
  Loader2,
  AlertTriangle,
  CalendarDays,
  CalendarRange,
  Clock,
  Layers,
  ChevronLeft,
  ChevronRight,
  Phone,
  MessageCircle,
  MapPin,
  Mail,
  User as UserIcon,
  Car,
} from "lucide-react";
import { useUpcomingFollowUps, useFollowUpCalendar } from "../hooks/useFollowUps";
import { useBranches } from "../hooks/useBranches";
import type { FollowUpFilters, FollowUpTimeframe, FollowUpSortBy, UpcomingFollowUp } from "../api/followUps.api";
import { FollowUpCalendar } from "../components/followUps/FollowUpCalendar";
import { ENQUIRY_STATUSES, ENQUIRY_CATEGORIES } from "../types";
import type { FollowUpType } from "../types";
import { Card } from "../components/common/Card";
import { Modal } from "../components/common/Modal";
import { Avatar } from "../components/common/Avatar";
import { Select } from "../components/common/Input";
import { StatusBadge } from "../components/common/StatusBadge";
import { fadeUp, staggerContainer } from "../lib/motion";

const PAGE_SIZE = 20;

const FOLLOW_UP_TYPE_ICON: Record<FollowUpType, ReactNode> = {
  CALL: <Phone size={12} />,
  WHATSAPP: <MessageCircle size={12} />,
  VISIT: <MapPin size={12} />,
  EMAIL: <Mail size={12} />,
};

const CATEGORY_STYLES: Record<string, string> = {
  HOT: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300",
  WARM: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  COLD: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
};

const TIMEFRAMES: { key: FollowUpTimeframe; label: string; icon: ReactNode; tone: string; statKey: "overdue" | "today" | "thisWeek" | "later" | "total" }[] = [
  { key: "overdue", label: "Overdue", icon: <AlertTriangle size={20} />, tone: "bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400", statKey: "overdue" },
  { key: "today", label: "Due today", icon: <CalendarDays size={20} />, tone: "bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400", statKey: "today" },
  { key: "week", label: "This week", icon: <CalendarRange size={20} />, tone: "bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400", statKey: "thisWeek" },
  { key: "later", label: "Later", icon: <Clock size={20} />, tone: "bg-slate-100 text-slate-600 dark:bg-slate-700/40 dark:text-slate-300", statKey: "later" },
  { key: "all", label: "All", icon: <Layers size={20} />, tone: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400", statKey: "total" },
];

const SORT_OPTIONS: { value: FollowUpSortBy; label: string }[] = [
  { value: "dueDate", label: "Follow-up date" },
  { value: "createdAt", label: "Recently added" },
  { value: "cr", label: "Customer Rep" },
  { value: "status", label: "Status" },
];

function getPageNumbers(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const out: (number | "ellipsis")[] = [1];
  const left = Math.max(2, current - 1);
  const right = Math.min(total - 1, current + 1);
  if (left > 2) out.push("ellipsis");
  for (let i = left; i <= right; i++) out.push(i);
  if (right < total - 1) out.push("ellipsis");
  out.push(total);
  return out;
}

/** Human-readable due date with an overdue/soon accent. */
function dueMeta(iso: string): { label: string; className: string } {
  const due = new Date(iso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDay = new Date(due);
  dueDay.setHours(0, 0, 0, 0);
  const days = Math.round((dueDay.getTime() - today.getTime()) / 86_400_000);
  const dateStr = due.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

  if (days < 0) {
    const n = Math.abs(days);
    return { label: `${dateStr} · ${n} day${n === 1 ? "" : "s"} overdue`, className: "text-red-600 dark:text-red-400" };
  }
  if (days === 0) return { label: `${dateStr} · today`, className: "text-blue-600 dark:text-blue-400 font-semibold" };
  if (days === 1) return { label: `${dateStr} · tomorrow`, className: "text-violet-600 dark:text-violet-400" };
  return { label: dateStr, className: "text-slate-500 dark:text-slate-400" };
}

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
        "group relative flex items-center gap-3.5 overflow-hidden rounded-2xl border p-4 text-left transition-all hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
        active
          ? "border-blue-400 bg-blue-50/60 ring-1 ring-blue-300 dark:border-blue-500/50 dark:bg-blue-500/10 dark:ring-blue-500/30"
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
  const open = (item: UpcomingFollowUp) => navigate(`/leads/${item.leadId}/enquiries/${item.enquiryId}`, { state: { queue } });
  const onKey = (e: React.KeyboardEvent, item: UpcomingFollowUp) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      open(item);
    }
  };

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="flex flex-col gap-5">
      {/* ---------- HERO HEADER ---------- */}
      <motion.div variants={fadeUp} className="relative overflow-hidden rounded-3xl bg-slate-900 px-6 py-8 shadow-xl dark:bg-slate-950 sm:px-9">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-[10%] -top-[60%] h-[220%] w-[45%] rounded-full bg-blue-600/25 blur-[110px] dark:bg-blue-600/12" />
          <div className="absolute -right-[15%] top-[-30%] h-[170%] w-[55%] rounded-full bg-indigo-500/20 blur-[120px] dark:bg-indigo-500/10" />
        </div>
        <div className="relative z-10 flex items-center gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-white shadow-inner ring-1 ring-white/20 backdrop-blur-md">
            <CalendarClock size={26} />
          </span>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">Follow-ups</h1>
            <p className="mt-1.5 flex items-center gap-2 text-sm font-medium text-slate-300">
              <CalendarClock size={15} className="text-blue-400" />
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
            onClick={() => patch({ timeframe: tf.key, dueDate: undefined })}
          />
        ))}
      </motion.div>

      {/* ---------- CALENDAR HEAT VIEW ---------- */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-3">
        <div className={clsx(canSeeOthers ? "lg:col-span-2" : "lg:col-span-3")}>
          <FollowUpCalendar
            currentDate={new Date()}
            counts={calCounts}
            selectedDateStr={filters.dueDate ?? popupDate ?? undefined}
            onRangeChange={onRangeChange}
            onSelectDate={(date) => setPopupDate(date)}
          />
        </div>

        {/* Per-CR breakdown — admins & managers. Click a rep to focus the calendar + list. */}
        {canSeeOthers && (
          <Card className="flex h-full flex-col">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                <UserIcon size={15} className="text-blue-500" /> By rep
              </h2>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold tabular-nums text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {(calendar?.total ?? 0).toLocaleString()}
              </span>
            </div>
            <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">
              Follow-ups in the shown range
            </p>
            <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto pr-1">
              {!calendar || calendar.byCr.length === 0 ? (
                <p className="py-6 text-center text-xs italic text-slate-400 dark:text-slate-500">
                  No follow-ups in this range.
                </p>
              ) : (
                calendar.byCr.map((cr) => {
                  const active = calCrId === cr.id;
                  return (
                    <button
                      key={cr.id}
                      type="button"
                      onClick={() => {
                        const nextCr = active ? undefined : cr.id;
                        setCalCrId(nextCr);
                        patch({ assignedCrId: nextCr === "unassigned" ? undefined : nextCr });
                      }}
                      className={clsx(
                        "flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left transition-colors",
                        active
                          ? "border-blue-400 bg-blue-50 dark:border-blue-500/50 dark:bg-blue-500/10"
                          : "border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/60"
                      )}
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <Avatar name={cr.name} size="sm" />
                        <span className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">{cr.name}</span>
                      </span>
                      <span
                        className={clsx(
                          "shrink-0 rounded-full px-2 py-0.5 text-xs font-bold tabular-nums",
                          active
                            ? "bg-blue-600 text-white"
                            : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                        )}
                      >
                        {cr.count.toLocaleString()}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </Card>
        )}
      </motion.div>

      {/* ---------- TOOLBAR ---------- */}
      <motion.div variants={fadeUp}>
        <Card>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {/* Search — everyone */}
            <div className="sm:col-span-2 lg:col-span-2">
              <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Search</label>
              <div className="relative">
                <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search by customer name or phone"
                  className="block w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 transition-colors placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/15 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500"
                />
              </div>
            </div>

            {/* Select date — everyone. Narrows to a single day; overrides the timeframe tiles. */}
            <div className="sm:col-span-2 lg:col-span-2">
              <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Select date</label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <CalendarClock size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="date"
                    value={filters.dueDate ?? ""}
                    onChange={(e) => patch({ dueDate: e.target.value || undefined, timeframe: "all" })}
                    className="block w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 transition-colors focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/15 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:[color-scheme:dark]"
                  />
                </div>
                {filters.dueDate && (
                  <button
                    type="button"
                    onClick={() => patch({ dueDate: undefined })}
                    className="shrink-0 rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Sort — admins & managers only (categorise/sort options) */}
            {canSeeOthers && (
              <>
                <Select
                  label="Sort by"
                  value={filters.sortBy ?? "dueDate"}
                  onChange={(e) => patch({ sortBy: e.target.value as FollowUpSortBy })}
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </Select>
                <Select
                  label="Order"
                  value={filters.order ?? "asc"}
                  onChange={(e) => patch({ order: e.target.value as "asc" | "desc" })}
                >
                  <option value="asc">Ascending</option>
                  <option value="desc">Descending</option>
                </Select>
              </>
            )}
          </div>

          {/* Categorise filters — admins & managers only */}
          {canSeeOthers && (
            <div className="mt-3 grid grid-cols-1 gap-3 border-t border-slate-100 pt-3 dark:border-slate-800 sm:grid-cols-2 lg:grid-cols-4">
              <Select
                label="Customer Rep"
                value={filters.assignedCrId ?? ""}
                onChange={(e) => patch({ assignedCrId: e.target.value || undefined })}
              >
                <option value="">All reps</option>
                {data?.crs.map((cr) => (
                  <option key={cr.id} value={cr.id}>
                    {cr.name} ({cr.count})
                  </option>
                ))}
              </Select>
              <Select
                label="Status"
                value={filters.status ?? ""}
                onChange={(e) => patch({ status: (e.target.value || undefined) as FollowUpFilters["status"] })}
              >
                <option value="">All statuses</option>
                {ENQUIRY_STATUSES.filter((s) => s !== "RETAIL_DONE" && s !== "CLOSED").map((s) => (
                  <option key={s} value={s}>
                    {s.replaceAll("_", " ")}
                  </option>
                ))}
              </Select>
              <Select
                label="Category"
                value={filters.enquiryCategory ?? ""}
                onChange={(e) => patch({ enquiryCategory: (e.target.value || undefined) as FollowUpFilters["enquiryCategory"] })}
              >
                <option value="">All categories</option>
                {ENQUIRY_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
              {crossBranch && (
                <Select
                  label="Branch"
                  value={filters.branchId ?? ""}
                  onChange={(e) => patch({ branchId: e.target.value || undefined })}
                >
                  <option value="">All branches</option>
                  {branches?.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </Select>
              )}
            </div>
          )}
        </Card>
      </motion.div>

      {/* ---------- RESULT SUMMARY ---------- */}
      <div ref={listRef} className="scroll-mt-4" />
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
            <span className="flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400">
              <Loader2 size={13} className="animate-spin" /> Updating…
            </span>
          )}
        </div>
      )}

      {/* ---------- LIST ---------- */}
      {isLoading || !data ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" style={{ animationDelay: `${i * 60}ms` }} />
          ))}
        </div>
      ) : total === 0 ? (
        <Card className="flex flex-col items-center gap-2 py-16 text-center text-slate-400 dark:text-slate-500">
          <CalendarClock size={30} />
          <p className="text-sm">No follow-ups here. Try a different timeframe or filter.</p>
        </Card>
      ) : (
        <div className={clsx("transition-opacity duration-200", isFetching && "pointer-events-none opacity-60")}>
          <div className="flex flex-col gap-3">
            {data.items.map((item) => {
              const due = dueMeta(item.followUpDueAt);
              return (
                <div
                  key={item.enquiryId}
                  role="button"
                  tabIndex={0}
                  aria-label={`Open follow-up for ${item.leadName}`}
                  onClick={() => open(item)}
                  onKeyDown={(e) => onKey(e, item)}
                  className="group flex cursor-pointer flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-[0_12px_30px_rgb(0,0,0,0.07)] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-blue-500/40 sm:flex-row sm:items-center"
                >
                  {/* Identity */}
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <Avatar name={item.leadName} size="md" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-semibold text-slate-900 dark:text-white">{item.leadName}</p>
                        {item.enquiryCategory && (
                          <span className={clsx("rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide", CATEGORY_STYLES[item.enquiryCategory])}>
                            {item.enquiryCategory}
                          </span>
                        )}
                      </div>
                      <p className="truncate text-xs text-slate-500 dark:text-slate-400">{item.phoneRaw}</p>
                      <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-slate-400 dark:text-slate-500">
                        <Car size={11} /> {item.carModel}
                      </p>
                    </div>
                  </div>

                  {/* Last follow-up remark */}
                  <div className="min-w-0 flex-1">
                    {item.lastFollowUp ? (
                      <div className="flex items-start gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                        <span className="mt-0.5 inline-flex items-center gap-1 rounded-md bg-slate-100 px-1.5 py-0.5 font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                          {FOLLOW_UP_TYPE_ICON[item.lastFollowUp.type]} {item.lastFollowUp.type}
                        </span>
                        <span className="line-clamp-2">{item.lastFollowUp.remark}</span>
                      </div>
                    ) : (
                      <span className="text-xs italic text-slate-400 dark:text-slate-500">No follow-up logged yet</span>
                    )}
                  </div>

                  {/* Meta: status, CR, due */}
                  <div className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-1.5 sm:flex-col sm:items-end sm:gap-1.5">
                    <StatusBadge status={item.status} />
                    {canSeeOthers && item.assignedCr && (
                      <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                        <UserIcon size={11} /> {item.assignedCr.name}
                      </span>
                    )}
                    <span className={clsx("flex items-center gap-1 text-xs tabular-nums", due.className)}>
                      <CalendarClock size={12} /> {due.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-5 flex flex-col items-center justify-between gap-3 sm:flex-row">
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Page {page} of {totalPages}
              </span>
              <nav aria-label="Pagination" className="flex items-center gap-1">
                <button
                  type="button"
                  aria-label="Previous page"
                  disabled={page <= 1}
                  onClick={() => goToPage(page - 1)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:pointer-events-none disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                >
                  <ChevronLeft size={16} />
                </button>
                {getPageNumbers(page, totalPages).map((p, i) =>
                  p === "ellipsis" ? (
                    <span key={`e${i}`} className="px-1.5 text-slate-400 dark:text-slate-600">…</span>
                  ) : (
                    <button
                      key={p}
                      type="button"
                      aria-label={`Page ${p}`}
                      aria-current={p === page}
                      onClick={() => goToPage(p)}
                      className={clsx(
                        "flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-sm font-semibold tabular-nums transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50",
                        p === page
                          ? "bg-blue-600 text-white shadow-sm shadow-blue-600/25"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                      )}
                    >
                      {p}
                    </button>
                  )
                )}
                <button
                  type="button"
                  aria-label="Next page"
                  disabled={page >= totalPages}
                  onClick={() => goToPage(page + 1)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:pointer-events-none disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                >
                  <ChevronRight size={16} />
                </button>
              </nav>
            </div>
          )}
        </div>
      )}

      {/* ---------- DATE DETAIL POPUP ---------- */}
      <Modal
        isOpen={!!popupDate}
        onClose={() => setPopupDate(null)}
        title={
          popupDate
            ? new Date(`${popupDate}T00:00:00`).toLocaleDateString(undefined, {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })
            : undefined
        }
        maxWidth="max-w-md"
        footer={
          <button
            type="button"
            disabled={popupTotal === 0}
            onClick={() => {
              if (popupDate) patch({ dueDate: popupDate, timeframe: "all", assignedCrId: undefined });
              setCalCrId(undefined);
              setPopupDate(null);
              requestAnimationFrame(() => listRef.current?.scrollIntoView({ behavior: "smooth" }));
            }}
            className="w-full rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:pointer-events-none disabled:opacity-40"
          >
            View all {popupTotal} follow-up{popupTotal === 1 ? "" : "s"}
          </button>
        }
      >
        <div className="mb-4 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <CalendarClock size={15} className="text-blue-500" />
          <span className="font-semibold text-slate-900 tabular-nums dark:text-white">{popupTotal}</span>
          follow-up{popupTotal === 1 ? "" : "s"} scheduled
        </div>

        {popupTotal === 0 ? (
          <p className="py-8 text-center text-sm italic text-slate-400 dark:text-slate-500">
            No follow-ups on this day.
          </p>
        ) : !canSeeOthers ? (
          <p className="py-4 text-center text-sm text-slate-600 dark:text-slate-300">
            You have <span className="font-bold tabular-nums">{popupTotal}</span> follow-up
            {popupTotal === 1 ? "" : "s"} due on this day.
          </p>
        ) : (
          <div className="flex flex-col gap-1.5">
            <p className="mb-1 text-xs font-medium text-slate-400 dark:text-slate-500">By customer rep</p>
            {popupCrs.map((cr) => (
              <button
                key={cr.id}
                type="button"
                onClick={() => {
                  if (popupDate)
                    patch({
                      dueDate: popupDate,
                      timeframe: "all",
                      assignedCrId: cr.id === "unassigned" ? undefined : cr.id,
                    });
                  setCalCrId(cr.id === "unassigned" ? undefined : cr.id);
                  setPopupDate(null);
                  requestAnimationFrame(() => listRef.current?.scrollIntoView({ behavior: "smooth" }));
                }}
                className="flex items-center justify-between gap-2 rounded-xl border border-transparent px-3 py-2.5 text-left transition-colors hover:border-blue-300 hover:bg-blue-50 dark:hover:border-blue-500/40 dark:hover:bg-blue-500/10"
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  <Avatar name={cr.name} size="sm" />
                  <span className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">{cr.name}</span>
                </span>
                <span className="shrink-0 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold tabular-nums text-blue-700 dark:bg-blue-500/20 dark:text-blue-300">
                  {cr.count}
                </span>
              </button>
            ))}
          </div>
        )}
      </Modal>
    </motion.div>
  );
}
