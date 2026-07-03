import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input, Select, Textarea } from "../common/Input";
import { Button } from "../common/Button";
import { financeFormSchema } from "../../schemas/enquiry.schema";
import type { FinanceFormValues, FinanceFormInput } from "../../schemas/enquiry.schema";
import { useSaveFinanceApplication } from "../../hooks/useEnquiry";
import { FINANCE_STATUSES } from "../../types";
import type { FinanceApplication } from "../../types";

export function FinanceForm({ enquiryId, existing }: { enquiryId: string; existing?: FinanceApplication | null }) {
  const saveFinance = useSaveFinanceApplication(enquiryId);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FinanceFormInput, unknown, FinanceFormValues>({
    resolver: zodResolver(financeFormSchema),
    defaultValues: {
      bankOrNbfc: existing?.bankOrNbfc ?? "",
      loanAmount: existing?.loanAmount ? String(existing.loanAmount) : undefined,
      status: existing?.status ?? "NOT_STARTED",
      rejectionReason: existing?.rejectionReason ?? "",
    },
  });

  const status = watch("status");

  const onSubmit = async (values: FinanceFormValues) => {
    await saveFinance.mutateAsync(values);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-gray-800">Finance Application</h3>
      <Input label="Bank / NBFC" error={errors.bankOrNbfc?.message} {...register("bankOrNbfc")} />
      <Input label="Loan Amount" type="number" step="0.01" error={errors.loanAmount?.message} {...register("loanAmount")} />
      <Select label="Status" error={errors.status?.message} {...register("status")}>
        {FINANCE_STATUSES.map((s) => (
          <option key={s} value={s}>
            {s.replaceAll("_", " ")}
          </option>
        ))}
      </Select>
      {status === "REJECTED" && (
        <Textarea label="Rejection Reason" error={errors.rejectionReason?.message} {...register("rejectionReason")} />
      )}
      <Button type="submit" isLoading={isSubmitting} className="w-fit">
        Save Finance Application
      </Button>
    </form>
  );
}
