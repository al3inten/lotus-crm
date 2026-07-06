import type { ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CheckCircle2,
  GitMerge,
  XCircle,
  ListChecks,
  AlertTriangle,
  FileSpreadsheet,
  Building2,
  PartyPopper,
} from "lucide-react";
import { Input, Select } from "../common/Input";
import { Button } from "../common/Button";
import { Modal } from "../common/Modal";
import { googleSheetSyncFormSchema } from "../../schemas/integration.schema";
import type { GoogleSheetSyncFormValues } from "../../schemas/integration.schema";
import { useSyncGoogleSheet } from "../../hooks/useIntegrations";
import { useBranches } from "../../hooks/useBranches";
import type { ImportSummary } from "../../api/integrations.api";
import { useState } from "react";

interface SyncResult {
  summary: ImportSummary;
  branchName: string;
}

function StatTile({
  icon,
  label,
  value,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  tone: "blue" | "green" | "amber" | "red";
}) {
  const toneClasses = {
    blue: "bg-blue-50 text-blue-700",
    green: "bg-green-50 text-green-700",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-red-50 text-red-700",
  }[tone];

  return (
    <div className={`flex flex-col items-center gap-1 rounded-lg p-3 ${toneClasses}`}>
      {icon}
      <span className="text-xl font-semibold">{value}</span>
      <span className="text-xs font-medium">{label}</span>
    </div>
  );
}

export function GoogleSheetsSyncForm() {
  const { data: branches } = useBranches();
  const syncSheet = useSyncGoogleSheet();
  const [result, setResult] = useState<SyncResult | null>(null);
  const [errorModalMsg, setErrorModalMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<GoogleSheetSyncFormValues>({ resolver: zodResolver(googleSheetSyncFormSchema) });

  const onSubmit = async (values: GoogleSheetSyncFormValues) => {
    try {
      const summary = await syncSheet.mutateAsync(values);
      const branchName = branches?.find((b) => b.id === values.branchId)?.name ?? "Selected branch";
      setResult({ summary, branchName });
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "An unknown error occurred while syncing from Google Sheets.";
      setErrorModalMsg(msg);
    }
  };

  const allSucceeded = result ? result.summary.failed === 0 : false;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <div className="mb-4 flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-50 text-green-700">
          <FileSpreadsheet size={18} />
        </span>
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Sync from Google Sheets</h3>
          <p className="text-xs text-gray-500">Pull rows from a connected sheet straight into your leads.</p>
        </div>
      </div>

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

      <Modal isOpen={result !== null} onClose={() => setResult(null)} title="Sync Complete">
        {result && (
          <div className="flex flex-col gap-4">
            <div
              className={`flex items-center gap-2 rounded-lg p-3 text-sm font-medium ${
                allSucceeded ? "bg-green-50 text-green-800" : "bg-amber-50 text-amber-800"
              }`}
            >
              {allSucceeded ? <PartyPopper size={16} /> : <AlertTriangle size={16} />}
              {allSucceeded
                ? "All rows synced successfully."
                : `${result.summary.failed} of ${result.summary.totalRows} row(s) needs attention.`}
            </div>

            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Building2 size={14} />
              Synced into <span className="font-semibold text-gray-700">{result.branchName}</span>
            </div>

            <div className="grid grid-cols-4 gap-2">
              <StatTile icon={<ListChecks size={18} />} label="Total Rows" value={result.summary.totalRows} tone="blue" />
              <StatTile icon={<CheckCircle2 size={18} />} label="Created" value={result.summary.created} tone="green" />
              <StatTile icon={<GitMerge size={18} />} label="Merged" value={result.summary.merged} tone="amber" />
              <StatTile icon={<XCircle size={18} />} label="Failed" value={result.summary.failed} tone="red" />
            </div>

            {result.summary.errors.length > 0 && (
              <div className="rounded-lg border border-red-100 bg-red-50 p-3">
                <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-red-800">
                  <AlertTriangle size={14} />
                  Rows that failed
                </p>
                <ul className="max-h-40 space-y-1 overflow-y-auto text-xs text-red-700">
                  {result.summary.errors.map((e) => (
                    <li key={e.row}>
                      Row {e.row}: {e.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex justify-end">
              <Button variant="secondary" onClick={() => setResult(null)}>
                Done
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={errorModalMsg !== null} onClose={() => setErrorModalMsg(null)} title="Sync Failed">
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3 rounded-lg bg-red-50 p-4 text-sm text-red-800">
            <AlertTriangle size={20} className="mt-0.5 shrink-0 text-red-600" />
            <p>{errorModalMsg}</p>
          </div>
          <div className="mt-2 flex justify-end">
            <Button onClick={() => setErrorModalMsg(null)}>Close</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
