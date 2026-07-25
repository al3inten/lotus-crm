import { useCallback, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  MessagesSquare,
  Pencil,
  Eye,
  Car,
  Star,
  User2,
  Plus,
  X,
  ChevronDown,
  Send,
  CalendarClock,
  History,
  Loader2,
} from "lucide-react";
import clsx from "clsx";

import { Card } from "../../../components/common/Card";
import { Button } from "../../common/Button";
import { FollowUpTable } from "../../../components/enquiry/FollowUpTable";
import { UnifiedTimeline } from "../../../components/enquiry/UnifiedTimeline";
import { TestDriveForm } from "../../../components/enquiry/TestDriveForm";
import { TestDriveEditForm } from "../../../components/enquiry/TestDriveEditForm";
import { KeyDatesEditCard } from "./KeyDatesEditCard";
import { useComments, useNotes, useAddNote } from "../../../hooks/useEnquiry";

import { fadeUp } from "../../../lib/motion";
import type { Enquiry } from "../../../types";

const SUB_TABS = ["timeline", "dates", "testdrive", "followups", "notes"] as const;
type SubTab = (typeof SUB_TABS)[number];

const SUB_TAB_ICONS: Record<SubTab, typeof CalendarClock> = {
  dates: CalendarClock,
  testdrive: Car,
  followups: History,
  timeline: MessagesSquare,
  notes: Pencil,
};

/** Every tab pane is this exact height — a header row plus a scrollable body — so
 * switching tabs never resizes the card, no matter how little or how much each holds. */
const PANEL_HEIGHT = "h-[380px]";

interface LeadActivityTabProps {
  enquiry: Enquiry;
  openFollowUp: () => void;
  setShowFollowUpsModal: (v: boolean) => void;
  setShowTimelineModal: (v: boolean) => void;
  consultants?: { id: string; name: string }[];
  canReassign: boolean;
  onUpdateConsultant: (consultantId: string) => void;
  isUpdatingConsultant: boolean;
}

export function LeadActivityTab({
  enquiry,
  openFollowUp,
  setShowFollowUpsModal,
  setShowTimelineModal,
  consultants,
  canReassign,
  onUpdateConsultant,
  isUpdatingConsultant,
}: LeadActivityTabProps) {
  // The active sub-tab lives in the URL too (?subtab=...), alongside the main ?tab=activity,
  // so reloading (or a shared link) restores exactly where the user left off.
  const [searchParams, setSearchParams] = useSearchParams();
  const subTabParam = searchParams.get("subtab");
  const activeSubTab: SubTab = (SUB_TABS as readonly string[]).includes(subTabParam ?? "")
    ? (subTabParam as SubTab)
    : "timeline";
  const setActiveSubTab = useCallback(
    (tab: SubTab) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set("subtab", tab);
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const [localNote, setLocalNote] = useState("");
  const [showAddTestDrive, setShowAddTestDrive] = useState(false);
  const [editingDriveId, setEditingDriveId] = useState<string | null>(null);
  const testDrives = enquiry.testDriveFeedbacks ?? [];
  const sortedDrives = [...testDrives].sort(
    (a, b) => new Date(b.completedAt ?? b.createdAt ?? 0).getTime() - new Date(a.completedAt ?? a.createdAt ?? 0).getTime()
  );
  const followUps = enquiry.followUps ?? [];

  // Private per-author scratchpad — the server only ever returns the caller's own notes.
  const { data: notes = [], isLoading: notesLoading } = useNotes(enquiry.id);
  const addNote = useAddNote(enquiry.id);
  const submitNote = () => {
    const val = localNote.trim();
    if (!val) return;
    addNote.mutate({ body: val });
    setLocalNote("");
  };

  // The timeline is the one pane with its own async fetch (comments) beyond the enquiry
  // itself — surface that as a small spinner on its tab, not a page-wide loader.
  const { isLoading: timelineLoading } = useComments(enquiry.id);
  const TAB_LOADING: Partial<Record<SubTab, boolean>> = { timeline: timelineLoading, notes: notesLoading };

  const tabLabels: Record<SubTab, string> = {
    dates: "Key Dates",
    testdrive: `Test Drive${testDrives.length ? ` (${testDrives.length})` : ""}`,
    followups: `Follow-ups${followUps.length ? ` (${followUps.length})` : ""}`,
    timeline: "Timeline",
    notes: `Notes${notes.length ? ` (${notes.length})` : ""}`,
  };

  return (
    <motion.div variants={fadeUp}>
      <Card padded={false} glow={false} className="overflow-hidden">
        {/* ── Sub-tab bar ── */}
        <div className="flex items-center gap-1 overflow-x-auto border-b border-slate-100 px-3 pt-3 [scrollbar-width:thin] dark:border-slate-800/60">
          {SUB_TABS.map((tab) => {
            const Icon = SUB_TAB_ICONS[tab];
            const active = activeSubTab === tab;
            const loading = TAB_LOADING[tab];
            return (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setActiveSubTab(tab)}
                className={clsx(
                  "relative flex shrink-0 items-center gap-1.5 rounded-t-lg px-3.5 py-2.5 text-[13px] font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-indigo-500",
                  active
                    ? "text-slate-900 dark:text-white"
                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                )}
              >
                {active && (
                  <motion.span
                    layoutId="activitySubTab"
                    className="absolute inset-x-0 bottom-0 h-[2px] bg-indigo-500"
                    transition={{ type: "spring", stiffness: 500, damping: 38 }}
                  />
                )}
                {loading ? <Loader2 size={13} className="animate-spin" /> : <Icon size={13} strokeWidth={1.75} />}
                {tabLabels[tab]}
              </button>
            );
          })}
        </div>

        <div className="p-5">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeSubTab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
            >
              {/* ---------- KEY DATES ---------- */}
              {activeSubTab === "dates" && (
                <div className={clsx(PANEL_HEIGHT, "flex flex-col")}>
                  <KeyDatesEditCard
                    enquiry={enquiry}
                    consultants={consultants}
                    canReassign={canReassign}
                    onUpdateConsultant={onUpdateConsultant}
                    isUpdatingConsultant={isUpdatingConsultant}
                  />
                </div>
              )}

              {/* ---------- TEST DRIVE ---------- */}
              {activeSubTab === "testdrive" && (
                <div className={clsx(PANEL_HEIGHT, "flex flex-col")}>
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {testDrives.length} drive{testDrives.length === 1 ? "" : "s"} recorded
                    </p>
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
                  </div>

                  <div className="flex-1 overflow-y-auto [scrollbar-width:thin]">
                    {showAddTestDrive && (
                      <div className="mb-3 rounded-xl border border-slate-100 bg-slate-50/60 p-4 dark:border-slate-800/60 dark:bg-slate-900/20">
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
                                className="flex w-full items-center justify-between gap-2 py-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/30"
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

                              <div className="pb-3">
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
                                <div className="rounded-xl border-t border-slate-100 bg-slate-50/60 p-4 dark:border-slate-800/60 dark:bg-slate-900/20">
                                  <TestDriveEditForm enquiryId={enquiry.id} drive={drive} onSaved={() => setEditingDriveId(null)} />
                                </div>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      !showAddTestDrive && (
                        <div className="flex flex-col items-center py-10 text-center text-slate-400">
                          <Car size={24} className="mb-2 opacity-20" />
                          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No test drives yet</p>
                          <p className="mt-1 text-xs text-slate-400/80">Use the + button to record one.</p>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* ---------- FOLLOW-UP HISTORY ---------- */}
              {activeSubTab === "followups" && (
                <div className={clsx(PANEL_HEIGHT, "flex flex-col")}>
                  {followUps.length > 3 && (
                    <div className="mb-3 flex justify-end">
                      <Button size="sm" variant="secondary" icon={<Eye size={14} />} onClick={() => setShowFollowUpsModal(true)}>
                        View all ({followUps.length})
                      </Button>
                    </div>
                  )}
                  <div className="flex-1 overflow-y-auto [scrollbar-width:thin]">
                    <FollowUpTable followUps={followUps} onAddClick={openFollowUp} canAdd={false} hideHeader />
                  </div>
                </div>
              )}

              {/* ---------- ACTIVITY TIMELINE ---------- */}
              {activeSubTab === "timeline" && (
                <div className={clsx(PANEL_HEIGHT, "flex flex-col")}>
                  <div className="mb-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setShowTimelineModal(true)}
                      className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-slate-400 transition-colors hover:bg-slate-100 hover:text-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-blue-400"
                    >
                      <Eye size={12} />
                      View full timeline
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto [scrollbar-width:thin]">
                    {timelineLoading ? (
                      <div className="flex h-full flex-col items-center justify-center text-slate-400">
                        <Loader2 size={20} className="animate-spin" />
                      </div>
                    ) : (
                      <UnifiedTimeline
                        enquiryId={enquiry.id}
                        statusHistory={enquiry.statusHistory || []}
                        followUps={enquiry.followUps || []}
                        dateChangeHistory={enquiry.dateChangeHistory || []}
                      />
                    )}
                  </div>
                </div>
              )}

              {/* ---------- CONSULTANT NOTES — private scratchpad, chat-style ---------- */}
              {activeSubTab === "notes" && (
                <div className={clsx(PANEL_HEIGHT, "flex flex-col")}>
                  <div className="flex-1 overflow-y-auto rounded-xl bg-slate-50/60 px-3 py-3 [scrollbar-width:thin] dark:bg-slate-900/20">
                    {notesLoading ? (
                      <div className="flex h-full items-center justify-center text-slate-400">
                        <Loader2 size={18} className="animate-spin" />
                      </div>
                    ) : notes.length > 0 ? (
                      <ul className="flex flex-col gap-1.5">
                        {notes.map((note) => (
                          <li key={note.id} className="flex justify-end">
                            <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-emerald-100 px-3 py-2 text-sm text-emerald-950 shadow-sm dark:bg-emerald-500/15 dark:text-emerald-100">
                              <p className="whitespace-pre-wrap">{note.body}</p>
                              <p className="mt-1 text-right text-[10px] text-emerald-700/70 dark:text-emerald-300/60">
                                {new Date(note.createdAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                              </p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center text-center text-slate-400">
                        <Pencil size={24} className="mb-2 opacity-20" />
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No notes yet</p>
                        <p className="mt-1 text-xs text-slate-400/80">Private to you — no one else can see these.</p>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 flex items-end gap-2">
                    <textarea
                      placeholder="Message yourself…"
                      className="block w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400/50 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500"
                      rows={1}
                      value={localNote}
                      onChange={(e) => setLocalNote(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          submitNote();
                        }
                      }}
                    />
                    <button
                      type="button"
                      disabled={!localNote.trim() || addNote.isPending}
                      onClick={submitNote}
                      aria-label="Send note"
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white transition-colors hover:bg-emerald-600 disabled:opacity-40"
                    >
                      {addNote.isPending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </Card>
    </motion.div>
  );
}
