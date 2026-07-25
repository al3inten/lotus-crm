import { useState } from "react";
import { BadgeIndianRupee } from "lucide-react";
import clsx from "clsx";
import { DatePickerField } from "../common/DateTimePicker";
import { Switch } from "../common/Switch";
import { Button } from "../common/Button";
import { useUpdateBookingDetails } from "../../hooks/useEnquiry";
import type { Enquiry } from "../../types";

/** A compact Yes/No pair for the finance checklist. */
function YesNo({ label, checked, onChange, disabled }: { label: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-slate-700 dark:text-slate-200">{label}</span>
      <div className="flex overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
        {([["Yes", true], ["No", false]] as const).map(([text, val]) => (
          <button
            key={text}
            type="button"
            disabled={disabled}
            onClick={() => onChange(val)}
            className={clsx(
              "px-3 py-1 text-xs font-semibold transition-colors disabled:cursor-not-allowed",
              checked === val
                ? val
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-600 text-white"
                : "bg-white text-slate-500 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
            )}
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Booking-stage details: booking date plus the finance toggle and its three Yes/No checks.
 *  Read-only unless `editable`. */
export function BookingDetailsForm({
  enquiry,
  editable = true,
  lockedHint,
}: {
  enquiry: Enquiry;
  editable?: boolean;
  lockedHint?: string;
}) {
  const save = useUpdateBookingDetails(enquiry.id);

  const [bookedAt, setBookedAt] = useState<string>(enquiry.bookedAt ?? "");
  const [financeRequired, setFinanceRequired] = useState<boolean>(!!enquiry.financeRequired);
  const [docsCollected, setDocsCollected] = useState<boolean>(!!enquiry.financeDocumentCollected);
  const [loanApproved, setLoanApproved] = useState<boolean>(!!enquiry.financeLoanApproved);
  const [doReceived, setDoReceived] = useState<boolean>(!!enquiry.financeDoReceived);

  const onSave = async () => {
    await save.mutateAsync({
      bookedAt: bookedAt ? new Date(bookedAt).toISOString() : undefined,
      financeRequired,
      financeDocumentCollected: financeRequired ? docsCollected : undefined,
      financeLoanApproved: financeRequired ? loanApproved : undefined,
      financeDoReceived: financeRequired ? doReceived : undefined,
    });
  };

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
          <BadgeIndianRupee size={16} />
        </span>
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Booking Details</h3>
      </div>

      <fieldset disabled={!editable} className="m-0 flex flex-col gap-3 border-0 p-0 disabled:opacity-70">
        <DatePickerField label="Booking date" value={bookedAt} onChange={(v) => setBookedAt(v ?? "")} />

        <div className="flex flex-col gap-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 dark:border-emerald-500/25 dark:bg-emerald-500/10">
          <Switch
            checked={financeRequired}
            onChange={setFinanceRequired}
            label="Finance needed"
            description="Turn on if the customer is financing this purchase."
          />
          {financeRequired && (
            <div className="flex flex-col gap-2 border-t border-emerald-200 pt-3 dark:border-emerald-500/25">
              <YesNo label="Documents collected" checked={docsCollected} onChange={setDocsCollected} disabled={!editable} />
              <YesNo label="Loan approved" checked={loanApproved} onChange={setLoanApproved} disabled={!editable} />
              <YesNo label="DO received" checked={doReceived} onChange={setDoReceived} disabled={!editable} />
            </div>
          )}
        </div>
      </fieldset>

      {editable ? (
        <Button type="button" onClick={onSave} isLoading={save.isPending} className="w-fit">
          Save booking details
        </Button>
      ) : (
        lockedHint && <p className="text-xs font-medium text-slate-400 dark:text-slate-500">{lockedHint}</p>
      )}
    </div>
  );
}
