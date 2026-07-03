import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal } from "../common/Modal";
import { Input } from "../common/Input";
import { Button } from "../common/Button";
import { branchStaffFormSchema } from "../../schemas/user.schema";
import type { BranchStaffFormValues } from "../../schemas/user.schema";
import { useCreateBranchStaff } from "../../hooks/useUsers";

interface AddStaffModalProps {
  branchId: string;
  role: "CONSULTANT" | "CR_TEAM";
  isOpen: boolean;
  onClose: () => void;
}

const ROLE_LABEL: Record<AddStaffModalProps["role"], string> = {
  CONSULTANT: "Consultant",
  CR_TEAM: "CR Team Member",
};

export function AddStaffModal({ branchId, role, isOpen, onClose }: AddStaffModalProps) {
  const createStaff = useCreateBranchStaff(branchId);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BranchStaffFormValues>({
    resolver: zodResolver(branchStaffFormSchema),
    defaultValues: { role },
  });

  const onSubmit = async (values: BranchStaffFormValues) => {
    await createStaff.mutateAsync({ ...values, role });
    reset({ role, name: "", email: "", phone: "", password: "" });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Add ${ROLE_LABEL[role]}`}>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
        <Input label="Name" error={errors.name?.message} {...register("name")} />
        <Input label="Email" type="email" error={errors.email?.message} {...register("email")} />
        <Input label="Phone (optional)" error={errors.phone?.message} {...register("phone")} />
        <Input label="Temporary Password" type="password" error={errors.password?.message} {...register("password")} />
        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Add {ROLE_LABEL[role]}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
