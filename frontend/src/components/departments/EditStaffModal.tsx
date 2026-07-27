import { useEffect, useState } from "react";
import { Modal } from "../common/Modal";
import { Input } from "../common/Input";
import { Button } from "../common/Button";
import { Toggle } from "../common/Toggle";
import { useUpdateUser } from "../../hooks/useUsers";
import { useRoles } from "../../hooks/useRoles";
import type { User } from "../../types";

const BASE_ROLE_OPTIONS = [
  { value: "CR_TEAM", label: "CR Team Member" },
  { value: "CONSULTANT", label: "Consultant" },
  { value: "BRANCH_MANAGER", label: "Branch Manager" },
] as const;

interface EditStaffModalProps {
  member: User;
  branchId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function EditStaffModal({ member, branchId, isOpen, onClose }: EditStaffModalProps) {
  const updateUser = useUpdateUser();
  const { data: roles } = useRoles(branchId);

  const [name, setName] = useState(member.name);
  const [email, setEmail] = useState(member.email);
  const [phone, setPhone] = useState(member.phone ?? "");
  const [roleChoice, setRoleChoice] = useState<string>(
    member.roleDefinition ? `custom:${member.roleDefinition.id}` : member.role
  );
  const [newPassword, setNewPassword] = useState("");
  const [isActive, setIsActive] = useState(member.isActive);

  useEffect(() => {
    setName(member.name);
    setEmail(member.email);
    setPhone(member.phone ?? "");
    setRoleChoice(member.roleDefinition ? `custom:${member.roleDefinition.id}` : member.role);
    setNewPassword("");
    setIsActive(member.isActive);
  }, [member, isOpen]);

  const activeRoles = roles?.filter((r) => r.isActive) ?? [];
  const isCustomRole = roleChoice.startsWith("custom:");

  const handleSave = () => {
    updateUser.mutate(
      {
        userId: member.id,
        payload: {
          name,
          email,
          phone: phone || undefined,
          role: isCustomRole ? undefined : (roleChoice as "CR_TEAM" | "CONSULTANT" | "BRANCH_MANAGER"),
          roleDefinitionId: isCustomRole ? roleChoice.slice("custom:".length) : null,
          password: newPassword || undefined,
          isActive,
        },
      },
      { onSuccess: onClose }
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Edit — ${member.name}`}>
      <div className="flex flex-col gap-3">
        <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input label="Phone" placeholder="+91XXXXXXXXXX" value={phone} onChange={(e) => setPhone(e.target.value)} />

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-gray-700">Role</span>
          <select
            value={roleChoice}
            onChange={(e) => setRoleChoice(e.target.value)}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <optgroup label="Standard roles">
              {BASE_ROLE_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </optgroup>
            {activeRoles.length > 0 && (
              <optgroup label="Custom roles">
                {activeRoles.map((r) => (
                  <option key={r.id} value={`custom:${r.id}`}>
                    {r.name} {r.branch ? `— ${r.branch.name}` : "— all branches"}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
        </label>

        <Input
          label="Reset Password (leave blank to keep current)"
          type="password"
          placeholder="Min 8 characters"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />

        <div className="rounded-lg border border-gray-200 p-3">
          <Toggle
            label="Active"
            description="Inactive members can't log in and won't receive new leads"
            checked={isActive}
            onChange={setIsActive}
          />
        </div>

        {updateUser.isError && (
          <p className="text-sm text-red-600">Failed to save — the email may already be in use.</p>
        )}

        <div className="mt-1 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button isLoading={updateUser.isPending} disabled={!name || !email || (newPassword.length > 0 && newPassword.length < 8)} onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      </div>
    </Modal>
  );
}
