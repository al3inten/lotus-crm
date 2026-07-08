import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { vehicleModelFormSchema } from "../../schemas/vehicle.schema";
import type { VehicleModelFormValues } from "../../schemas/vehicle.schema";
import { Input } from "../common/Input";
import { Button } from "../common/Button";
import { useCreateVehicleModel } from "../../hooks/useVehicles";

export function VehicleModelForm({ onSuccess }: { onSuccess: () => void }) {
  const createModel = useCreateVehicleModel();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<VehicleModelFormValues>({ resolver: zodResolver(vehicleModelFormSchema) });

  const onSubmit = async (values: VehicleModelFormValues) => {
    await createModel.mutateAsync(values);
    reset();
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
      <Input label="Model Name" placeholder="e.g. CRETA" error={errors.name?.message} {...register("name")} />
      <Button type="submit" isLoading={isSubmitting}>
        Create Model
      </Button>
    </form>
  );
}
