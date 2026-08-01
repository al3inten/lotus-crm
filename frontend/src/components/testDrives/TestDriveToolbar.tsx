import { useState } from "react";
import { Search } from "lucide-react";
import type { TestDriveFilters } from "../../api/testDrives.api";
import { Card } from "../common/Card";
import { Select } from "../common/Input";
import { LocationBranchSelect } from "../common/LocationBranchSelect";
import { DatePickerField } from "../common/DateTimePicker";

export function TestDriveToolbar({
  searchInput,
  onSearchInputChange,
  filters,
  patch,
  crossBranch,
  crs,
  consultants,
}: {
  searchInput: string;
  onSearchInputChange: (value: string) => void;
  filters: TestDriveFilters;
  patch: (p: Partial<TestDriveFilters>) => void;
  crossBranch: boolean;
  crs: { id: string; name: string; count: number }[] | undefined;
  consultants: { id: string; name: string; count: number }[] | undefined;
}) {
  const [locationId, setLocationId] = useState<string | undefined>(undefined);
  return (
    <Card>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Search — everyone. Customer name/phone only; use the CR/Consultant selects below to filter by rep. */}
        <div className="sm:col-span-2 lg:col-span-2">
          <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Search</label>
          <div className="relative">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={searchInput}
              onChange={(e) => onSearchInputChange(e.target.value)}
              placeholder="Search by customer name or phone"
              className="block w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 transition-colors placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-500/15 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500"
            />
          </div>
        </div>

        {/* Select date range — everyone. A single day is just From === To; overrides the status tiles. */}
        <div className="sm:col-span-2 lg:col-span-2">
          <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Scheduled date range</label>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <DatePickerField
                placeholder="From"
                value={filters.dateFrom ?? undefined}
                onChange={(value) => patch({ dateFrom: value || undefined })}
              />
            </div>
            <div className="flex-1">
              <DatePickerField
                placeholder="To"
                value={filters.dateTo ?? undefined}
                onChange={(value) => patch({ dateTo: value || undefined })}
              />
            </div>
            {(filters.dateFrom || filters.dateTo) && (
              <button
                type="button"
                onClick={() => patch({ dateFrom: undefined, dateTo: undefined })}
                className="shrink-0 rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Categorise filters — everyone, scoped to whatever test drives they can already see. */}
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
          label="Consultant"
          value={filters.consultantId ?? ""}
          onChange={(e) => patch({ consultantId: e.target.value || undefined })}
        >
          <option value="">All consultants</option>
          {consultants?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.count})
            </option>
          ))}
        </Select>
        {crossBranch && (
          <LocationBranchSelect
            locationId={locationId}
            branchId={filters.branchId}
            onChange={({ locationId: nextLocationId, branchId }) => {
              setLocationId(nextLocationId);
              patch({ branchId });
            }}
          />
        )}
      </div>
    </Card>
  );
}
