import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Car, AlertTriangle, CalendarClock, CheckCircle2, Layers, Loader2 } from "lucide-react";
import clsx from "clsx";
import { useTestDrives } from "../hooks/useTestDrives";
import type { TestDriveFilters, TestDriveItem, TestDriveStatus } from "../api/testDrives.api";
import { fadeUp, staggerContainer } from "../lib/motion";
import { TestDriveToolbar } from "../components/testDrives/TestDriveToolbar";
import { TestDriveList } from "../components/testDrives/TestDriveList";

const PAGE_SIZE = 20;

const STATUS_TILES: { key: TestDriveStatus; label: string; icon: ReactNode; tone: string; statKey: "overdue" | "upcoming" | "completed" | "total" }[] = [
  { key: "OVERDUE", label: "Overdue", icon: <AlertTriangle size={20} />, tone: "bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400", statKey: "overdue" },
  { key: "UPCOMING", label: "Upcoming", icon: <CalendarClock size={20} />, tone: "bg-primary-100 text-primary-600 dark:bg-primary-500/15 dark:text-primary-400", statKey: "upcoming" },
  { key: "COMPLETED", label: "Completed", icon: <CheckCircle2 size={20} />, tone: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400", statKey: "completed" },
  { key: "ALL", label: "All", icon: <Layers size={20} />, tone: "bg-slate-100 text-slate-600 dark:bg-slate-700/40 dark:text-slate-300", statKey: "total" },
];

/** KPI tile that doubles as a status filter. */
function StatusTile({
  icon,
  label,
  value,
  tone,
  active,
  loading,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  tone: string;
  active: boolean;
  loading: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      aria-pressed={active}
      aria-busy={loading}
      className={clsx(
        "group relative flex items-center gap-3.5 overflow-hidden rounded-2xl border p-4 text-left transition-all hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:cursor-default disabled:hover:translate-y-0",
        active
          ? "border-primary-400 bg-primary-50/60 ring-1 ring-primary-300 dark:border-primary-500/50 dark:bg-primary-500/10 dark:ring-primary-500/30"
          : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/50 dark:hover:border-slate-700"
      )}
    >
      <span className={clsx("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", tone, loading && "animate-pulse")}>{icon}</span>
      <div className="min-w-0">
        {loading ? (
          <div className="h-6 w-10 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
        ) : (
          <p className="text-2xl font-bold leading-none tabular-nums text-slate-900 dark:text-white">{value.toLocaleString()}</p>
        )}
        <p className="mt-1 truncate text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
      </div>
    </button>
  );
}

export function TestDrivesPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<TestDriveFilters>({ status: "ALL", sortBy: "scheduledAt", order: "asc", page: 1, pageSize: PAGE_SIZE });
  const [searchInput, setSearchInput] = useState("");

  const { data, isLoading, isFetching } = useTestDrives(filters);

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

  const patch = (p: Partial<TestDriveFilters>) => setFilters((f) => ({ ...f, ...p, page: 1 }));
  const goToPage = (p: number) => setFilters((f) => ({ ...f, page: Math.min(Math.max(1, p), totalPages) }));

  // Carries this page of the test-drive queue along as nav state, so the detail page
  // can offer "Next/Prev lead" through exactly the drives the CR/consultant is working.
  const queue = (data?.items ?? []).map((item) => ({ leadId: item.leadId, enquiryId: item.enquiryId }));
  const open = (item: TestDriveItem) =>
    navigate(`/leads/${item.leadId}/enquiries/${item.enquiryId}`, {
      state: { queue, from: { path: "/test-drives", label: "Test Drives" } },
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
            <Car size={26} />
          </span>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">Test Drives</h1>
            <p className="mt-1.5 flex items-center gap-2 text-sm font-medium text-slate-300">
              <Car size={15} className="text-primary-400" />
              {isLoading ? (
                <span className="inline-block h-4 w-40 animate-pulse rounded bg-white/15" />
              ) : canSeeOthers ? (
                <>
                  <span className="font-bold text-white tabular-nums">{(stats?.total ?? 0).toLocaleString()}</span>
                  test drives across your team
                </>
              ) : (
                <>
                  <span className="font-bold text-white tabular-nums">{(stats?.total ?? 0).toLocaleString()}</span>
                  test drives assigned to you
                </>
              )}
            </p>
          </div>
        </div>
      </motion.div>

      {/* ---------- STATUS TILES (double as filters) ---------- */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {STATUS_TILES.map((tile) => (
          <StatusTile
            key={tile.key}
            icon={tile.icon}
            tone={tile.tone}
            label={tile.label}
            value={stats?.[tile.statKey] ?? 0}
            loading={isLoading || !stats}
            active={filters.status === tile.key && !filters.dateFrom && !filters.dateTo}
            onClick={() => {
              patch({ status: tile.key, dateFrom: undefined, dateTo: undefined });
              requestAnimationFrame(() => {
                document.getElementById("test-drive-list")?.scrollIntoView({ behavior: "smooth" });
              });
            }}
          />
        ))}
      </motion.div>

      {/* ---------- TOOLBAR ---------- */}
      <motion.div variants={fadeUp}>
        <TestDriveToolbar
          searchInput={searchInput}
          onSearchInputChange={setSearchInput}
          filters={filters}
          patch={patch}
          crossBranch={crossBranch}
          crs={data?.crs}
          consultants={data?.consultants}
        />
      </motion.div>

      {/* ---------- RESULT SUMMARY ---------- */}
      <div id="test-drive-list" className="scroll-mt-4" />
      {!isLoading && data && (
        <div className="flex items-center justify-between gap-3 px-1 text-sm">
          <p className="text-slate-500 dark:text-slate-400">
            {total === 0 ? (
              "No test drives match"
            ) : (
              <>
                <span className="font-semibold text-slate-700 tabular-nums dark:text-slate-200">{total.toLocaleString()}</span>{" "}
                {total === 1 ? "test drive" : "test drives"}
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
      <TestDriveList
        isLoading={isLoading || !data}
        total={total}
        items={data?.items ?? []}
        isFetching={isFetching}
        onOpen={open}
        page={page}
        totalPages={totalPages}
        onPageChange={goToPage}
      />
    </motion.div>
  );
}
