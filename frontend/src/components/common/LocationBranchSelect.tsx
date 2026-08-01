import { Select } from "./Input";
import { useBranchLocations } from "../../hooks/useBranchLocations";
import { useBranches } from "../../hooks/useBranches";

interface LocationBranchSelectProps {
  locationId?: string;
  branchId?: string;
  onChange: (value: { locationId: string | undefined; branchId: string | undefined }) => void;
  /** When true, an empty "All" option is offered for both selects (filter bars). When
   * false, the caller must resolve a real value before submit (forms like AddLeadWizard). */
  allowAll?: boolean;
  locationLabel?: string;
  branchLabel?: string;
  disabled?: boolean;
}

/** Two cascading Selects — Location, then Branch scoped to that Location. Picking a
 * different location always clears the branch selection, since the previous branch
 * likely doesn't belong to the new location. */
export function LocationBranchSelect({
  locationId,
  branchId,
  onChange,
  allowAll = true,
  locationLabel = "Location",
  branchLabel = "Branch",
  disabled,
}: LocationBranchSelectProps) {
  const { data: locations } = useBranchLocations();
  const { data: branches } = useBranches(locationId);

  return (
    <>
      <Select
        label={locationLabel}
        value={locationId ?? ""}
        disabled={disabled}
        onChange={(e) => onChange({ locationId: e.target.value || undefined, branchId: undefined })}
      >
        {allowAll && <option value="">All</option>}
        {!allowAll && <option value="">Select location</option>}
        {locations?.map((l) => (
          <option key={l.id} value={l.id}>
            {l.name}
          </option>
        ))}
      </Select>
      <Select
        label={branchLabel}
        value={branchId ?? ""}
        disabled={disabled || !locationId}
        onChange={(e) => onChange({ locationId, branchId: e.target.value || undefined })}
      >
        <option value="">{locationId ? (allowAll ? "All" : "Select branch") : "Pick location first"}</option>
        {branches?.map((b) => (
          <option key={b.id} value={b.id}>
            {b.name}
          </option>
        ))}
      </Select>
    </>
  );
}
