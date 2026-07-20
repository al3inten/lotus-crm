import { useState } from "react";
import { motion } from "framer-motion";
import { MessagesSquare, Pencil, ClipboardEdit, Eye, Car, Star, User2, Plus, X, ChevronDown } from "lucide-react";
import clsx from "clsx";

import { Card, CardHeader } from "../../../components/common/Card";
import { FollowUpTable } from "../../../components/enquiry/FollowUpTable";
import { UnifiedTimeline } from "../../../components/enquiry/UnifiedTimeline";
import { TestDriveForm } from "../../../components/enquiry/TestDriveForm";
import { TestDriveEditForm } from "../../../components/enquiry/TestDriveEditForm";

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
  const [showAddTestDrive, setShowAddTestDrive] = useState(false);
  const [editingDriveId, setEditingDriveId] = useState<string | null>(null);
  const testDrives = enquiry.testDriveFeedbacks ?? [];
  const sortedDrives = [...testDrives].sort(
    (a, b) => new Date(b.completedAt ?? b.createdAt ?? 0).getTime() - new Date(a.completedAt ?? a.createdAt ?? 0).getTime()
  );

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[60fr_40fr] lg:items-start">
      {/* ---------- FOLLOW-UP HISTORY ---------- */}
      <motion.div variants={fadeUp}>
        <FollowUpTable
          followUps={enquiry.followUps || []}
          onAddClick={openFollowUp}
          canAdd={false}
          onViewAll={() => setShowFollowUpsModal(true)}
        />
      </motion.div>

      {/* ---------- TEST DRIVE ---------- */}
      <motion.div variants={fadeUp}>
        <Card
          padded={false}
          className={clsx(
            "flex flex-col overflow-hidden",
            showAddTestDrive || editingDriveId ? "min-h-[420px]" : "h-[420px]"
          )}
        >
          <div className="p-4 pb-3">
            <CardHeader
              icon={<Car size={18} />}
              iconClassName="bg-violet-50 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400"
              title="Test Drive"
              subtitle={`${testDrives.length} taken`}
              actions={
                <button
                  type="button"
                  onClick={() => {
                    setShowAddTestDrive((v) => !v);
                    setEditingDriveId(null);
                  }}
                  aria-label={showAddTestDrive ? "Close add test drive form" : "Add another test drive"}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-violet-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-violet-400"
                >
                  {showAddTestDrive ? <X size={16} /> : <Plus size={16} />}
                </button>
              }
            />
          </div>

          <div className="flex-1 overflow-y-auto [scrollbar-width:thin]">
            {showAddTestDrive && (
              <div className="border-y border-slate-100 bg-slate-50/60 p-4 dark:border-slate-800/60 dark:bg-slate-900/20">
                <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
                  Customer wants to test drive another vehicle? Record it here.
                </p>
                <TestDriveForm
                  enquiryId={enquiry.id}
                  branchId={enquiry.branchId}
                  existing={testDrives}
                  defaultCarModel={enquiry.carModel}
                  defaultVariant={enquiry.variant}
                  hideHistory
                  onSaved={() => setShowAddTestDrive(false)}
                />
              </div>
            )}

            {testDrives.length > 0 ? (
              <ul className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800/60">
                {sortedDrives.map((drive, index) => {
                  const isEditing = editingDriveId === drive.id;
                  return (
                    <li key={drive.id} className="text-xs">
                      <button
                        type="button"
                        onClick={() => setEditingDriveId(isEditing ? null : drive.id)}
                        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/30"
                      >
                        <span className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-100">
                          <ChevronDown
                            size={13}
                            className={clsx("shrink-0 text-slate-400 transition-transform", isEditing && "rotate-180")}
                          />
                          Drive #{testDrives.length - index}
                        </span>
                        {drive.rating != null ? (
                          <span className="flex items-center gap-0.5 rounded-full bg-amber-50 px-2 py-0.5 font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                            <Star size={11} className="fill-current" /> {drive.rating}/5
                          </span>
                        ) : (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-400 dark:bg-slate-800 dark:text-slate-500">Not rated</span>
                        )}
                      </button>

                      <div className="px-4 pb-3">
                        <div className="flex flex-col gap-1 text-slate-500 dark:text-slate-400">
                          {drive.carModel && (
                            <span className="flex items-center gap-1.5">
                              <Car size={12} className="shrink-0 text-slate-400" />
                              {drive.carModel}
                              {drive.variant && ` · ${drive.variant}`}
                            </span>
                          )}
                          {drive.conductedBy && (
                            <span className="flex items-center gap-1.5">
                              <User2 size={12} className="shrink-0 text-slate-400" />
                              {drive.conductedBy.name}
                            </span>
                          )}
                        </div>
                        {drive.comments && (
                          <p className="mt-1.5 line-clamp-2 text-slate-500 dark:text-slate-400">{drive.comments}</p>
                        )}
                        {(drive.completedAt || drive.scheduledAt) && (
                          <p className="mt-1.5 text-[11px] text-slate-400 dark:text-slate-500">
                            {drive.completedAt
                              ? `Completed ${new Date(drive.completedAt).toLocaleDateString()}`
                              : `Scheduled ${new Date(drive.scheduledAt!).toLocaleDateString()}`}
                          </p>
                        )}
                      </div>

                      {isEditing && (
                        <div className="border-t border-slate-100 bg-slate-50/60 p-4 dark:border-slate-800/60 dark:bg-slate-900/20">
                          <TestDriveEditForm enquiryId={enquiry.id} drive={drive} onSaved={() => setEditingDriveId(null)} />
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            ) : (
              !showAddTestDrive && (
                <div className="flex flex-col items-center justify-center px-4 py-8 text-center text-slate-400">
                  <Car size={28} className="mb-2 opacity-20" />
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No test drives yet</p>
                  <p className="mt-1 text-xs text-slate-400/80">Use the + button to record one.</p>
                </div>
              )
            )}
          </div>
        </Card>
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
  );
}
