import { Ban, CircleSlash, Flag } from "lucide-react";
import clsx from "clsx";
import type { EnquiryStatus, LossReason, CloseReason } from "../../types";
import { LOST_REASON_LABELS, CLOSE_REASON_LABELS } from "../../types";

/** Below the main 7-stage track: either the terminal off-ramp this enquiry actually took
 * (Lost / Closed Temporarily / the deprecated Closed status), or — while the enquiry is
 * still active — two small exit actions so Lost/Closed Temp don't require opening the
 * current stage's panel first. Delegates to the same onStageClick → StatusChangeModal
 * flow as every other status change; no new validation here. */
export function OffRampPills({
  status,
  lossReason,
  closeReason,
  canMarkLost,
  canCloseTemp,
  onSelect,
}: {
  status: EnquiryStatus;
  lossReason?: LossReason | null;
  closeReason?: CloseReason | null;
  canMarkLost: boolean;
  canCloseTemp: boolean;
  onSelect?: (status: EnquiryStatus) => void;
}) {
  if (status === "LOST") {
    // Only 2 of the full LossReason enum's values are still offered from the UI — the rest
    // are historical rows, so fall back to a readable version of the raw value for those.
    const lossReasonLabel = lossReason
      ? LOST_REASON_LABELS[lossReason as keyof typeof LOST_REASON_LABELS] ?? lossReason.replaceAll("_", " ").toLowerCase()
      : undefined;
    return (
      <div className="mt-3 flex items-center gap-2">
        <span
          className="group relative inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1.5 text-[12px] font-semibold text-red-800 dark:bg-red-500/15 dark:text-red-300"
          title={lossReasonLabel}
        >
          <Ban size={13} strokeWidth={2.25} />
          Lost{lossReasonLabel && ` · ${lossReasonLabel}`}
        </span>
      </div>
    );
  }

  if (status === "CLOSED_TEMP") {
    return (
      <div className="mt-3 flex items-center gap-2">
        <span
          className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1.5 text-[12px] font-semibold text-amber-800 dark:bg-amber-500/15 dark:text-amber-300"
          title={closeReason ? CLOSE_REASON_LABELS[closeReason] ?? closeReason : undefined}
        >
          <CircleSlash size={13} strokeWidth={2.25} />
          Closed Temporarily{closeReason && ` · ${CLOSE_REASON_LABELS[closeReason] ?? closeReason}`}
        </span>
      </div>
    );
  }

  // CLOSED is a deprecated legacy status — some old rows still carry it. Render it as an
  // inert grey pill so it's visible without implying any action is possible.
  if ((status as string) === "CLOSED") {
    return (
      <div className="mt-3 flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-[12px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
          Closed (legacy)
        </span>
      </div>
    );
  }

  if (!canMarkLost && !canCloseTemp) return null;

  return (
    <div className="mt-3 flex items-center gap-2">
      {canCloseTemp && (
        <button
          type="button"
          onClick={() => onSelect?.("CLOSED_TEMP")}
          className={clsx(
            "inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-white px-3 py-1.5 text-[12px] font-medium text-amber-700 transition-colors hover:bg-amber-50",
            "dark:border-amber-500/30 dark:bg-slate-900 dark:text-amber-400 dark:hover:bg-amber-500/10"
          )}
        >
          <Flag size={13} />
          Close Temporarily
        </button>
      )}
      {canMarkLost && (
        <button
          type="button"
          onClick={() => onSelect?.("LOST")}
          className={clsx(
            "inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-white px-3 py-1.5 text-[12px] font-medium text-red-700 transition-colors hover:bg-red-50",
            "dark:border-red-500/30 dark:bg-slate-900 dark:text-red-400 dark:hover:bg-red-500/10"
          )}
        >
          <Ban size={13} />
          Mark Lost
        </button>
      )}
    </div>
  );
}
