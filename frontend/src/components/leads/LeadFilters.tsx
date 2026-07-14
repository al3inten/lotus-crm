import { useEffect, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import type { LeadFilters as LeadFiltersType } from "../../api/leads.api";
import { Input, Select } from "../common/Input";
import { ENQUIRY_STATUSES, LEAD_SOURCES } from "../../types";
import { useBranches } from "../../hooks/useBranches";
import { useBranchStaff } from "../../hooks/useUsers";

const CATEGORIES = ["HOT", "WARM", "COLD"] as const;

const toDateStr = (d: Date) => {
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60000).toISOString().slice(0, 10);
};

function datePreset(key: "today" | "tomorrow" | "week"): { from: string; to: string } {
  const now = new Date();
  if (key === "today") {
    const s = toDateStr(now);
    return { from: s, to: s };
  }
  if (key === "tomorrow") {
    const t = new Date(now);
    t.setDate(t.getDate() + 1);
    const s = toDateStr(t);
    return { from: s, to: s };
  }
  const start = new Date(now);
  const day = (start.getDay() + 6) % 7; // Monday = 0
  start.setDate(start.getDate() - day);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { from: toDateStr(start), to: toDateStr(end) };
}

const DATE_PRESETS = [
  { key: "today", label: "Today" },
  { key: "tomorrow", label: "Tomorrow" },
  { key: "week", label: "This Week" },
] as const;

interface LeadFiltersProps {
  filters: LeadFiltersType;
  onChange: (filters: LeadFiltersType) => void;
}

export function LeadFilters({ filters, onChange }: LeadFiltersProps) {
  const { data: branches } = useBranches();
  const { data: crTeam } = useBranchStaff(filters.branchId, "CR_TEAM");

  // Local, debounced search so we don't fire a request on every keystroke.
  const [searchInput, setSearchInput] = useState(filters.search ?? "");
  useEffect(() => {
    setSearchInput(filters.search ?? "");
  }, [filters.search]);
  useEffect(() => {
    const next = searchInput || undefined;
    if (next === filters.search) return;
    const t = setTimeout(() => onChange({ ...filters, search: next, page: 1 }), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const update = (patch: Partial<LeadFiltersType>) => onChange({ ...filters, ...patch, page: 1 });

  const activeCount = [
    filters.search,
    filters.status,
    filters.source,
    filters.enquiryCategory,
    filters.branchId,
    filters.assignedCrId,
    filters.dateFrom,
    filters.dateTo,
  ].filter(Boolean).length;

  const clearAll = () => {
    setSearchInput("");
    onChange({ page: 1, pageSize: filters.pageSize });
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          <SlidersHorizontal size={13} />
          Filters
          {activeCount > 0 && (
            <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1.5 text-[11px] font-bold text-white">
              {activeCount}
            </span>
          )}
        </p>
        {activeCount > 0 && (
          <button
            type="button"
            onClick={clearAll}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            <X size={13} />
            Clear
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-8">
        <div className="col-span-2 sm:col-span-3 lg:col-span-1">
          <Input
            label="Search"
            placeholder="Name or phone"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <Select label="Status" value={filters.status ?? ""} onChange={(e) => update({ status: e.target.value || undefined })}>
          <option value="">All</option>
          {ENQUIRY_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.replaceAll("_", " ")}
            </option>
          ))}
        </Select>
        <Select label="Category" value={filters.enquiryCategory ?? ""} onChange={(e) => update({ enquiryCategory: e.target.value || undefined })}>
          <option value="">All</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
        <Select label="Source" value={filters.source ?? ""} onChange={(e) => update({ source: e.target.value || undefined })}>
          <option value="">All</option>
          {LEAD_SOURCES.map((s) => (
            <option key={s} value={s}>
              {s.replaceAll("_", " ")}
            </option>
          ))}
        </Select>
        <Select
          label="Branch"
          value={filters.branchId ?? ""}
          onChange={(e) => update({ branchId: e.target.value || undefined, assignedCrId: undefined })}
        >
          <option value="">All</option>
          {branches?.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </Select>
        <Select
          label="Assigned CR"
          value={filters.assignedCrId ?? ""}
          disabled={!filters.branchId}
          onChange={(e) => update({ assignedCrId: e.target.value || undefined })}
        >
          <option value="">{filters.branchId ? "All" : "Pick branch first"}</option>
          {crTeam?.map((cr) => (
            <option key={cr.id} value={cr.id}>
              {cr.name}
            </option>
          ))}
        </Select>
        <Input
          type="date"
          label="From"
          value={filters.dateFrom ?? ""}
          max={filters.dateTo ?? undefined}
          onChange={(e) => update({ dateFrom: e.target.value || undefined })}
        />
        <Input
          type="date"
          label="To"
          value={filters.dateTo ?? ""}
          min={filters.dateFrom ?? undefined}
          onChange={(e) => update({ dateTo: e.target.value || undefined })}
        />
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {DATE_PRESETS.map((p) => {
          const range = datePreset(p.key);
          const isActive = filters.dateFrom === range.from && filters.dateTo === range.to;
          return (
            <button
              key={p.key}
              type="button"
              onClick={() => update(isActive ? { dateFrom: undefined, dateTo: undefined } : { dateFrom: range.from, dateTo: range.to })}
              className={`rounded-full px-2.5 py-1 text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 ${
                isActive
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              }`}
            >
              {p.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
