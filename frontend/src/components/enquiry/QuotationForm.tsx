import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input, Select } from "../common/Input";
import { Button } from "../common/Button";
import { useEffect } from "react";
import { ExternalLink, Copy } from "lucide-react";
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
    watch,
    setValue,
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
    try {
      const payload = {
        ...values,
        validUntil: values.validUntil ? new Date(values.validUntil).toISOString() : undefined,
        pdfUrl: values.pdfUrl || undefined,
      };
      await saveQuotation.mutateAsync(payload);
      alert("Quotation successfully saved! You can now use the 'View Quote' and 'Copy Link' buttons at the top of the form.");
    } catch (err) {
      console.error(err);
      alert("Failed to save quotation. Please check your inputs.");
    }
  };

  const onRoadPrice = watch("onRoadPrice") as string;
  const discount = watch("discount") as string;

  useEffect(() => {
    if (onRoadPrice) {
      const price = parseFloat(onRoadPrice) || 0;
      const disc = parseFloat(discount || "0") || 0;
      const finalPrice = Math.max(0, price - disc);
      setValue("finalPrice", finalPrice.toFixed(2), { shouldValidate: true, shouldDirty: true });
    }
  }, [onRoadPrice, discount, setValue]);

  const quoteUrl = existing ? `${window.location.origin}/quote/${existing.id}` : "";

  const handleCopyLink = () => {
    navigator.clipboard.writeText(quoteUrl);
    alert("Quote link copied to clipboard!");
  };

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-800">Quotation</h3>
        {existing && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-200"
            >
              <Copy size={12} /> Copy Link
            </button>
            <a
              href={quoteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-1.5 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-100"
            >
              <ExternalLink size={12} /> View Quote
            </a>
          </div>
        )}
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
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
      <Input label="Final Price (Auto-calculated)" type="number" step="0.01" error={errors.finalPrice?.message} {...register("finalPrice")} readOnly className="bg-slate-50 cursor-not-allowed text-slate-500 font-semibold" />
      <Input label="Valid Until" type="date" {...register("validUntil")} />
      <Button type="submit" isLoading={isSubmitting} className="w-fit">
        {existing ? "Update Quotation" : "Generate Quotation"}
      </Button>
      </form>
    </div>
  );
}
