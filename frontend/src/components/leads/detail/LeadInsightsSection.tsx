import clsx from "clsx";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { ScoreRing } from "./ScoreRing";
import { INSIGHT_TONE } from "./leadUtils";
import type { Insight } from "./leadUtils";
import type { Enquiry } from "../../../types";
import { fadeUp } from "../../../lib/motion";

interface LeadInsightsSectionProps {
  enquiry: Enquiry;
  leadScore: number;
  insights: Insight[];
}

export function LeadInsightsSection({ enquiry, leadScore, insights }: LeadInsightsSectionProps) {
  if (!enquiry || enquiry.status === "CLOSED_TEMP" || enquiry.status === "LOST") return null;

  return (
    <motion.div
      variants={fadeUp}
      className="flex flex-col gap-3 rounded-2xl border border-primary-100/80 bg-primary-50/80 p-3.5 sm:flex-row sm:items-center sm:gap-5 dark:border-primary-500/15 dark:bg-primary-500/10"
    >
      <div className="flex items-center gap-2.5 shrink-0">
        <ScoreRing score={leadScore} />
        <h2 className="flex items-center gap-1.5 text-sm font-semibold text-slate-900 dark:text-white">
          <Sparkles size={14} className="text-primary-500 dark:text-primary-400" />
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
    </motion.div>
  );
}
