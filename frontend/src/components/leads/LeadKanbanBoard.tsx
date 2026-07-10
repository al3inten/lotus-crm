import { useState } from "react";
import { useNavigate } from "react-router-dom";
import clsx from "clsx";
import { Clock } from "lucide-react";
import { Avatar } from "../common/Avatar";
import type { Enquiry, EnquiryStatus } from "../../types";
import { StatusChangeModal } from "../enquiry/StatusChangeModal";
import type { EnquiryCategory } from "../../types";

const CATEGORY_STYLES: Record<EnquiryCategory, string> = {
  HOT: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300",
  WARM: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
  COLD: "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300",
};

const KANBAN_COLUMNS: { id: EnquiryStatus; label: string; color: string }[] = [
  { id: "NEW", label: "New", color: "bg-slate-100 border-slate-200 text-slate-800" },
  { id: "UNDER_FOLLOW_UP", label: "Under Follow-up", color: "bg-blue-50 border-blue-200 text-blue-800" },
  { id: "APPOINTMENT_FIXED", label: "Appointment", color: "bg-indigo-50 border-indigo-200 text-indigo-800" },
  { id: "TEST_DRIVE", label: "Test Drive", color: "bg-purple-50 border-purple-200 text-purple-800" },
  { id: "BOOKED", label: "Booked", color: "bg-emerald-50 border-emerald-200 text-emerald-800" },
];

export function LeadKanbanBoard({ enquiries }: { enquiries: Enquiry[] }) {
  const navigate = useNavigate();
  const [draggedEnquiryId, setDraggedEnquiryId] = useState<string | null>(null);
  
  // Modal state
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [modalEnquiry, setModalEnquiry] = useState<Enquiry | null>(null);
  const [targetStatus, setTargetStatus] = useState<EnquiryStatus | undefined>();
  const [dragOverCol, setDragOverCol] = useState<EnquiryStatus | null>(null);

  const handleDragStart = (e: React.DragEvent, enquiryId: string) => {
    setDraggedEnquiryId(enquiryId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, colId: EnquiryStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverCol !== colId) setDragOverCol(colId);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverCol(null);
  };

  const handleDrop = (e: React.DragEvent, columnStatus: EnquiryStatus) => {
    e.preventDefault();
    setDragOverCol(null);
    if (!draggedEnquiryId) return;

    const enquiry = enquiries.find((eq) => eq.id === draggedEnquiryId);
    if (!enquiry || enquiry.status === columnStatus) return; // No change

    // Open modal to confirm status change and capture remarks/loss reasons
    setModalEnquiry(enquiry);
    setTargetStatus(columnStatus);
    setShowStatusModal(true);
    setDraggedEnquiryId(null);
  };

  return (
    <div className="flex h-[75vh] w-full gap-4 overflow-x-auto p-4 pb-8">
      {KANBAN_COLUMNS.map((col) => {
        const columnEnquiries = enquiries.filter((e) => e.status === col.id);

        return (
          <div
            key={col.id}
            className={clsx(
              "flex min-w-[300px] w-[300px] flex-col rounded-xl p-3 shadow-inner ring-1 transition-colors duration-200",
              dragOverCol === col.id 
                ? "bg-slate-100/90 ring-blue-400 dark:bg-slate-800/90 dark:ring-blue-500" 
                : "bg-slate-50/80 ring-slate-200/50 dark:bg-slate-900/50 dark:ring-slate-800/50"
            )}
            onDragOver={(e) => handleDragOver(e, col.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, col.id)}
          >
            <div className={clsx("mb-4 flex items-center justify-between rounded-lg border px-3 py-2", col.color)}>
              <h3 className="font-bold text-sm uppercase tracking-wide">{col.label}</h3>
              <span className="rounded-full bg-white/50 px-2 py-0.5 text-xs font-bold text-black/70 mix-blend-multiply">
                {columnEnquiries.length}
              </span>
            </div>

            <div className="flex flex-col gap-3 overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
              {columnEnquiries.map((enquiry) => {
                let followUpStatus: 'overdue' | 'today' | 'future' | null = null;
                if (enquiry.followUpDueAt) {
                  const due = new Date(enquiry.followUpDueAt);
                  const now = new Date();
                  if (due < now && due.toDateString() !== now.toDateString()) followUpStatus = 'overdue';
                  else if (due.toDateString() === now.toDateString()) followUpStatus = 'today';
                  else followUpStatus = 'future';
                }

                return (
                  <div
                    key={enquiry.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, enquiry.id)}
                    onDragEnd={() => setDraggedEnquiryId(null)}
                    onClick={() => navigate(`/leads/${enquiry.leadId}`)}
                    className={clsx(
                      "group cursor-pointer rounded-lg border bg-white p-3 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md dark:bg-slate-800 active:scale-95",
                      draggedEnquiryId === enquiry.id ? "opacity-40 border-dashed border-blue-400" : "border-slate-200 dark:border-slate-700",
                      followUpStatus === 'overdue' ? "border-l-4 border-l-red-500" : ""
                    )}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <Avatar name={enquiry.lead.name} size="sm" />
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-slate-100 line-clamp-1">{enquiry.lead.name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{enquiry.lead.phoneRaw}</p>
                        </div>
                      </div>
                      {enquiry.enquiryCategory && (
                        <span className={clsx("px-1.5 py-0.5 text-[10px] font-bold rounded-md", CATEGORY_STYLES[enquiry.enquiryCategory])}>
                          {enquiry.enquiryCategory}
                        </span>
                      )}
                    </div>

                    <div className="mb-3 rounded bg-slate-50 px-2 py-1.5 dark:bg-slate-900 flex justify-between items-center">
                      <div>
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{enquiry.carModel}</p>
                        <p className="text-[10px] font-medium uppercase text-slate-500">{enquiry.source.replaceAll("_", " ")}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-xs dark:border-slate-700">
                      <span className="text-slate-500 font-medium truncate max-w-[120px]">
                        {enquiry.assignedCr?.name ?? "Unassigned"}
                      </span>
                      {enquiry.followUpDueAt && (
                        <span className={clsx(
                          "flex items-center gap-1 font-semibold px-1.5 py-0.5 rounded",
                          followUpStatus === 'overdue' ? "text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-500/10" :
                          followUpStatus === 'today' ? "text-amber-700 bg-amber-100 dark:text-amber-400 dark:bg-amber-500/10" :
                          "text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-500/10"
                        )}>
                          <Clock size={12} />
                          {followUpStatus === 'overdue' ? 'Overdue' : followUpStatus === 'today' ? 'Today' : new Date(enquiry.followUpDueAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              {columnEnquiries.length === 0 && (
                <div className="flex h-24 items-center justify-center rounded-lg border-2 border-dashed border-slate-200 bg-transparent text-slate-400 dark:border-slate-700">
                  <p className="text-xs font-medium">Drop here</p>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {modalEnquiry && (
        <StatusChangeModal
          enquiryId={modalEnquiry.id}
          branchId={modalEnquiry.branchId}
          currentStatus={modalEnquiry.status}
          isOpen={showStatusModal}
          onClose={() => {
            setShowStatusModal(false);
            setModalEnquiry(null);
          }}
          initialTargetStatus={targetStatus}
        />
      )}
    </div>
  );
}
