import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { DatePickerField } from "../common/DateTimePicker";
import { Button } from "../common/Button";
import { useUpdateRetailDetails } from "../../hooks/useEnquiry";
import type { Enquiry } from "../../types";

/** Retail-stage details: just the retail completion date. Read-only unless `editable`. */
export function RetailDetailsForm({
  enquiry,
  editable = true,
  lockedHint,
}: {
  enquiry: Enquiry;
  editable?: boolean;
  lockedHint?: string;
}) {
  const save = useUpdateRetailDetails(enquiry.id);
  const [retailDoneAt, setRetailDoneAt] = useState<string>(enquiry.retailDoneAt ?? "");

  const onSave = async () => {
    await save.mutateAsync({
      retailDoneAt: retailDoneAt ? new Date(retailDoneAt).toISOString() : undefined,
    });
  };

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-600 dark:bg-teal-500/15 dark:text-teal-400">
          <CheckCircle2 size={16} />
        </span>
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Retail Details</h3>
      </div>

      <fieldset disabled={!editable} className="m-0 flex flex-col gap-3 border-0 p-0 disabled:opacity-70">
        <DatePickerField label="Retail date" value={retailDoneAt} onChange={(v) => setRetailDoneAt(v ?? "")} />
      </fieldset>

      {editable ? (
        <Button type="button" onClick={onSave} isLoading={save.isPending} className="w-fit">
          Save retail details
        </Button>
      ) : (
        lockedHint && <p className="text-xs font-medium text-slate-400 dark:text-slate-500">{lockedHint}</p>
      )}
    </div>
  );
}
