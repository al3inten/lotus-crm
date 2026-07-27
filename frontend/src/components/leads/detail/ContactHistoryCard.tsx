import { motion } from "framer-motion";
import { MessagesSquare } from "lucide-react";
import { Card, CardHeader } from "../../../components/common/Card";
import { fadeUp } from "../../../lib/motion";
import type { LeadWithHistory } from "../../../types";

export function ContactHistoryCard({ lead }: { lead: LeadWithHistory }) {
  return (
    <motion.div variants={fadeUp}>
      <Card>
        <CardHeader
          icon={<MessagesSquare size={16} />}
          iconClassName="bg-fuchsia-50 text-fuchsia-600 dark:bg-fuchsia-500/20 dark:text-fuchsia-400"
          title="Contact History"
          subtitle="Every way they've reached us"
        />
        <div className="mb-3 flex flex-wrap gap-1.5">
          {Object.entries(lead.touchesBySource).map(([source, count]) => (
            <span key={source} className="rounded-full bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-700 dark:bg-primary-500/15 dark:text-primary-300">
              {source.replaceAll("_", " ")} ×{count}
            </span>
          ))}
          {Object.entries(lead.messagesByChannel).map(([channel, count]) => (
            <span key={channel} className="rounded-full bg-fuchsia-50 px-2.5 py-1 text-xs font-medium text-fuchsia-700 dark:bg-fuchsia-500/15 dark:text-fuchsia-300">
              {channel} msgs: {count}
            </span>
          ))}
        </div>
        <ul className="flex flex-col gap-1.5">
          {lead.touches.slice(0, 4).map((touch) => (
            <li key={touch.id} className="rounded-lg bg-slate-50 px-3 py-2 text-xs dark:bg-slate-800/60">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800 dark:text-slate-200">{touch.source.replaceAll("_", " ")}</span>
                <span className="text-slate-400 dark:text-slate-500">{new Date(touch.createdAt).toLocaleDateString()}</span>
              </div>
              {touch.note && <p className="mt-0.5 text-slate-500 dark:text-slate-400">{touch.note}</p>}
            </li>
          ))}
        </ul>
      </Card>
    </motion.div>
  );
}
