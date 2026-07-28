import { Calendar, Phone, Mail, User, Clock, CheckCircle2, MessageSquare, MessageCircle, CalendarClock, Pencil, Lock } from "lucide-react";
import type { EnquiryStatusHistoryEntry, FollowUp, Comment, DateChangeHistoryEntry } from "../../types";
import { useComments } from "../../hooks/useEnquiry";
import { CommentInput } from "./CommentInput";
import { motion, type Variants } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

const DATE_FIELD_LABELS: Record<DateChangeHistoryEntry["field"], string> = {
  APPOINTMENT_AT: "Appointment date",
  TEST_DRIVE_SCHEDULED_AT: "Test drive date",
  BOOKED_AT: "Booking date",
  RETAIL_DONE_AT: "Retail date",
};

type TimelineItem =
  | { type: "status"; data: EnquiryStatusHistoryEntry; date: Date }
  | { type: "followup"; data: FollowUp; date: Date }
  | { type: "comment"; data: Comment; date: Date }
  | { type: "datechange"; data: DateChangeHistoryEntry; date: Date };

export function UnifiedTimeline({
  enquiryId,
  statusHistory,
  followUps,
  dateChangeHistory = [],
}: {
  enquiryId: string;
  statusHistory: EnquiryStatusHistoryEntry[];
  followUps: FollowUp[];
  dateChangeHistory?: DateChangeHistoryEntry[];
}) {
  const { data: comments = [] } = useComments(enquiryId);

  const items: TimelineItem[] = [
    ...statusHistory.map((h) => ({ type: "status" as const, data: h, date: new Date(h.createdAt) })),
    ...followUps.map((f) => ({ type: "followup" as const, data: f, date: new Date(f.createdAt) })),
    ...comments.map((c) => ({ type: "comment" as const, data: c, date: new Date(c.createdAt) })),
    ...dateChangeHistory.map((d) => ({ type: "datechange" as const, data: d, date: new Date(d.createdAt) })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <div>
      <CommentInput enquiryId={enquiryId} />
      
      {items.length === 0 ? (
        <p className="text-sm text-gray-500">No activity recorded yet.</p>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="relative border-l border-gray-200 ml-3 space-y-6 pb-4 mt-4"
        >
      {items.map((item) => {
        if (item.type === "status") {
          const h = item.data;
          const isCreation = !h.fromStatus;
          return (
            <motion.div variants={itemVariants} key={`status-${h.id}`} className="relative pl-6">
              <span className="absolute -left-[13px] top-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary-100 ring-4 ring-white">
                {isCreation ? <User size={12} className="text-primary-600" /> : <CheckCircle2 size={12} className="text-primary-600" />}
              </span>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <h3 className="text-sm font-semibold text-gray-900">
                  {isCreation ? (
                    "Lead Created"
                  ) : (
                    <>
                      Moved to <span className="text-primary-600">{h.toStatus.replaceAll("_", " ")}</span>
                    </>
                  )}
                </h3>
                <span className="text-xs text-gray-500 mt-1 sm:mt-0 flex items-center gap-1.5">
                  <Clock size={12} /> {item.date.toLocaleString()}
                </span>
              </div>
              <div className="mt-1 flex items-center gap-2 text-xs text-gray-600">
                <span className="font-medium text-gray-800">{h.changedBy?.name || "System"}</span>
                {h.note && (
                  <>
                    <span className="text-gray-300">•</span>
                    <span className="italic text-gray-500">{h.note}</span>
                  </>
                )}
              </div>
            </motion.div>
          );
        } else if (item.type === "comment") {
          const c = item.data;
          // Details-edit audits are logged as a comment (see enquiries.service.ts
          // updateEnquiryDetails) with this prefix — render them distinctly from a real comment.
          const isDetailsEdit = c.body.startsWith("✏️ Updated details:");
          // Manual close (closeFollowUp) and auto-close (changeStatus, on a forward stage
          // move) are both logged as a comment with a "🔒" prefix — see enquiries.service.ts.
          const isAutoClose = c.body.startsWith("🔒 Auto-closed follow-up");
          const isManualClose = c.body.startsWith("🔒 Closed follow-up");
          const isFollowUpClose = isAutoClose || isManualClose;
          // The header already restates the action — drop that repeated first line from the body.
          const displayBody = isDetailsEdit
            ? c.body.replace(/^✏️ Updated details:\n?/, "")
            : isAutoClose
              ? c.body.replace(/^🔒 Auto-closed follow-up — /, "")
              : isManualClose
                ? c.body.replace(/^🔒 Closed follow-up:?\n?/, "")
                : c.body;

          return (
            <motion.div variants={itemVariants} key={`comment-${c.id}`} className="relative pl-6">
              <span className="absolute -left-[13px] top-1 flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 ring-4 ring-white dark:bg-slate-800 dark:ring-slate-900">
                {isDetailsEdit ? (
                  <Pencil size={12} className="text-slate-600 dark:text-slate-400" />
                ) : isFollowUpClose ? (
                  <Lock size={12} className="text-slate-600 dark:text-slate-400" />
                ) : (
                  <MessageSquare size={12} className="text-slate-600 dark:text-slate-400" />
                )}
              </span>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2 dark:text-slate-200">
                  {c.user.name}{" "}
                  <span className="font-normal text-xs text-gray-500">
                    {isDetailsEdit
                      ? "updated details"
                      : isAutoClose
                        ? "follow-up auto-closed"
                        : isManualClose
                          ? "closed the follow-up"
                          : "added a comment"}
                  </span>
                </h3>
                <span className="text-xs text-gray-500 mt-1 sm:mt-0 flex items-center gap-1.5 dark:text-slate-400">
                  <Clock size={12} /> {item.date.toLocaleString()}
                </span>
              </div>
              {displayBody.trim() && (
                <div className="mt-2 whitespace-pre-line text-sm text-gray-700 bg-gray-50 rounded-xl p-3 border border-gray-100 dark:bg-slate-800/50 dark:text-slate-300 dark:border-slate-800">
                  {/* Simple bolding for @mentions */}
                  {displayBody.split(/(@[\w\s]+?)(?=\s|$|[^\w\s])/).map((part, i) => {
                    if (part.startsWith('@')) {
                      return <span key={i} className="font-semibold text-primary-600 dark:text-primary-400">{part}</span>;
                    }
                    return <span key={i}>{part}</span>;
                  })}
                </div>
              )}
            </motion.div>
          );
        } else if (item.type === "datechange") {
          const d = item.data;
          return (
            <motion.div variants={itemVariants} key={`datechange-${d.id}`} className="relative pl-6">
              <span className="absolute -left-[13px] top-1 flex h-6 w-6 items-center justify-center rounded-full bg-teal-100 ring-4 ring-white dark:bg-teal-500/20 dark:ring-slate-900">
                <CalendarClock size={12} className="text-teal-600 dark:text-teal-400" />
              </span>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-200">
                  {DATE_FIELD_LABELS[d.field]} changed to{" "}
                  <span className="text-teal-600 dark:text-teal-400">{item.date && new Date(d.newValue).toLocaleString()}</span>
                </h3>
                <span className="text-xs text-gray-500 mt-1 sm:mt-0 flex items-center gap-1.5 dark:text-slate-400">
                  <Clock size={12} /> {item.date.toLocaleString()}
                </span>
              </div>
              <div className="mt-1 flex items-center gap-2 text-xs text-gray-600 dark:text-slate-400">
                <span className="font-medium text-gray-800 dark:text-slate-300">{d.changedBy?.name || "System"}</span>
                {d.oldValue && (
                  <>
                    <span className="text-gray-300 dark:text-slate-600">•</span>
                    <span>was {new Date(d.oldValue).toLocaleString()}</span>
                  </>
                )}
                <span className="text-gray-300 dark:text-slate-600">•</span>
                <span className="italic text-gray-500 dark:text-slate-400">{d.reason}</span>
              </div>
            </motion.div>
          );
        } else {
          const f = item.data;
          let Icon = Phone;
          let bgColor = "bg-primary-100";
          let iconColor = "text-primary-600";
          
          if (f.type === "EMAIL") {
            Icon = Mail;
            bgColor = "bg-rose-100";
            iconColor = "text-rose-600";
          } else if (f.type === "VISIT") {
            Icon = User;
            bgColor = "bg-emerald-100";
            iconColor = "text-emerald-600";
          } else if (f.type === "WHATSAPP") {
            Icon = MessageCircle;
            bgColor = "bg-teal-100";
            iconColor = "text-teal-600";
          }

          return (
            <motion.div variants={itemVariants} key={`fu-${f.id}`} className="relative pl-6">
              <span className={`absolute -left-[13px] top-1 flex h-6 w-6 items-center justify-center rounded-full ${bgColor} ring-4 ring-white`}>
                <Icon size={12} className={iconColor} />
              </span>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <h3 className="text-sm font-semibold text-gray-900">
                  Follow-up: <span className="text-gray-700 font-medium">{f.type}</span>
                </h3>
                <span className="text-xs text-gray-500 mt-1 sm:mt-0 flex items-center gap-1.5">
                  <Clock size={12} /> {item.date.toLocaleString()}
                </span>
              </div>
              <div className="mt-1 flex flex-col gap-1 text-xs text-gray-600">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-800">{f.createdBy?.name || "User"}</span>
                  <span className="text-gray-300">•</span>
                  <span>{f.remark}</span>
                </div>
                {f.nextFollowUpDate && (
                  <div className="flex items-center gap-1 text-primary-600 mt-1">
                    <Calendar size={12} />
                    <span>Next follow-up planned for {new Date(f.nextFollowUpDate).toLocaleDateString()} {f.nextFollowUpTime || ""}</span>
                  </div>
                )}
              </div>
            </motion.div>
          );
        }
      })}
        </motion.div>
      )}
    </div>
  );
}
