import clsx from "clsx";
import type { Branch } from "../../types";
import { useToggleAutoAssign } from "../../hooks/useBranches";

interface BranchListProps {
  branches: Branch[];
  selectedBranchId: string | null;
  onSelect: (branchId: string) => void;
}

export function BranchList({ branches, selectedBranchId, onSelect }: BranchListProps) {
  const toggleAutoAssign = useToggleAutoAssign();

  return (
    <ul className="flex flex-col gap-2">
      {branches.map((branch) => (
        <li
          key={branch.id}
          className={clsx(
            "cursor-pointer rounded-md border p-3",
            selectedBranchId === branch.id ? "border-blue-400 bg-blue-50" : "border-gray-200 bg-white hover:bg-gray-50"
          )}
          onClick={() => onSelect(branch.id)}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-900">{branch.name}</p>
              <p className="text-xs text-gray-500">
                {branch.code} · {branch.city}
              </p>
            </div>
          </div>
          <label
            className="mt-2 flex items-center gap-2 text-xs text-gray-600"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              type="checkbox"
              checked={branch.autoAssignEnabled}
              onChange={(e) => toggleAutoAssign.mutate({ branchId: branch.id, autoAssignEnabled: e.target.checked })}
            />
            Auto-assign digital leads
          </label>
        </li>
      ))}
    </ul>
  );
}
