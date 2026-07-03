import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input, Textarea } from "../common/Input";
import { Button } from "../common/Button";
import { deliveryFormSchema } from "../../schemas/enquiry.schema";
import type { DeliveryFormValues } from "../../schemas/enquiry.schema";
import { useSaveDeliveryDetails } from "../../hooks/useEnquiry";
import type { DeliveryDetails } from "../../types";

export function DeliveryForm({ enquiryId, existing }: { enquiryId: string; existing?: DeliveryDetails | null }) {
  const saveDelivery = useSaveDeliveryDetails(enquiryId);

  const { register, handleSubmit, formState: { isSubmitting } } = useForm<DeliveryFormValues>({
    resolver: zodResolver(deliveryFormSchema),
    defaultValues: {
      rcTransferDone: existing?.rcTransferDone ?? false,
      insuranceDone: existing?.insuranceDone ?? false,
      accessoriesFitted: existing?.accessoriesFitted ?? false,
      notes: existing?.notes ?? "",
    },
  });

  const onSubmit = async (values: DeliveryFormValues) => {
    await saveDelivery.mutateAsync(values);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-gray-800">Delivery</h3>
      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input type="checkbox" {...register("rcTransferDone")} /> RC Transfer Done
      </label>
      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input type="checkbox" {...register("insuranceDone")} /> Insurance Done
      </label>
      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input type="checkbox" {...register("accessoriesFitted")} /> Accessories Fitted
      </label>
      <Input label="Delivery Date" type="date" {...register("deliveryDate")} />
      <Input label="Delivered At" type="datetime-local" {...register("deliveredAt")} />
      <Textarea label="Notes" {...register("notes")} />
      <Button type="submit" isLoading={isSubmitting} className="w-fit">
        Save Delivery Details
      </Button>
    </form>
  );
}
