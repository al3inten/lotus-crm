import { useState } from "react";
import { PackageCheck } from "lucide-react";
import { DatePickerField } from "../common/DateTimePicker";
import { Button } from "../common/Button";
import { useUpdateDeliveryDate } from "../../hooks/useEnquiry";
import type { Enquiry } from "../../types";

/** Corrects the delivery date once the enquiry is Delivered. The date is still mandatory to
 *  REACH Delivered (asked in the Update Status popup) — this card is only for fixing it
 *  afterward, since Delivered is a terminal stage with no later transition to defer it to.
 *  Read-only unless `editable`. */
export function DeliveryDateCard({
  enquiry,
  editable = true,
  lockedHint,
}: {
  enquiry: Enquiry;
  editable?: boolean;
  lockedHint?: string;
}) {
  const save = useUpdateDeliveryDate(enquiry.id);
  const [deliveredAt, setDeliveredAt] = useState<string>(enquiry.deliveredAt ?? "");

  const onSave = async () => {
    await save.mutateAsync({
      deliveredAt: deliveredAt ? new Date(deliveredAt).toISOString() : undefined,
    });
  };

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-500/15 dark:text-primary-400">
          <PackageCheck size={16} />
        </span>
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Delivery Details</h3>
      </div>

      <fieldset disabled={!editable} className="m-0 flex flex-col gap-3 border-0 p-0 disabled:opacity-70">
        <DatePickerField label="Vehicle delivery date" value={deliveredAt} onChange={(v) => setDeliveredAt(v ?? "")} />
      </fieldset>

      {editable ? (
        <Button type="button" onClick={onSave} isLoading={save.isPending} className="w-fit">
          Save delivery date
        </Button>
      ) : (
        lockedHint && <p className="text-xs font-medium text-slate-400 dark:text-slate-500">{lockedHint}</p>
      )}
    </div>
  );
}
