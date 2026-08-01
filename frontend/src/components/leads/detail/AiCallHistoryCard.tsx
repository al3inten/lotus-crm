import { motion } from "framer-motion";
import { PhoneCall } from "lucide-react";
import { Card, CardHeader } from "../../../components/common/Card";
import { AudioPlayer } from "../../../components/common/AudioPlayer";
import { fadeUp } from "../../../lib/motion";
import type { CallLog } from "../../../api/voice.api";

function CallEntry({ call }: { call: CallLog }) {
  const recordingExpired = !!call.recordingExpiresAt && new Date(call.recordingExpiresAt).getTime() < Date.now();
  const showRecording = !!call.recordingUrl && !recordingExpired;
  const showExpiredNote = !!call.recordingUrl && recordingExpired && !!call.transcript;

  return (
    <li className="rounded-lg bg-slate-50 p-2.5 text-sm dark:bg-slate-800/60">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-slate-800 dark:text-slate-200">{call.status.replaceAll("_", " ")}</span>
        <span className="text-slate-400 dark:text-slate-500">{new Date(call.createdAt).toLocaleString()}</span>
      </div>

      {showRecording && <AudioPlayer src={call.recordingUrl!} />}
      {showExpiredNote && (
        <p className="mt-1.5 text-xs italic text-slate-400 dark:text-slate-500">
          Recording expired (available for 30 days) — transcript only.
        </p>
      )}

      {call.transcriptStatus === "PENDING" && (
        <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-500">Transcribing…</p>
      )}
      {call.transcriptStatus === "FAILED" && !call.transcript && (
        <p className="mt-1.5 text-xs text-red-500">Transcription failed.</p>
      )}
      {call.transcript && (
        <details className="mt-1.5">
          <summary className="cursor-pointer text-xs font-medium text-slate-500 dark:text-slate-400">Transcript</summary>
          <p className="mt-1 whitespace-pre-wrap text-xs text-slate-600 dark:text-slate-300">{call.transcript}</p>
        </details>
      )}
    </li>
  );
}

export function AiCallHistoryCard({ callLogs }: { callLogs: CallLog[] }) {
  if (!callLogs || callLogs.length === 0) return null;
  return (
    <motion.div variants={fadeUp}>
      <Card>
        <CardHeader icon={<PhoneCall size={16} />} iconClassName="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400" title="Call History" />
        <ul className="flex flex-col gap-2">
          {callLogs.map((call) => (
            <CallEntry key={call.id} call={call} />
          ))}
        </ul>
      </Card>
    </motion.div>
  );
}
