import type { ReactNode } from "react";
import { useState } from "react";
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

interface SyncResult {
  summary: ImportSummary;
  branchName: string;
}

const TONE_CLASSES = {
  blue: "bg-primary-50 text-primary-700 dark:bg-primary-500/10 dark:text-primary-300",
  green: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
  amber: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
  red: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300",
};

function StatTile({
  icon,
  label,
  value,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  tone: keyof typeof TONE_CLASSES;
}) {
  return (
    <div className={`flex flex-col items-center gap-1 rounded-xl p-3 ${TONE_CLASSES[tone]}`}>
      {icon}
      <span className="text-xl font-semibold tabular-nums">{value}</span>
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
    <>
      <div className="mb-5 flex items-start gap-3 rounded-xl bg-emerald-50 p-3.5 dark:bg-emerald-500/10">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-emerald-600 shadow-sm dark:bg-slate-900 dark:text-emerald-400">
          <FileSpreadsheet size={18} />
        </span>
        <p className="text-xs leading-relaxed text-emerald-800 dark:text-emerald-200">
          Pull rows from a connected Google Sheet straight into your leads — new rows create leads, matching
          contacts merge into their existing enquiry.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
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
        <Button type="submit" isLoading={isSubmitting} className="mt-1 w-fit">
          Sync Now
        </Button>
      </form>

      <Modal isOpen={result !== null} onClose={() => setResult(null)} title="Sync Complete">
        {result && (
          <div className="flex flex-col gap-4">
            <div
              className={`flex items-center gap-2 rounded-xl p-3 text-sm font-medium ${
                allSucceeded
                  ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300"
                  : "bg-amber-50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300"
              }`}
            >
              {allSucceeded ? <PartyPopper size={16} /> : <AlertTriangle size={16} />}
              {allSucceeded
                ? "All rows synced successfully."
                : `${result.summary.failed} of ${result.summary.totalRows} row(s) needs attention.`}
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <Building2 size={14} />
              Synced into <span className="font-semibold text-slate-700 dark:text-slate-300">{result.branchName}</span>
            </div>

            <div className="grid grid-cols-4 gap-2">
              <StatTile icon={<ListChecks size={18} />} label="Total Rows" value={result.summary.totalRows} tone="blue" />
              <StatTile icon={<CheckCircle2 size={18} />} label="Created" value={result.summary.created} tone="green" />
              <StatTile icon={<GitMerge size={18} />} label="Merged" value={result.summary.merged} tone="amber" />
              <StatTile icon={<XCircle size={18} />} label="Failed" value={result.summary.failed} tone="red" />
            </div>

            {result.summary.errors.length > 0 && (
              <div className="rounded-xl border border-rose-100 bg-rose-50 p-3 dark:border-rose-500/20 dark:bg-rose-500/10">
                <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-rose-800 dark:text-rose-300">
                  <AlertTriangle size={14} />
                  Rows that failed
                </p>
                <ul className="max-h-40 space-y-1 overflow-y-auto text-xs text-rose-700 dark:text-rose-300/90">
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
          <div className="flex items-start gap-3 rounded-xl bg-rose-50 p-4 text-sm text-rose-800 dark:bg-rose-500/10 dark:text-rose-300">
            <AlertTriangle size={20} className="mt-0.5 shrink-0 text-rose-600 dark:text-rose-400" />
            <p>{errorModalMsg}</p>
          </div>
          <div className="mt-2 flex justify-end">
            <Button onClick={() => setErrorModalMsg(null)}>Close</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
