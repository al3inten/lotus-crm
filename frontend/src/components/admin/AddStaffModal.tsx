import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal } from "../common/Modal";
import { Input } from "../common/Input";
import { Button } from "../common/Button";
import { Toggle } from "../common/Toggle";
import { branchStaffFormSchema } from "../../schemas/user.schema";
import type { BranchStaffFormValues } from "../../schemas/user.schema";
import { useCreateBranchStaff } from "../../hooks/useUsers";
import { useRoles } from "../../hooks/useRoles";

interface AddStaffModalProps {
  branchId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function AddStaffModal({ branchId, isOpen, onClose }: AddStaffModalProps) {
  const createStaff = useCreateBranchStaff(branchId);
  const { data: roles } = useRoles(branchId);
  const activeRoles = roles?.filter((r) => r.isActive) ?? [];
  const [roleDefinitionId, setRoleDefinitionId] = useState<string>("");
  const [isCr, setIsCr] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BranchStaffFormValues>({ resolver: zodResolver(branchStaffFormSchema) });

  const onSubmit = (values: BranchStaffFormValues) => {
    if (!roleDefinitionId) return;
    createStaff.mutate(
      { ...values, roleDefinitionId, isCr },
      {
        onSuccess: () => {
          reset({ name: "", email: "", phone: "", password: "" });
          setRoleDefinitionId("");
          setIsCr(false);
          onClose();
        },
      }
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Team Member">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
        <Input label="Name" placeholder="Full name" error={errors.name?.message} {...register("name")} />
        <Input label="Email" type="email" placeholder="name@dealership.com" error={errors.email?.message} {...register("email")} />
        <Input label="Phone (optional)" placeholder="+91XXXXXXXXXX" error={errors.phone?.message} {...register("phone")} />

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-gray-700">Role</span>
          <select
            value={roleDefinitionId}
            onChange={(e) => setRoleDefinitionId(e.target.value)}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Select a role…</option>
            {activeRoles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} {r.branch ? `— ${r.branch.name}` : "— all branches"}
              </option>
            ))}
          </select>
        </label>

        <div className="rounded-lg border border-gray-200 p-3">
          <Toggle
            label="Also consider as CR"
            description="Lets this person appear in the CR-assignment dropdown, on top of their role's permissions"
            checked={isCr}
            onChange={setIsCr}
          />
        </div>

        <Input label="Temporary Password" type="password" placeholder="Min 8 characters" error={errors.password?.message} {...register("password")} />

        {createStaff.isError && (
          <p className="text-sm text-red-600">Failed to add — this email may already be in use.</p>
        )}

        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={createStaff.isPending} disabled={!roleDefinitionId}>
            Add Member
          </Button>
        </div>
      </form>
    </Modal>
  );
}
