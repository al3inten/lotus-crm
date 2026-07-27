import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import clsx from "clsx";
import { Card } from "../../../components/common/Card";
import { fadeUp } from "../../../lib/motion";
import { ScoreRing } from "./ScoreRing";
import { INSIGHT_TONE } from "./LeadInsights";
import type { Insight } from "./LeadInsights";

interface AiInsightsCardProps {
  leadScore: number;
  insights: Insight[];
}

export function AiInsightsCard({ leadScore, insights }: AiInsightsCardProps) {
  return (
    <motion.div variants={fadeUp}>
      <Card className="relative overflow-hidden">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary-500/10 blur-2xl" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <ScoreRing score={leadScore} />
            <div>
              <div className="flex items-center gap-1.5">
                <Sparkles size={16} className="text-primary-500 dark:text-primary-400" />
                <h2 className="text-base font-bold text-slate-900 dark:text-white">AI Insights</h2>
              </div>
              <p className="mt-1 max-w-[16rem] text-xs text-slate-500 dark:text-slate-400">
                On-the-fly analysis of this lead's signals and the next best actions.
              </p>
            </div>
          </div>
          <div className="flex-1 sm:border-l sm:border-slate-100 sm:pl-6 dark:sm:border-slate-700/60">
            <ul className="flex flex-col gap-2.5">
              {insights.map((ins, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm">
                  <span className={clsx("mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg", INSIGHT_TONE[ins.tone])}>
                    {ins.icon}
                  </span>
                  <span className="text-slate-700 dark:text-slate-300">{ins.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
