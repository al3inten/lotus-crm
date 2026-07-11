import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import clsx from "clsx";
import { Contact, Search, Car, ChevronLeft, ChevronRight, Loader2, Users, Gem, Crown, Sprout, ShoppingBag, MessageSquareText } from "lucide-react";
import { useCustomers } from "../hooks/useCustomers";
import { useBranches } from "../hooks/useBranches";
import type { CustomerFilters } from "../api/customers.api";
import type { Customer, CustomerTier } from "../types";
import { Card } from "../components/common/Card";
import { Avatar } from "../components/common/Avatar";
import { Select } from "../components/common/Input";
import { TierBadge } from "../components/common/TierBadge";
import { fadeUp, staggerContainer } from "../lib/motion";

const PAGE_SIZE = 24;

const TIER_ACCENT: Record<CustomerTier, string> = {
  DIAMOND: "bg-cyan-400 dark:bg-cyan-500",
  GOLD: "bg-amber-400 dark:bg-amber-500",
  PROSPECT: "bg-emerald-400 dark:bg-emerald-500",
};

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

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

/** KPI tile that doubles as a tier filter. */
function StatTile({
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

export function CustomersPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<CustomerFilters>({ page: 1, pageSize: PAGE_SIZE });
  const [searchInput, setSearchInput] = useState("");

  const { data: branches } = useBranches();
  const { data, isLoading, isFetching } = useCustomers(filters);

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
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const goToPage = (p: number) => setFilters((f) => ({ ...f, page: Math.min(Math.max(1, p), totalPages) }));
  const setTier = (tier?: CustomerTier) => setFilters((f) => ({ ...f, tier: f.tier === tier ? undefined : tier, page: 1 }));

  const open = (c: Customer) => navigate(`/leads/${c.id}`);
  const onKey = (e: React.KeyboardEvent, c: Customer) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      open(c);
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
            <Contact size={26} />
          </span>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">Customers</h1>
            <p className="mt-1.5 flex items-center gap-2 text-sm font-medium text-slate-300">
              <Users size={15} className="text-blue-400" />
              {isLoading ? (
                <span className="inline-block h-4 w-32 animate-pulse rounded bg-white/15" />
              ) : (
                <>
                  <span className="font-bold text-white tabular-nums">{(stats?.total ?? 0).toLocaleString()}</span>
                  unique customers · one profile per phone
                </>
              )}
            </p>
          </div>
        </div>
      </motion.div>

      {/* ---------- KPI STAT TILES (double as tier filters) ---------- */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          icon={<Users size={20} className="text-blue-600 dark:text-blue-400" />}
          tone="bg-blue-100 dark:bg-blue-500/15"
          label="All customers"
          value={stats?.total ?? 0}
          active={!filters.tier}
          onClick={() => setTier(undefined)}
        />
        <StatTile
          icon={<Gem size={20} className="text-cyan-600 dark:text-cyan-400" />}
          tone="bg-cyan-100 dark:bg-cyan-500/15"
          label="Diamond · repeat buyers"
          value={stats?.diamond ?? 0}
          active={filters.tier === "DIAMOND"}
          onClick={() => setTier("DIAMOND")}
        />
        <StatTile
          icon={<Crown size={20} className="text-amber-600 dark:text-amber-400" />}
          tone="bg-amber-100 dark:bg-amber-500/15"
          label="Gold · car owners"
          value={stats?.gold ?? 0}
          active={filters.tier === "GOLD"}
          onClick={() => setTier("GOLD")}
        />
        <StatTile
          icon={<Sprout size={20} className="text-emerald-600 dark:text-emerald-400" />}
          tone="bg-emerald-100 dark:bg-emerald-500/15"
          label="Prospects · not bought yet"
          value={stats?.prospect ?? 0}
          active={filters.tier === "PROSPECT"}
          onClick={() => setTier("PROSPECT")}
        />
      </motion.div>

      {/* ---------- TOOLBAR ---------- */}
      <motion.div variants={fadeUp}>
        <Card>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Search</label>
              <div className="relative">
                <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search by name or phone number"
                  className="block w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 transition-colors placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/15 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500"
                />
              </div>
            </div>
            <Select
              label="Branch"
              value={filters.branchId ?? ""}
              onChange={(e) => setFilters((f) => ({ ...f, branchId: e.target.value || undefined, page: 1 }))}
            >
              <option value="">All branches</option>
              {branches?.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </Select>
          </div>
        </Card>
      </motion.div>

      {/* ---------- RESULT SUMMARY ---------- */}
      {!isLoading && data && (
        <div className="flex items-center justify-between gap-3 px-1 text-sm">
          <p className="text-slate-500 dark:text-slate-400">
            {total === 0 ? (
              "No customers match"
            ) : (
              <>
                <span className="font-semibold text-slate-700 tabular-nums dark:text-slate-200">{total.toLocaleString()}</span>{" "}
                {filters.tier ? `${filters.tier.toLowerCase()} ` : ""}
                {total === 1 ? "customer" : "customers"}
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

      {/* ---------- CARD GRID ---------- */}
      {isLoading || !data ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" style={{ animationDelay: `${i * 60}ms` }} />
          ))}
        </div>
      ) : total === 0 ? (
        <Card className="flex flex-col items-center gap-2 py-16 text-center text-slate-400 dark:text-slate-500">
          <Contact size={30} />
          <p className="text-sm">No customers found. Try a different search or filter.</p>
        </Card>
      ) : (
        <div className={clsx("transition-opacity duration-200", isFetching && "pointer-events-none opacity-60")}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {data.items.map((c) => (
              <div
                key={c.id}
                role="button"
                tabIndex={0}
                aria-label={`Open customer ${c.name}`}
                onClick={() => open(c)}
                onKeyDown={(e) => onKey(e, c)}
                className="group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all hover:-translate-y-1 hover:border-blue-300 hover:shadow-[0_16px_40px_rgb(0,0,0,0.08)] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-blue-500/40"
              >
                <span className={clsx("h-1 w-full", TIER_ACCENT[c.tier])} />
                <div className="flex flex-1 flex-col gap-3 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar name={c.name} size="md" />
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-900 dark:text-white">{c.name}</p>
                        <p className="truncate text-xs text-slate-500 dark:text-slate-400">{c.phoneRaw}</p>
                      </div>
                    </div>
                    <TierBadge tier={c.tier} size="sm" />
                  </div>

                  {/* Vehicles owned */}
                  <div className="flex min-h-[26px] flex-wrap items-center gap-1.5">
                    {c.ownedVehicles.length ? (
                      c.ownedVehicles.map((v) => (
                        <span key={v} className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          <Car size={11} className="text-slate-400" /> {v}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400 dark:text-slate-500">No purchase yet</span>
                    )}
                  </div>

                  {/* Footer stats */}
                  <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-3 text-xs dark:border-slate-800">
                    <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <MessageSquareText size={12} /> {c.enquiryCount}
                      </span>
                      {c.purchaseCount > 0 && (
                        <span className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                          <ShoppingBag size={12} /> {c.purchaseCount}
                        </span>
                      )}
                    </div>
                    <span className="tabular-nums text-slate-400 dark:text-slate-500">{fmtDate(c.lastActivityAt)}</span>
                  </div>
                </div>
              </div>
            ))}
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
    </motion.div>
  );
}
