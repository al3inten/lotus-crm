import { AnimatePresence, motion } from "framer-motion";
import { CalendarDays, User2, MessageSquareText, X, ArrowRight, Ban, Flag, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import clsx from "clsx";
import type { EnquiryStatus, EnquiryStatusHistoryEntry } from "../../types";
import type { StageDetailPreviewRow, StageTone } from "./StageCard";

const ICON_DISC: Record<StageTone, string> = {
  blue: "bg-primary-600 text-white",
  green: "bg-teal-600 text-white",
  red: "bg-rose-600 text-white",
  muted: "bg-slate-300 text-white dark:bg-slate-700",
};

/** The contextual panel that slides open below the pipeline track when a stage card is
 * clicked — replaces the old small popup Modal. For the CURRENT stage it also surfaces
 * the same status-change actions the pipeline already exposed (Move to next / Mark Lost /
 * Close Temporarily / Fast-track to Delivered), all delegating to the existing
 * onStageClick → StatusChangeModal flow rather than reimplementing any validation. */
export function StagePanel({
  isOpen,
  stage,
  tone,
  detailRows,
  historyEntry,
  isCurrentStage,
  nextStatuses,
  canFastTrackDelivered,
  directMoveTarget,
  onMoveTo,
  onClose,
}: {
  isOpen: boolean;
  stage: { status: EnquiryStatus; label: string; Icon: LucideIcon } | null;
  tone: StageTone;
  detailRows: StageDetailPreviewRow[];
  historyEntry?: EnquiryStatusHistoryEntry;
  isCurrentStage: boolean;
  /** ALLOWED_TRANSITIONS[currentStatus] minus the off-ramps handled separately below —
   * only meaningful (non-empty) when isCurrentStage is true. */
  nextStatuses: EnquiryStatus[];
  canFastTrackDelivered: boolean;
  /** Set when the opened card is a valid next stage (but not the current one) — renders a
   * single "Move to X" CTA instead of the full current-stage action menu, preserving the
   * original one-click jump from clicking a next-stage node. */
  directMoveTarget?: { status: EnquiryStatus; label: string };
  onMoveTo: (status?: EnquiryStatus) => void;
  onClose: () => void;
}) {
  const forwardStatuses = nextStatuses.filter((s) => s !== "DELIVERED" && s !== "CLOSED_TEMP" && s !== "LOST");

  return (
    <AnimatePresence initial={false}>
      {isOpen && stage && (
        <motion.div
          key={stage.status}
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          className="overflow-hidden"
        >
          <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 dark:border-white/[0.07] dark:bg-white/[0.02]">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className={clsx("flex h-8 w-8 shrink-0 items-center justify-center rounded-full", ICON_DISC[tone])}>
                  <stage.Icon size={14} strokeWidth={2.2} />
                </span>
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{stage.label}</p>
                  {isCurrentStage && <p className="text-[11px] font-medium text-primary-600 dark:text-primary-400">Current stage</p>}
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                <X size={15} />
              </button>
            </div>

            {(historyEntry || detailRows.length > 0) && (
              <div className="mt-3.5 flex flex-col gap-2 border-t border-slate-200/80 pt-3 dark:border-white/[0.06]">
                {historyEntry && (
                  <>
                    <div className="flex items-center gap-2.5 text-[13px] text-slate-600 dark:text-slate-300">
                      <CalendarDays size={14} strokeWidth={1.75} className="shrink-0 text-slate-400 dark:text-slate-500" />
                      {new Date(historyEntry.createdAt).toLocaleString()}
                    </div>
                    <div className="flex items-center gap-2.5 text-[13px] text-slate-600 dark:text-slate-300">
                      <User2 size={14} strokeWidth={1.75} className="shrink-0 text-slate-400 dark:text-slate-500" />
                      {historyEntry.changedBy?.name ?? "Unknown"}
                    </div>
                    {historyEntry.note && (
                      <div className="flex items-start gap-2.5 text-[13px] text-slate-600 dark:text-slate-300">
                        <MessageSquareText size={14} strokeWidth={1.75} className="mt-0.5 shrink-0 text-slate-400 dark:text-slate-500" />
                        <p className="leading-relaxed">{historyEntry.note}</p>
                      </div>
                    )}
                  </>
                )}
                {detailRows.length > 0 && (
                  <div className={clsx("flex flex-col gap-1.5", historyEntry && "mt-1 border-t border-slate-200/80 pt-2.5 dark:border-white/[0.06]")}>
                    {detailRows.map((row) => (
                      <div key={row.label} className="flex items-start justify-between gap-3 text-[13px]">
                        <span className="shrink-0 text-slate-400 dark:text-slate-500">{row.label}</span>
                        <span className="text-right font-medium text-slate-700 dark:text-slate-200">{row.value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {directMoveTarget && (
              <div className="mt-3.5 border-t border-slate-200/80 pt-3 dark:border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => onMoveTo(directMoveTarget.status)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-1.5 text-[12px] font-semibold text-white shadow-sm transition-colors hover:bg-primary-500"
                >
                  Move to {directMoveTarget.label}
                  <ArrowRight size={12} strokeWidth={2.5} />
                </button>
              </div>
            )}

            {isCurrentStage && (forwardStatuses.length > 0 || canFastTrackDelivered || nextStatuses.includes("LOST") || nextStatuses.includes("CLOSED_TEMP")) && (
              <div className="mt-3.5 flex flex-wrap items-center gap-2 border-t border-slate-200/80 pt-3 dark:border-white/[0.06]">
                {forwardStatuses.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => onMoveTo(s)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-1.5 text-[12px] font-semibold text-white shadow-sm transition-colors hover:bg-primary-500"
                  >
                    Move to {s.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}
                    <ArrowRight size={12} strokeWidth={2.5} />
                  </button>
                ))}
                {canFastTrackDelivered && (
                  <button
                    type="button"
                    onClick={() => onMoveTo("DELIVERED")}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[12px] font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300 dark:hover:bg-emerald-500/20"
                  >
                    <Zap size={12} strokeWidth={2.5} />
                    Fast-track to Delivered
                  </button>
                )}
                <div className="ml-auto flex items-center gap-2">
                  {nextStatuses.includes("CLOSED_TEMP") && (
                    <button
                      type="button"
                      onClick={() => onMoveTo("CLOSED_TEMP")}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 px-3 py-1.5 text-[12px] font-medium text-amber-700 transition-colors hover:bg-amber-50 dark:border-amber-500/30 dark:text-amber-400 dark:hover:bg-amber-500/10"
                    >
                      <Flag size={12} />
                      Close Temporarily
                    </button>
                  )}
                  {nextStatuses.includes("LOST") && (
                    <button
                      type="button"
                      onClick={() => onMoveTo("LOST")}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-[12px] font-medium text-red-700 transition-colors hover:bg-red-50 dark:border-red-500/30 dark:text-red-400 dark:hover:bg-red-500/10"
                    >
                      <Ban size={12} />
                      Mark Lost
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
