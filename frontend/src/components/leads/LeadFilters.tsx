import { SlidersHorizontal } from "lucide-react";
import type { LeadFilters as LeadFiltersType } from "../../api/leads.api";
import { Input, Select } from "../common/Input";
import { ENQUIRY_STATUSES, LEAD_SOURCES } from "../../types";
import { useBranches } from "../../hooks/useBranches";

interface LeadFiltersProps {
  filters: LeadFiltersType;
  onChange: (filters: LeadFiltersType) => void;
}

export function LeadFilters({ filters, onChange }: LeadFiltersProps) {
  const { data: branches } = useBranches();

  const update = (patch: Partial<LeadFiltersType>) => onChange({ ...filters, ...patch, page: 1 });

  return (
    <div className="flex flex-col gap-3">
      <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">
        <SlidersHorizontal size={13} />
        Filters
      </p>
      <div className="flex flex-wrap items-end gap-3">
        <Input
          label="Search"
          placeholder="Name or phone"
          value={filters.search ?? ""}
          onChange={(e) => update({ search: e.target.value || undefined })}
        />
        <Select label="Status" value={filters.status ?? ""} onChange={(e) => update({ status: e.target.value || undefined })}>
          <option value="">All</option>
          {ENQUIRY_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.replaceAll("_", " ")}
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
          onChange={(e) => update({ branchId: e.target.value || undefined })}
        >
          <option value="">All</option>
          {branches?.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );
}
