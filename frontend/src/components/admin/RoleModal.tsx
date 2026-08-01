import { useEffect, useState } from "react";
import clsx from "clsx";
import { Modal } from "../common/Modal";
import { Input, Select } from "../common/Input";
import { Button } from "../common/Button";
import { Toggle } from "../common/Toggle";
import { MODULES } from "../../types";
import type { ModuleKey, ModulePermissions, PermissionLevel, RoleDefinition, Branch } from "../../types";
import { useCreateRole, useUpdateRole } from "../../hooks/useRoles";
import { useBranchLocations } from "../../hooks/useBranchLocations";
import { VISIBLE_MODULE_KEYS } from "../layout/navConfig";

// Only offer sections that are actually reachable in the sidebar right now — a module
// belonging to a hidden nav group (e.g. "ENGAGE" while under development) has nothing
// for its permission to gate, so hide it from role creation too.
const VISIBLE_MODULES = MODULES.filter((m) => VISIBLE_MODULE_KEYS.has(m.key));

const LEVELS: { value: PermissionLevel; label: string }[] = [
  { value: "none", label: "None" },
  { value: "read", label: "Read" },
  { value: "write", label: "Write" },
];

function emptyPermissions(): ModulePermissions {
  return Object.fromEntries(MODULES.map((m) => [m.key, "none"])) as ModulePermissions;
}

const DEFAULT_PERMISSIONS: ModulePermissions = {
  ...emptyPermissions(),
  dashboard: "write",
  leads: "write",
};

interface RoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  branches: Branch[];
  /** When set, the modal edits this role instead of creating a new one. */
  editing?: RoleDefinition | null;
  defaultBranchId?: string;
}

function LevelPicker({ value, onChange }: { value: PermissionLevel; onChange: (v: PermissionLevel) => void }) {
  return (
    <div className="inline-flex overflow-hidden rounded-md border border-gray-200">
      {LEVELS.map((level, i) => (
        <button
          key={level.value}
          type="button"
          onClick={() => onChange(level.value)}
          className={clsx(
            "px-2.5 py-1 text-xs font-medium transition-colors",
            i > 0 && "border-l border-gray-200",
            value === level.value ? "bg-primary-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"
          )}
        >
          {level.label}
        </button>
      ))}
    </div>
  );
}

export function RoleModal({ isOpen, onClose, branches, editing, defaultBranchId }: RoleModalProps) {
  const createRole = useCreateRole();
  const updateRole = useUpdateRole();
  const { data: locations } = useBranchLocations();

  const [name, setName] = useState("");
  const [locationId, setLocationId] = useState<string | undefined>(undefined);
  const [branchId, setBranchId] = useState<string>("");
  const branchesInLocation = locationId ? branches.filter((b) => b.locationId === locationId) : branches;
  const [permissions, setPermissions] = useState<ModulePermissions>(DEFAULT_PERMISSIONS);
  const [canViewAllBranches, setCanViewAllBranches] = useState(false);
  const [restrictLeadsToOwn, setRestrictLeadsToOwn] = useState(false);
  const [canReassignCustomerCr, setCanReassignCustomerCr] = useState(false);
  const [canViewBranchLeads, setCanViewBranchLeads] = useState(false);
  const [canDeleteLeads, setCanDeleteLeads] = useState(false);

  useEffect(() => {
    if (editing) {
      setName(editing.name);
      setBranchId(editing.branchId ?? "");
      setLocationId(branches.find((b) => b.id === editing.branchId)?.locationId);
      setPermissions({ ...emptyPermissions(), ...editing.permissions });
      setCanViewAllBranches(editing.canViewAllBranches);
      setRestrictLeadsToOwn(editing.restrictLeadsToOwn);
      setCanReassignCustomerCr(editing.canReassignCustomerCr);
      setCanViewBranchLeads(editing.canViewBranchLeads);
      setCanDeleteLeads(editing.canDeleteLeads);
    } else {
      setName("");
      setBranchId(defaultBranchId ?? "");
      setLocationId(branches.find((b) => b.id === defaultBranchId)?.locationId);
      setPermissions(DEFAULT_PERMISSIONS);
      setCanViewAllBranches(false);
      setRestrictLeadsToOwn(false);
      setCanReassignCustomerCr(false);
      setCanViewBranchLeads(false);
      setCanDeleteLeads(false);
    }
  }, [editing, defaultBranchId, isOpen]);

  const setLevel = (key: ModuleKey, level: PermissionLevel) => {
    setPermissions((prev) => ({ ...prev, [key]: level }));
  };

  const isPending = createRole.isPending || updateRole.isPending;
  const isError = createRole.isError || updateRole.isError;
  const hasAnyAccess = Object.values(permissions).some((level) => level !== "none");

  const handleSubmit = () => {
    if (!name || !hasAnyAccess) return;
    if (editing) {
      updateRole.mutate(
        {
          roleId: editing.id,
          payload: {
            name,
            permissions,
            canViewAllBranches,
            restrictLeadsToOwn,
            canReassignCustomerCr,
            canViewBranchLeads,
            canDeleteLeads,
          },
        },
        { onSuccess: onClose }
      );
    } else {
      createRole.mutate(
        {
          name,
          branchId: branchId || null,
          permissions,
          canViewAllBranches,
          restrictLeadsToOwn,
          canReassignCustomerCr,
          canViewBranchLeads,
          canDeleteLeads,
        },
        { onSuccess: onClose }
      );
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editing ? `Edit Role — ${editing.name}` : "Create Role"}>
      <div className="flex flex-col gap-4">
        <Input
          label="Role Name"
          placeholder="e.g. Assistant Manager"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={editing?.isSystemDefault}
        />
        {editing?.isSystemDefault && (
          <p className="-mt-3 text-xs text-gray-500">
            This is the built-in CR role — its name can't be changed and it can't be deleted, but its access below can be edited freely.
          </p>
        )}

        {!editing && (
          <>
            <Select
              label="Location"
              value={locationId ?? ""}
              onChange={(e) => {
                setLocationId(e.target.value || undefined);
                setBranchId("");
              }}
            >
              <option value="">All locations</option>
              {locations?.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </Select>
            <Select label="Branch" value={branchId} onChange={(e) => setBranchId(e.target.value)}>
              <option value="">All branches (global role)</option>
              {branchesInLocation.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </Select>
          </>
        )}

        <div className="rounded-lg border border-gray-200 p-3">
          <Toggle
            label="Can view all branches"
            description="Off = only sees data for their own branch"
            checked={canViewAllBranches}
            onChange={setCanViewAllBranches}
          />
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-gray-800">Section Access</p>
          <div className="flex flex-col gap-2 rounded-lg border border-gray-200 p-3">
            {VISIBLE_MODULES.map((module) => (
              <div key={module.key} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-gray-700">{module.label}</span>
                  <LevelPicker value={permissions[module.key]} onChange={(v) => setLevel(module.key, v)} />
                </div>
                {module.key === "leads" && (
                  <div className="ml-0 flex flex-col gap-2 rounded-md bg-gray-50 px-2.5 py-2">
                    <Toggle
                      label="Can only edit leads assigned to me"
                      description={
                        canViewBranchLeads
                          ? "Every lead in the branch is still visible — this only blocks editing/acting on leads assigned to someone else."
                          : "Also hides leads assigned to someone else, unless \"Can view other CRs' leads\" below is on."
                      }
                      checked={restrictLeadsToOwn}
                      onChange={(v) => {
                        setRestrictLeadsToOwn(v);
                        if (!v) setCanViewBranchLeads(false);
                      }}
                    />
                    {restrictLeadsToOwn && (
                      <div className="ml-4 border-l-2 border-gray-200 pl-2.5">
                        <Toggle
                          label="Can view other CRs' leads in this branch"
                          description="Still can't edit or change status on a lead unless it's assigned to them."
                          checked={canViewBranchLeads}
                          onChange={setCanViewBranchLeads}
                        />
                      </div>
                    )}
                    <Toggle
                      label="Can reassign a customer's CR"
                      description="Every enquiry a customer has is owned by one CR at a time — this lets the role move that ownership to a different CR. Super Admin can always do this regardless of this toggle."
                      checked={canReassignCustomerCr}
                      onChange={setCanReassignCustomerCr}
                    />
                    <Toggle
                      label="Can delete leads"
                      description="Lets the role permanently delete an enquiry and its history. Independent of Write access above — a role can edit leads without being able to delete them. Super Admin can always do this regardless of this toggle."
                      checked={canDeleteLeads}
                      onChange={setCanDeleteLeads}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {isError && <p className="text-sm text-red-600">Failed to save role — a role with this name may already exist.</p>}

        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button isLoading={isPending} disabled={!name || !hasAnyAccess} onClick={handleSubmit}>
            {editing ? "Save Changes" : "Create Role"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
