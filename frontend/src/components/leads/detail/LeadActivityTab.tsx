import { useState } from "react";
import { motion } from "framer-motion";
import { MessagesSquare, Pencil, ClipboardEdit, Eye } from "lucide-react";

import { Card, CardHeader } from "../../../components/common/Card";
import { FollowUpTable } from "../../../components/enquiry/FollowUpTable";
import { UnifiedTimeline } from "../../../components/enquiry/UnifiedTimeline";

import { fadeUp } from "../../../lib/motion";
import type { Enquiry } from "../../../types";

interface LeadActivityTabProps {
  enquiry: Enquiry;
  openFollowUp: () => void;
  setShowFollowUpsModal: (v: boolean) => void;
  setShowTimelineModal: (v: boolean) => void;
  onUpdateNotes: (newRemarks: string) => void;
}

export function LeadActivityTab({
  enquiry,
  openFollowUp,
  setShowFollowUpsModal,
  setShowTimelineModal,
  onUpdateNotes,
}: LeadActivityTabProps) {
  const [localNote, setLocalNote] = useState("");

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="flex flex-col gap-6 lg:col-span-2">
        {/* ---------- FOLLOW-UP HISTORY ---------- */}
        <motion.div variants={fadeUp}>
          <FollowUpTable
            followUps={enquiry.followUps || []}
            onAddClick={openFollowUp}
            canAdd={false}
            limit={4}
            onViewAll={() => setShowFollowUpsModal(true)}
          />
        </motion.div>

        {/* ---------- ACTIVITY TIMELINE ---------- */}
        <motion.div variants={fadeUp}>
          <Card>
            <CardHeader
              icon={<MessagesSquare size={18} />}
              iconClassName="bg-blue-50 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400"
              title="Activity Timeline"
              subtitle="Complete audit history of stage changes and follow-ups"
              actions={
                <button
                  type="button"
                  onClick={() => setShowTimelineModal(true)}
                  aria-label="View full timeline"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-blue-400"
                >
                  <Eye size={16} />
                </button>
              }
            />
            <div className="max-h-[360px] overflow-y-auto pr-1 [scrollbar-width:thin]">
              <UnifiedTimeline enquiryId={enquiry.id} statusHistory={enquiry.statusHistory || []} followUps={enquiry.followUps || []} />
            </div>
          </Card>
        </motion.div>
      </div>

      <div className="flex flex-col gap-6 lg:col-span-1">
        {/* ---------- RICH NOTES ---------- */}
        <motion.div variants={fadeUp} className="h-full">
          <Card className="flex flex-col h-full min-h-[500px] overflow-hidden">
            <CardHeader
              icon={<Pencil size={18} />}
              iconClassName="bg-amber-50 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400"
              title="Consultant Notes"
              subtitle="Private notes for this enquiry"
            />
            <div className="flex-1 overflow-y-auto p-4 [scrollbar-width:thin] border-y border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/20">
              {enquiry.remarks ? (
                <div className="rounded-xl bg-amber-50 border border-amber-100 p-4 text-sm text-amber-900 dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-200">
                  <p className="whitespace-pre-wrap">{enquiry.remarks}</p>
                </div>
              ) : (
                <div className="flex h-full flex-col items-center justify-center text-center text-slate-400">
                  <ClipboardEdit size={32} className="mb-3 opacity-20" />
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No notes yet</p>
                  <p className="mt-1 text-xs text-slate-400/80">Jot down important details or context for the next follow-up.</p>
                </div>
              )}
            </div>
            <div className="p-4 bg-white dark:bg-slate-900">
              <textarea
                placeholder="Type a new note (press Enter to save)..."
                className="w-full resize-none rounded-xl border border-slate-200 bg-white p-3 text-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                rows={3}
                value={localNote}
                onChange={(e) => setLocalNote(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    const val = localNote.trim();
                    if (val) {
                      onUpdateNotes(enquiry.remarks ? enquiry.remarks + "\n\n---\n\n" + val : val);
                      setLocalNote("");
                    }
                  }
                }}
              />
              <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                <span>Press Enter to save</span>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
