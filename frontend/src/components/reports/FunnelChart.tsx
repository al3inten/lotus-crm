import { ArrowDown } from "lucide-react";
import { VIZ } from "./vizTheme";
import type { FunnelStage } from "../../api/reports.api";

const STAGE_LABELS: Record<string, string> = {
  NEW: "New Lead",
  UNDER_FOLLOW_UP: "Under Follow-up",
  APPOINTMENT_FIXED: "Appointment Fixed",
  TEST_DRIVE: "Test Drive",
  BOOKED: "Booking",
  RETAIL_DONE: "Retail",
  CLOSED: "Closed",
};

/**
 * A true funnel — each stage bar is width-scaled against the first stage (not just the
 * tallest bar), and the gap between stages is direct-labeled with the stage-to-stage
 * drop-off, so "where are we losing people" reads at a glance instead of requiring the
 * viewer to do the subtraction between two bar lengths themselves.
 */
export function FunnelChart({ stages }: { stages: FunnelStage[] }) {
  if (stages.length === 0) {
    return <p className="text-sm text-gray-400 dark:text-slate-500">No data in this range.</p>;
  }

  const first = stages[0].reached || 1;

  return (
    <div className="flex flex-col">
      {stages.map((stage, i) => {
        const prev = i > 0 ? stages[i - 1] : null;
        const dropOff = prev && prev.reached > 0 ? Math.round((1 - stage.reached / prev.reached) * 100) : null;
        const widthPercent = Math.max((stage.reached / first) * 100, stage.reached > 0 ? 3 : 0);

        return (
          <div key={stage.stage}>
            {prev && (
              <div className="flex items-center gap-2 py-1 pl-1 text-xs text-slate-400 dark:text-slate-500">
                <ArrowDown size={12} />
                {dropOff !== null && dropOff > 0 && (
                  <span className="font-medium text-slate-500 dark:text-slate-400">-{dropOff}% drop-off</span>
                )}
              </div>
            )}
            <div className="flex items-center gap-3" title={`${STAGE_LABELS[stage.stage] ?? stage.stage}: ${stage.reached.toLocaleString()} (${stage.percentOfTotal}% of total)`}>
              <span className="w-32 shrink-0 truncate text-right text-xs text-gray-600 dark:text-slate-400">
                {STAGE_LABELS[stage.stage] ?? stage.stage}
              </span>
              <div className="h-8 flex-1 rounded bg-gray-100 dark:bg-slate-800/60">
                <div
                  className="flex h-8 items-center justify-end rounded px-2.5 text-xs font-semibold text-white transition-[width] duration-300"
                  style={{ width: `${widthPercent}%`, backgroundColor: VIZ.series1, minWidth: stage.reached > 0 ? "2.75rem" : 0 }}
                >
                  {stage.reached.toLocaleString()}
                </div>
              </div>
              <span className="w-14 shrink-0 text-right text-xs tabular-nums text-gray-500 dark:text-slate-400">
                {stage.percentOfTotal}%
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
