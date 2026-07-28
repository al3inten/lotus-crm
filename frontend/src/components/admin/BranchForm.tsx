import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { branchFormSchema } from "../../schemas/branch.schema";
import type { BranchFormValues, BranchFormInput } from "../../schemas/branch.schema";
import { Input } from "../common/Input";
import { Button } from "../common/Button";
import { useCreateBranch } from "../../hooks/useBranches";

export function BranchForm({ onSuccess }: { onSuccess: () => void }) {
  const createBranch = useCreateBranch();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BranchFormInput, unknown, BranchFormValues>({
    resolver: zodResolver(branchFormSchema),
    defaultValues: { autoAssignEnabled: true },
  });

  const onSubmit = async (values: BranchFormValues) => {
    await createBranch.mutateAsync(values);
    reset();
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
      <Input label="Branch Name" error={errors.name?.message} {...register("name")} />
      <Input label="Branch Code" placeholder="HYU-CHN-01" error={errors.code?.message} {...register("code")} />
      <Input label="City" error={errors.city?.message} {...register("city")} />
      <Input label="Address (optional)" error={errors.address?.message} {...register("address")} />
      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input type="checkbox" defaultChecked {...register("autoAssignEnabled")} />
        Auto-assign digital leads (Meta/WhatsApp/Instagram) via round-robin
      </label>
      <Button type="submit" isLoading={isSubmitting}>
        Create Branch
      </Button>
    </form>
  );
}
