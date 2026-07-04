import { useEffect, useState } from "react";
import { Modal } from "../common/Modal";
import { Input, Select } from "../common/Input";
import { Button } from "../common/Button";
import { Toggle } from "../common/Toggle";
import { MODULES } from "../../types";
import type { ModuleKey, RoleDefinition, Branch } from "../../types";
import { useCreateRole, useUpdateRole } from "../../hooks/useRoles";

const BASE_ROLES = [
  { value: "BRANCH_MANAGER", label: "Manager level (can manage branch staff & reports)" },
  { value: "CR_TEAM", label: "CR Team level (handles leads & follow-ups)" },
  { value: "CONSULTANT", label: "Consultant level (test drives & sales)" },
  { value: "ADMIN", label: "Admin level (full access except user admin)" },
] as const;

const DEFAULT_PERMISSIONS: ModuleKey[] = ["dashboard", "leads"];

interface RoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  branches: Branch[];
  /** When set, the modal edits this role instead of creating a new one. */
  editing?: RoleDefinition | null;
  defaultBranchId?: string;
}

export function RoleModal({ isOpen, onClose, branches, editing, defaultBranchId }: RoleModalProps) {
  const createRole = useCreateRole();
  const updateRole = useUpdateRole();

  const [name, setName] = useState("");
  const [branchId, setBranchId] = useState<string>("");
  const [baseRole, setBaseRole] = useState<(typeof BASE_ROLES)[number]["value"]>("CR_TEAM");
  const [permissions, setPermissions] = useState<Set<ModuleKey>>(new Set(DEFAULT_PERMISSIONS));

  useEffect(() => {
    if (editing) {
      setName(editing.name);
      setBranchId(editing.branchId ?? "");
      setBaseRole(editing.baseRole as typeof baseRole);
      setPermissions(new Set(editing.permissions));
    } else {
      setName("");
      setBranchId(defaultBranchId ?? "");
      setBaseRole("CR_TEAM");
      setPermissions(new Set(DEFAULT_PERMISSIONS));
    }
  }, [editing, defaultBranchId, isOpen]);

  const togglePermission = (key: ModuleKey, on: boolean) => {
    setPermissions((prev) => {
      const next = new Set(prev);
      if (on) next.add(key);
      else next.delete(key);
      return next;
    });
  };

  const isPending = createRole.isPending || updateRole.isPending;
  const isError = createRole.isError || updateRole.isError;

  const handleSubmit = () => {
    const perms = Array.from(permissions);
    if (!name || perms.length === 0) return;
    if (editing) {
      updateRole.mutate({ roleId: editing.id, payload: { name, permissions: perms } }, { onSuccess: onClose });
    } else {
      createRole.mutate({ name, branchId: branchId || null, baseRole, permissions: perms }, { onSuccess: onClose });
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
        />

        {!editing && (
          <>
            <Select label="Branch" value={branchId} onChange={(e) => setBranchId(e.target.value)}>
              <option value="">All branches (global role)</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </Select>

            <Select label="Access Level" value={baseRole} onChange={(e) => setBaseRole(e.target.value as typeof baseRole)}>
              {BASE_ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </Select>
            <p className="-mt-2 text-xs text-gray-500">
              Access level controls what actions the backend permits; the toggles below control what appears in
              their sidebar.
            </p>
          </>
        )}

        <div>
          <p className="mb-2 text-sm font-medium text-gray-800">Dashboard Modules</p>
          <div className="flex flex-col gap-2.5 rounded-lg border border-gray-200 p-3">
            {MODULES.map((module) => (
              <Toggle
                key={module.key}
                label={module.label}
                checked={permissions.has(module.key)}
                onChange={(on) => togglePermission(module.key, on)}
              />
            ))}
          </div>
        </div>

        {isError && <p className="text-sm text-red-600">Failed to save role — a role with this name may already exist.</p>}

        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button isLoading={isPending} disabled={!name || permissions.size === 0} onClick={handleSubmit}>
            {editing ? "Save Changes" : "Create Role"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
