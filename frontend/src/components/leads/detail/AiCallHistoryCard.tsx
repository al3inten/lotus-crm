import { motion } from "framer-motion";
import { PhoneCall } from "lucide-react";
import { Card, CardHeader } from "../../../components/common/Card";
import { fadeUp } from "../../../lib/motion";

export function AiCallHistoryCard({ callLogs }: { callLogs: any[] }) {
  if (!callLogs || callLogs.length === 0) return null;
  return (
    <motion.div variants={fadeUp}>
      <Card>
        <CardHeader icon={<PhoneCall size={16} />} iconClassName="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400" title="AI Call History" />
        <ul className="flex flex-col gap-2">
          {callLogs.map((call) => (
            <li key={call.id} className="rounded-lg bg-slate-50 p-2.5 text-sm dark:bg-slate-800/60">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-800 dark:text-slate-200">{call.status.replaceAll("_", " ")}</span>
                <span className="text-slate-400 dark:text-slate-500">{new Date(call.createdAt).toLocaleString()}</span>
              </div>
              {call.recordingUrl && <audio controls src={call.recordingUrl} className="mt-1.5 h-8 w-full" />}
            </li>
          ))}
        </ul>
      </Card>
    </motion.div>
  );
}
