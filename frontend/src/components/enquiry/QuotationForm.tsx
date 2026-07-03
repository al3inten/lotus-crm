import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input, Select } from "../common/Input";
import { Button } from "../common/Button";
import { quotationFormSchema } from "../../schemas/enquiry.schema";
import type { QuotationFormValues, QuotationFormInput } from "../../schemas/enquiry.schema";
import { useSaveQuotation } from "../../hooks/useEnquiry";
import { useBranchStaff } from "../../hooks/useUsers";
import type { Quotation } from "../../types";

export function QuotationForm({
  enquiryId,
  branchId,
  existing,
}: {
  enquiryId: string;
  branchId: string;
  existing?: Quotation | null;
}) {
  const saveQuotation = useSaveQuotation(enquiryId);
  const { data: consultants } = useBranchStaff(branchId, "CONSULTANT");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<QuotationFormInput, unknown, QuotationFormValues>({
    resolver: zodResolver(quotationFormSchema),
    defaultValues: {
      quotedById: existing?.quotedById ?? "",
      variant: existing?.variant ?? "",
      onRoadPrice: existing ? String(existing.onRoadPrice) : "",
      discount: existing?.discount ? String(existing.discount) : undefined,
      finalPrice: existing ? String(existing.finalPrice) : "",
    },
  });

  const onSubmit = async (values: QuotationFormValues) => {
    await saveQuotation.mutateAsync({ ...values, pdfUrl: values.pdfUrl || undefined });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-gray-800">Quotation</h3>
      <Select label="Quoted By" error={errors.quotedById?.message} {...register("quotedById")}>
        <option value="">Select consultant</option>
        {consultants?.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </Select>
      <Input label="Variant" {...register("variant")} />
      <Input label="On-Road Price" type="number" step="0.01" error={errors.onRoadPrice?.message} {...register("onRoadPrice")} />
      <Input label="Discount" type="number" step="0.01" error={errors.discount?.message} {...register("discount")} />
      <Input label="Final Price" type="number" step="0.01" error={errors.finalPrice?.message} {...register("finalPrice")} />
      <Input label="Valid Until" type="date" {...register("validUntil")} />
      <Input label="Quotation PDF URL (optional)" error={errors.pdfUrl?.message} {...register("pdfUrl")} />
      <Button type="submit" isLoading={isSubmitting} className="w-fit">
        Save Quotation
      </Button>
    </form>
  );
}
