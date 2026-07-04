import { useEffect, useState } from "react";
import { Building2, Pencil, Trash2 } from "lucide-react";
import clsx from "clsx";
import type { Branch } from "../../types";
import { useToggleAutoAssign, useUpdateBranch, useDeleteBranch } from "../../hooks/useBranches";
import { Modal } from "../common/Modal";
import { Input } from "../common/Input";
import { Button } from "../common/Button";
import { Toggle } from "../common/Toggle";
import { Card } from "../common/Card";

function EditBranchModal({ branch, isOpen, onClose }: { branch: Branch; isOpen: boolean; onClose: () => void }) {
  const updateBranch = useUpdateBranch();
  const [name, setName] = useState(branch.name);
  const [city, setCity] = useState(branch.city);
  const [address, setAddress] = useState(branch.address ?? "");
  const [isActive, setIsActive] = useState(branch.isActive);

  useEffect(() => {
    setName(branch.name);
    setCity(branch.city);
    setAddress(branch.address ?? "");
    setIsActive(branch.isActive);
  }, [branch, isOpen]);

  const handleSave = () => {
    updateBranch.mutate(
      { branchId: branch.id, payload: { name, city, address: address || undefined, isActive } },
      { onSuccess: onClose }
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Edit Branch — ${branch.code}`}>
      <div className="flex flex-col gap-3">
        <Input label="Branch Name" value={name} onChange={(e) => setName(e.target.value)} />
        <Input label="City" value={city} onChange={(e) => setCity(e.target.value)} />
        <Input label="Address (optional)" value={address} onChange={(e) => setAddress(e.target.value)} />
        <div className="rounded-lg border border-gray-200 p-3">
          <Toggle
            label="Active"
            description="Inactive branches stop receiving auto-assigned leads"
            checked={isActive}
            onChange={setIsActive}
          />
        </div>
        {updateBranch.isError && <p className="text-sm text-red-600">Failed to save changes.</p>}
        <div className="mt-1 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button isLoading={updateBranch.isPending} disabled={!name || !city} onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      </div>
    </Modal>
  );
}

interface BranchListProps {
  branches: Branch[];
  selectedBranchId: string | null;
  onSelect: (branchId: string) => void;
}

export function BranchList({ branches, selectedBranchId, onSelect }: BranchListProps) {
  const toggleAutoAssign = useToggleAutoAssign();
  const deleteBranch = useDeleteBranch();
  const [editing, setEditing] = useState<Branch | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDelete = (branch: Branch) => {
    if (!window.confirm(`Delete branch "${branch.name}"? Only possible when it has no staff, enquiries or roles.`)) return;
    setDeleteError(null);
    deleteBranch.mutate(branch.id, {
      onError: (err) => {
        const message =
          (err as { response?: { data?: { error?: string } } }).response?.data?.error ??
          "Could not delete this branch.";
        setDeleteError(message);
      },
    });
  };

  return (
    <div className="flex flex-col gap-3">
      {deleteError && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">{deleteError}</p>
      )}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {branches.map((branch) => (
          <Card
            key={branch.id}
            padded={false}
            className={clsx("p-4", selectedBranchId === branch.id && "border-blue-300 ring-1 ring-blue-200", !branch.isActive && "opacity-60")}
            onClick={() => onSelect(branch.id)}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <Building2 size={20} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {branch.name}
                    {!branch.isActive && <span className="ml-2 text-xs font-medium text-gray-400">(inactive)</span>}
                  </p>
                  <p className="text-xs text-gray-500">
                    {branch.code} · {branch.city}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                  onClick={(e) => { e.stopPropagation(); setEditing(branch); }}
                  aria-label="Edit branch"
                >
                  <Pencil size={15} />
                </button>
                <button
                  className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                  onClick={(e) => { e.stopPropagation(); handleDelete(branch); }}
                  aria-label="Delete branch"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
            <div className="mt-3 border-t border-gray-100 pt-3" onClick={(e) => e.stopPropagation()}>
              <Toggle
                label="Auto-assign digital leads"
                checked={branch.autoAssignEnabled}
                onChange={(on) => toggleAutoAssign.mutate({ branchId: branch.id, autoAssignEnabled: on })}
              />
            </div>
          </Card>
        ))}
      </div>
      {editing && <EditBranchModal branch={editing} isOpen={!!editing} onClose={() => setEditing(null)} />}
    </div>
  );
}
