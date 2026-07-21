import { Check, ExternalLink, BellRing } from "lucide-react";
import type { useLeadLookup } from "../../../hooks/useLeads";

type LeadLookupResult = NonNullable<ReturnType<typeof useLeadLookup>["data"]>;

interface RepeatEnquiryBannerProps {
  lookupResult: LeadLookupResult | null | undefined;
  isComplete: boolean;
  alertResult: string | null;
  pushAlertPending: boolean;
  onNotify: () => void;
}

export function RepeatEnquiryBanner({
  lookupResult,
  isComplete,
  alertResult,
  pushAlertPending,
  onNotify,
}: RepeatEnquiryBannerProps) {
  if (!lookupResult || isComplete) return null;

  return (
    <div className="mb-5 flex flex-col gap-2">
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-500/20 dark:bg-emerald-500/10">
        <p className="flex items-center gap-2 text-sm font-medium text-emerald-800 dark:text-emerald-300">
          <Check size={16} /> Customer found! Existing details have been auto-filled.
        </p>
      </div>
      {lookupResult.hasActiveEnquiry && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-500/20 dark:bg-amber-500/10">
          <p className="text-sm text-amber-800 dark:text-amber-300">
            <span className="font-bold">Active enquiry detected:</span> this customer currently has an active
            enquiry in the{" "}
            <span className="font-semibold">{lookupResult.activeEnquiryStatus?.replaceAll("_", " ")}</span>{" "}
            stage. Saving this form will attach this contact to their existing enquiry unless you check
            "Force new enquiry" in step 1.
          </p>
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            {lookupResult.activeEnquiryId && (
              <a
                href={`/leads/${lookupResult.leadId}/enquiries/${lookupResult.activeEnquiryId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-amber-800 transition-colors hover:bg-amber-100 dark:border-amber-500/30 dark:bg-transparent dark:text-amber-200 dark:hover:bg-amber-500/10"
              >
                <ExternalLink size={13} /> View previous enquiry
              </a>
            )}
            <button
              type="button"
              onClick={onNotify}
              disabled={pushAlertPending || !!alertResult}
              className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-2.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <BellRing size={13} /> {pushAlertPending ? "Notifying…" : "Notify CR & manager"}
            </button>
            {alertResult && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                <Check size={13} /> {alertResult}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
