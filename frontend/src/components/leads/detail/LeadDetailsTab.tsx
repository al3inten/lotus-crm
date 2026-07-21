import { motion } from "framer-motion";
import clsx from "clsx";
import { CalendarDays, MessagesSquare, Eye, PhoneCall } from "lucide-react";

import { Card, CardHeader } from "../../../components/common/Card";
import { fadeUp } from "../../../lib/motion";
import { CustomerInfoCard } from "./CustomerInfoCard";
import type { LeadWithHistory, Enquiry } from "../../../types";
import type { CallLog } from "../../../api/voice.api";

interface LeadDetailsTabProps {
  lead: LeadWithHistory;
  enquiry: Enquiry;
  callLogs?: CallLog[];
  followUpUrgency: "overdue" | "today" | "future" | null;
  keyDates: { label: string; value: Date | null }[];
  setShowContactHistoryModal: (v: boolean) => void;
  setShowCallHistoryModal: (v: boolean) => void;
}

export function LeadDetailsTab({
  lead,
  enquiry,
  callLogs,
  followUpUrgency,
  keyDates,
  setShowContactHistoryModal,
  setShowCallHistoryModal,
}: LeadDetailsTabProps) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* ---------- CUSTOMER INFORMATION ---------- */}
      <motion.div variants={fadeUp} className="lg:col-span-3">
        <CustomerInfoCard lead={lead} enquiry={enquiry} />
      </motion.div>

      {/* ---------- KEY DATES ---------- */}
      <motion.div variants={fadeUp}>
        <Card>
          <CardHeader
            icon={<CalendarDays size={18} />}
            iconClassName="bg-amber-50 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400"
            title="Key Dates"
          />
          <div className="flex flex-col text-sm">
            {keyDates.map((d) => (
              <div key={d.label} className="flex items-center justify-between border-b border-slate-100 py-2.5 last:border-0 dark:border-slate-700/50">
                <span className="text-slate-500 dark:text-slate-400">{d.label}</span>
                <span className="font-semibold tabular-nums text-slate-900 dark:text-white">{d.value ? d.value.toLocaleDateString() : "—"}</span>
              </div>
            ))}
            <div
              className={clsx(
                "-mx-6 mt-2 flex items-center justify-between px-6 py-3",
                followUpUrgency === "overdue"
                  ? "bg-red-50/70 dark:bg-red-500/10"
                  : followUpUrgency === "today"
                    ? "bg-amber-50/70 dark:bg-amber-500/10"
                    : "bg-blue-50/70 dark:bg-blue-500/10"
              )}
            >
              <span
                className={clsx(
                  "font-medium",
                  followUpUrgency === "overdue"
                    ? "text-red-900 dark:text-red-200"
                    : followUpUrgency === "today"
                      ? "text-amber-900 dark:text-amber-200"
                      : "text-blue-900 dark:text-blue-200"
                )}
              >
                Next Follow-up
              </span>
              <span
                className={clsx(
                  "font-bold tabular-nums",
                  followUpUrgency === "overdue"
                    ? "text-red-700 dark:text-red-300"
                    : followUpUrgency === "today"
                      ? "text-amber-700 dark:text-amber-300"
                      : "text-blue-700 dark:text-blue-300"
                )}
              >
                {enquiry.followUpDueAt ? new Date(enquiry.followUpDueAt).toLocaleDateString() : "—"}
              </span>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* ---------- CONTACT HISTORY ---------- */}
      <motion.div variants={fadeUp}>
        <Card>
          <CardHeader
            icon={<MessagesSquare size={16} />}
            iconClassName="bg-fuchsia-50 text-fuchsia-600 dark:bg-fuchsia-500/20 dark:text-fuchsia-400"
            title="Contact History"
            subtitle="Every way they've reached us"
            actions={
              lead.touches.length > 4 && (
                <button
                  type="button"
                  onClick={() => setShowContactHistoryModal(true)}
                  aria-label="View all contact history"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-blue-400"
                >
                  <Eye size={16} />
                </button>
              )
            }
          />
          <div className="mb-3 flex flex-wrap gap-1.5">
            {Object.entries(lead.touchesBySource).map(([source, count]) => (
              <span key={source} className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
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

      {/* ---------- AI CALL HISTORY ---------- */}
      {callLogs && callLogs.length > 0 && (
        <motion.div variants={fadeUp}>
          <Card>
            <CardHeader
              icon={<PhoneCall size={16} />}
              iconClassName="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400"
              title="AI Call History"
              actions={
                callLogs.length > 3 && (
                  <button
                    type="button"
                    onClick={() => setShowCallHistoryModal(true)}
                    aria-label="View all call history"
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-blue-400"
                  >
                    <Eye size={16} />
                  </button>
                )
              }
            />
            <ul className="flex flex-col gap-2">
              {callLogs.slice(0, 3).map((call) => (
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
      )}
    </div>
  );
}
