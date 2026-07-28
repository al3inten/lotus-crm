import { useEffect, useState } from "react";
import clsx from "clsx";
import { Modal } from "../common/Modal";
import { Input, Select } from "../common/Input";
import { Button } from "../common/Button";
import { Toggle } from "../common/Toggle";
import { MODULES } from "../../types";
import type { ModuleKey, ModulePermissions, PermissionLevel, RoleDefinition, Branch } from "../../types";
import { useCreateRole, useUpdateRole } from "../../hooks/useRoles";
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

  const [name, setName] = useState("");
  const [branchId, setBranchId] = useState<string>("");
  const [permissions, setPermissions] = useState<ModulePermissions>(DEFAULT_PERMISSIONS);
  const [canViewAllBranches, setCanViewAllBranches] = useState(false);
  const [restrictLeadsToOwn, setRestrictLeadsToOwn] = useState(false);

  useEffect(() => {
    if (editing) {
      setName(editing.name);
      setBranchId(editing.branchId ?? "");
      setPermissions({ ...emptyPermissions(), ...editing.permissions });
      setCanViewAllBranches(editing.canViewAllBranches);
      setRestrictLeadsToOwn(editing.restrictLeadsToOwn);
    } else {
      setName("");
      setBranchId(defaultBranchId ?? "");
      setPermissions(DEFAULT_PERMISSIONS);
      setCanViewAllBranches(false);
      setRestrictLeadsToOwn(false);
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
        { roleId: editing.id, payload: { name, permissions, canViewAllBranches, restrictLeadsToOwn } },
        { onSuccess: onClose }
      );
    } else {
      createRole.mutate(
        { name, branchId: branchId || null, permissions, canViewAllBranches, restrictLeadsToOwn },
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
          <Select label="Branch" value={branchId} onChange={(e) => setBranchId(e.target.value)}>
            <option value="">All branches (global role)</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </Select>
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
                  <div className="ml-0 rounded-md bg-gray-50 px-2.5 py-2">
                    <Toggle
                      label="Restrict to only leads assigned to me"
                      checked={restrictLeadsToOwn}
                      onChange={setRestrictLeadsToOwn}
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
