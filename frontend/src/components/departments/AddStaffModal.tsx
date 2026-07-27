import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal } from "../common/Modal";
import { Input } from "../common/Input";
import { Button } from "../common/Button";
import { branchStaffFormSchema } from "../../schemas/user.schema";
import type { BranchStaffFormValues } from "../../schemas/user.schema";
import { useCreateBranchStaff } from "../../hooks/useUsers";
import { useRoles } from "../../hooks/useRoles";
import { useStaffDepartments } from "../../hooks/useStaffDepartments";

interface AddStaffModalProps {
  branchId: string;
  isOpen: boolean;
  onClose: () => void;
}

const BASE_ROLE_OPTIONS = [
  { value: "CR_TEAM", label: "CR Team Member" },
  { value: "CONSULTANT", label: "Consultant" },
  { value: "BRANCH_MANAGER", label: "Branch Manager" },
] as const;

export function AddStaffModal({ branchId, isOpen, onClose }: AddStaffModalProps) {
  const createStaff = useCreateBranchStaff(branchId);
  const { data: roles } = useRoles(branchId);
  // Only fetch this branch's departments while the modal is actually open.
  const { data: departments } = useStaffDepartments(branchId, isOpen);
  const [roleChoice, setRoleChoice] = useState<string>("CR_TEAM");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BranchStaffFormValues>({ resolver: zodResolver(branchStaffFormSchema) });

  const activeRoles = roles?.filter((r) => r.isActive) ?? [];
  const activeDepartments = departments?.filter((d) => d.isActive) ?? [];
  const hasDepartments = activeDepartments.length > 0;

  const onSubmit = (values: BranchStaffFormValues) => {
    const isCustomRole = roleChoice.startsWith("custom:");
    createStaff.mutate(
      {
        ...values,
        role: isCustomRole ? undefined : (roleChoice as "CR_TEAM" | "CONSULTANT" | "BRANCH_MANAGER"),
        roleDefinitionId: isCustomRole ? roleChoice.slice("custom:".length) : undefined,
      },
      {
        onSuccess: () => {
          reset({ name: "", email: "", phone: "", password: "", staffDepartmentId: "" });
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
              <optgroup label="Custom roles (with permission toggles)">
                {activeRoles.map((r) => (
                  <option key={r.id} value={`custom:${r.id}`}>
                    {r.name} {r.branch ? `— ${r.branch.name}` : "— all branches"}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-gray-700">
            Department <span className="text-red-500">*</span>
          </span>
          <select
            {...register("staffDepartmentId")}
            disabled={!hasDepartments}
            defaultValue=""
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:cursor-not-allowed disabled:bg-gray-100"
          >
            <option value="" disabled>
              {hasDepartments ? "Select a department…" : "No departments in this branch yet"}
            </option>
            {activeDepartments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
          {errors.staffDepartmentId && (
            <span className="text-xs text-red-600">{errors.staffDepartmentId.message}</span>
          )}
          {!hasDepartments && (
            <span className="text-xs text-amber-600">
              Create a department for this branch first — every employee must belong to one.
            </span>
          )}
        </label>

        <Input label="Temporary Password" type="password" placeholder="Min 8 characters" error={errors.password?.message} {...register("password")} />

        {createStaff.isError && (
          <p className="text-sm text-red-600">Failed to add — this email may already be in use.</p>
        )}

        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={createStaff.isPending}>
            Add Member
          </Button>
        </div>
      </form>
    </Modal>
  );
}
