import { motion } from "framer-motion";
import { Check } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import clsx from "clsx";

export type StageTone = "blue" | "green" | "red" | "muted";

export interface StagePill {
  tone: StageTone;
  text: string;
  check?: boolean;
}

const CARD_BORDER: Record<StageTone, string> = {
  blue: "border-primary-200 dark:border-primary-500/30",
  green: "border-emerald-200 dark:border-emerald-500/30",
  red: "border-red-200 dark:border-red-500/30",
  muted: "border-slate-200 dark:border-slate-800",
};
const ICON_DISC: Record<StageTone, string> = {
  blue: "bg-primary-600 text-white shadow-md shadow-primary-500/25",
  green: "bg-teal-600 text-white shadow-md shadow-emerald-500/25",
  red: "bg-rose-600 text-white shadow-md shadow-red-500/25",
  muted: "border-2 border-slate-200 bg-white text-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-600",
};
const CHECK_BADGE: Record<StageTone, string> = {
  blue: "bg-primary-600",
  green: "bg-emerald-600",
  red: "bg-red-600",
  muted: "bg-slate-400",
};
const PILL_TONE: Record<StageTone, string> = {
  blue: "bg-primary-100 text-primary-800 dark:bg-primary-500/20 dark:text-primary-200",
  green: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200",
  red: "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-200",
  muted: "bg-slate-100/70 text-slate-400 dark:bg-slate-800/50 dark:text-slate-500",
};
const LABEL_TONE: Record<StageTone, string> = {
  blue: "text-slate-900 dark:text-slate-100",
  green: "text-emerald-800 dark:text-emerald-300",
  red: "text-red-800 dark:text-red-300",
  muted: "text-slate-500 dark:text-slate-400",
};

export interface StageDetailPreviewRow {
  label: string;
  value: string;
}

/** A single stage in the pipeline, rendered as a premium dashboard card rather than a bare
 * circle+label. Preserves the exact click semantics PipelineStepper already computed
 * (clickable / canChangeStatus / hint) — this component is presentation only. */
export function StageCard({
  number,
  label,
  Icon,
  tone,
  current,
  showCheck,
  pill,
  previewRows,
  whenLabel,
  clickable,
  selected,
  onClick,
  hint,
}: {
  number: number;
  label: string;
  Icon: LucideIcon;
  tone: StageTone;
  current?: boolean;
  showCheck?: boolean;
  pill: StagePill;
  /** Up to 2 short detail rows shown on the card face; the rest live in the expanded panel. */
  previewRows: StageDetailPreviewRow[];
  /** e.g. "Reached 2h ago" — when this stage was entered, if known. */
  whenLabel?: string;
  clickable?: boolean;
  /** True while this card's contextual panel is open below the track. */
  selected?: boolean;
  onClick?: () => void;
  hint?: string;
}) {
  return (
    <motion.div
      layout
      whileHover={clickable ? { y: -2, boxShadow: "0 8px 30px rgba(0,0,0,0.08)" } : undefined}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      onClick={clickable ? onClick : undefined}
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={clickable ? (e) => (e.key === "Enter" || e.key === " ") && onClick?.() : undefined}
      title={clickable ? hint ?? "Click to update status" : undefined}
      className={clsx(
        "flex w-[168px] shrink-0 snap-start flex-col gap-2.5 rounded-2xl border bg-white p-3.5 shadow-sm transition-colors dark:bg-slate-900 sm:w-[188px]",
        CARD_BORDER[tone],
        clickable && "cursor-pointer",
        // A ring rather than a left accent border — the enclosing pipeline panel already
        // has its own mood-colored left border (see LeadPipelinePanel/leadUtils.tsx), so a
        // second blue accent directly on the card reads as a stray line/gap next to it.
        selected && "ring-2 ring-primary-500/60 border-primary-400 dark:border-primary-500"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="relative flex h-8 w-8 shrink-0 items-center justify-center">
            <span className={clsx("flex h-8 w-8 items-center justify-center rounded-full", ICON_DISC[tone])}>
              <Icon size={14} strokeWidth={2.2} />
            </span>
            {showCheck && (
              <span
                className={clsx(
                  "absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full text-white ring-2 ring-white dark:ring-slate-900",
                  CHECK_BADGE[tone]
                )}
              >
                <Check size={8} strokeWidth={4} />
              </span>
            )}
          </span>
          <div className="min-w-0">
            <p className={clsx("text-[10px] font-bold leading-none", LABEL_TONE[tone])}>Stage {number}</p>
            <p className={clsx("truncate text-[13px] font-bold leading-tight", LABEL_TONE[tone])}>{label}</p>
          </div>
        </div>
        {current && tone === "blue" && (
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary-500" />
          </span>
        )}
      </div>

      <div className="h-px bg-slate-100 dark:bg-white/[0.06]" />

      {previewRows.length > 0 ? (
        <div className="flex flex-col gap-1">
          {previewRows.slice(0, 2).map((row) => (
            <div key={row.label} className="flex items-baseline justify-between gap-2 text-[11px]">
              <span className="shrink-0 text-slate-400 dark:text-slate-500">{row.label}</span>
              <span className="truncate font-medium text-slate-700 dark:text-slate-300">{row.value}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[11px] italic text-slate-300 dark:text-slate-600">No details yet</p>
      )}

      <div className="mt-auto flex items-center justify-between gap-2 pt-0.5">
        <span className={clsx("inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[9px] font-semibold", PILL_TONE[pill.tone])}>
          {pill.check && <Check size={8} strokeWidth={4} />}
          {pill.text}
        </span>
        {whenLabel && <span className="truncate text-[10px] text-slate-400 dark:text-slate-500">{whenLabel}</span>}
      </div>
    </motion.div>
  );
}
