import clsx from "clsx";
import { Sparkles } from "lucide-react";
import { ScoreRing } from "./ScoreRing";
import { INSIGHT_TONE } from "./leadUtils";
import type { Insight } from "./leadUtils";
import type { Enquiry } from "../../../types";

interface LeadInsightsSectionProps {
  enquiry: Enquiry;
  leadScore: number;
  insights: Insight[];
}

export function LeadInsightsSection({ enquiry, leadScore, insights }: LeadInsightsSectionProps) {
  if (!enquiry || enquiry.status === "CLOSED") return null;

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-blue-100/80 bg-gradient-to-br from-blue-50/80 via-white to-white p-3.5 sm:flex-row sm:items-center sm:gap-5 dark:border-blue-500/15 dark:from-blue-500/10 dark:via-slate-900/40 dark:to-slate-900/40">
      <div className="flex items-center gap-2.5 shrink-0">
        <ScoreRing score={leadScore} />
        <h2 className="flex items-center gap-1.5 text-sm font-semibold text-slate-900 dark:text-white">
          <Sparkles size={14} className="text-blue-500 dark:text-blue-400" />
          AI Insights
        </h2>
      </div>
      <ul className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-2">
        {insights.slice(0, 4).map((ins, i) => (
          <li key={i} className="flex items-start gap-2 text-xs">
            <span className={clsx("mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-lg", INSIGHT_TONE[ins.tone])}>
              {ins.icon}
            </span>
            <span className="text-slate-700 dark:text-slate-300">{ins.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
