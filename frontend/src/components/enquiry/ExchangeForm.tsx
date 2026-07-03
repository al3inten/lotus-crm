import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input, Select } from "../common/Input";
import { Button } from "../common/Button";
import { exchangeFormSchema } from "../../schemas/enquiry.schema";
import type { ExchangeFormValues, ExchangeFormInput } from "../../schemas/enquiry.schema";
import { useSaveExchangeEvaluation } from "../../hooks/useEnquiry";
import { useBranchStaff } from "../../hooks/useUsers";
import type { ExchangeEvaluation } from "../../types";

export function ExchangeForm({
  enquiryId,
  branchId,
  existing,
}: {
  enquiryId: string;
  branchId: string;
  existing?: ExchangeEvaluation | null;
}) {
  const saveEvaluation = useSaveExchangeEvaluation(enquiryId);
  const { data: staff } = useBranchStaff(branchId);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ExchangeFormInput, unknown, ExchangeFormValues>({
    resolver: zodResolver(exchangeFormSchema),
    defaultValues: {
      oldCarMake: existing?.oldCarMake ?? "",
      oldCarModel: existing?.oldCarModel ?? "",
      oldCarYear: existing ? String(existing.oldCarYear) : "",
      oldCarKms: existing ? String(existing.oldCarKms) : "",
      oldCarCondition: existing?.oldCarCondition ?? "",
      valuationAmount: existing ? String(existing.valuationAmount) : "",
      evaluatedById: existing?.evaluatedById ?? "",
    },
  });

  const onSubmit = async (values: ExchangeFormValues) => {
    await saveEvaluation.mutateAsync(values);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-gray-800">Exchange (Old Car) Evaluation</h3>
      <Input label="Old Car Make" error={errors.oldCarMake?.message} {...register("oldCarMake")} />
      <Input label="Old Car Model" error={errors.oldCarModel?.message} {...register("oldCarModel")} />
      <Input label="Old Car Year" type="number" error={errors.oldCarYear?.message} {...register("oldCarYear")} />
      <Input label="Old Car KMs" type="number" error={errors.oldCarKms?.message} {...register("oldCarKms")} />
      <Input label="Condition Notes" {...register("oldCarCondition")} />
      <Input
        label="Valuation Amount"
        type="number"
        step="0.01"
        error={errors.valuationAmount?.message}
        {...register("valuationAmount")}
      />
      <Select label="Evaluated By" error={errors.evaluatedById?.message} {...register("evaluatedById")}>
        <option value="">Select evaluator</option>
        {staff?.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </Select>
      <Button type="submit" isLoading={isSubmitting} className="w-fit">
        Save Evaluation
      </Button>
    </form>
  );
}
