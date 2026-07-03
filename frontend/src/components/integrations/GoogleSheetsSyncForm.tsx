import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input, Select } from "../common/Input";
import { Button } from "../common/Button";
import { googleSheetSyncFormSchema } from "../../schemas/integration.schema";
import type { GoogleSheetSyncFormValues } from "../../schemas/integration.schema";
import { useSyncGoogleSheet } from "../../hooks/useIntegrations";
import { useBranches } from "../../hooks/useBranches";
import type { ImportSummary } from "../../api/integrations.api";
import { useState } from "react";

export function GoogleSheetsSyncForm() {
  const { data: branches } = useBranches();
  const syncSheet = useSyncGoogleSheet();
  const [summary, setSummary] = useState<ImportSummary | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<GoogleSheetSyncFormValues>({ resolver: zodResolver(googleSheetSyncFormSchema) });

  const onSubmit = async (values: GoogleSheetSyncFormValues) => {
    setSummary(null);
    const result = await syncSheet.mutateAsync(values);
    setSummary(result);
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <h3 className="mb-3 text-sm font-semibold text-gray-900">Sync from Google Sheets</h3>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
        <Input
          label="Sheet URL or ID"
          placeholder="https://docs.google.com/spreadsheets/d/..."
          error={errors.sheetUrl?.message}
          {...register("sheetUrl")}
        />
        <Input label="Tab / Range (optional)" placeholder="Sheet1" error={errors.sheetName?.message} {...register("sheetName")} />
        <Select label="Import into Branch" error={errors.branchId?.message} {...register("branchId")}>
          <option value="">Select branch</option>
          {branches?.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </Select>
        <Button type="submit" isLoading={isSubmitting} className="w-fit">
          Sync Now
        </Button>
      </form>

      {summary && (
        <div className="mt-3 rounded-md border border-gray-200 bg-gray-50 p-3 text-sm">
          <p>Total rows: {summary.totalRows}</p>
          <p className="text-green-700">Created: {summary.created}</p>
          <p className="text-amber-700">Merged into existing leads: {summary.merged}</p>
          <p className="text-red-700">Failed: {summary.failed}</p>
        </div>
      )}
    </div>
  );
}
