import { Search } from "lucide-react";
import type { FollowUpFilters, FollowUpSortBy } from "../../api/followUps.api";
import { ENQUIRY_STATUSES, ENQUIRY_CATEGORIES } from "../../types";
import type { Branch } from "../../types";
import { Card } from "../common/Card";
import { Select } from "../common/Input";
import { DatePickerField } from "../common/DateTimePicker";

const SORT_OPTIONS: { value: FollowUpSortBy; label: string }[] = [
  { value: "dueDate", label: "Follow-up date" },
  { value: "createdAt", label: "Recently added" },
  { value: "cr", label: "Customer Rep" },
  { value: "status", label: "Status" },
];

export function FollowUpToolbar({
  searchInput,
  onSearchInputChange,
  filters,
  patch,
  canSeeOthers,
  crossBranch,
  branches,
  crs,
}: {
  searchInput: string;
  onSearchInputChange: (value: string) => void;
  filters: FollowUpFilters;
  patch: (p: Partial<FollowUpFilters>) => void;
  canSeeOthers: boolean;
  crossBranch: boolean;
  branches: Branch[] | undefined;
  crs: { id: string; name: string; count: number }[] | undefined;
}) {
  return (
    <Card>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Search — everyone */}
        <div className="sm:col-span-2 lg:col-span-2">
          <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Search</label>
          <div className="relative">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={searchInput}
              onChange={(e) => onSearchInputChange(e.target.value)}
              placeholder="Search by customer name or phone"
              className="block w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 transition-colors placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/15 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500"
            />
          </div>
        </div>

        {/* Select date — everyone. Narrows to a single day; overrides the timeframe tiles. */}
        <div className="sm:col-span-2 lg:col-span-2">
          <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Select date</label>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <DatePickerField
                value={filters.dueDate ?? undefined}
                onChange={(value) => patch({ dueDate: value || undefined, timeframe: "all" })}
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
            {crs?.map((cr) => (
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
  );
}
