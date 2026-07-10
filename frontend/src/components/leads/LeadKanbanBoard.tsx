import { useState } from "react";
import { useNavigate } from "react-router-dom";
import clsx from "clsx";
import { Clock, GripVertical, Car, Inbox, PhoneCall, CalendarCheck, BadgeCheck, ArrowRightLeft } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  pointerWithin,
} from "@dnd-kit/core";
import type { DragStartEvent, DragEndEvent } from "@dnd-kit/core";
import { Avatar } from "../common/Avatar";
import { StatusChangeModal } from "../enquiry/StatusChangeModal";
import type { Enquiry, EnquiryStatus, EnquiryCategory } from "../../types";

const CATEGORY_STYLES: Record<EnquiryCategory, string> = {
  HOT: "bg-red-100 text-red-700 ring-red-200/60 dark:bg-red-500/15 dark:text-red-300 dark:ring-red-500/20",
  WARM: "bg-amber-100 text-amber-700 ring-amber-200/60 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-500/20",
  COLD: "bg-sky-100 text-sky-700 ring-sky-200/60 dark:bg-sky-500/15 dark:text-sky-300 dark:ring-sky-500/20",
};

interface StageTheme {
  id: EnquiryStatus;
  label: string;
  Icon: LucideIcon;
  /** header container */
  head: string;
  /** icon badge */
  badge: string;
  /** label text */
  text: string;
  /** active tab / drop highlight */
  active: string;
  bar: string;
}

const STAGES: StageTheme[] = [
  {
    id: "NEW",
    label: "New",
    Icon: Inbox,
    head: "border-slate-200 bg-slate-50 dark:border-slate-700/60 dark:bg-slate-800/50",
    badge: "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-200",
    text: "text-slate-700 dark:text-slate-200",
    active: "border-slate-300 bg-slate-100 text-slate-800 dark:border-slate-600 dark:bg-slate-700 dark:text-white",
    bar: "bg-slate-400",
  },
  {
    id: "UNDER_FOLLOW_UP",
    label: "Follow-up",
    Icon: PhoneCall,
    head: "border-blue-200 bg-blue-50 dark:border-blue-500/25 dark:bg-blue-500/10",
    badge: "bg-blue-200/70 text-blue-700 dark:bg-blue-500/25 dark:text-blue-200",
    text: "text-blue-700 dark:text-blue-300",
    active: "border-blue-300 bg-blue-100 text-blue-800 dark:border-blue-500/40 dark:bg-blue-500/20 dark:text-blue-200",
    bar: "bg-blue-500",
  },
  {
    id: "APPOINTMENT_FIXED",
    label: "Appointment",
    Icon: CalendarCheck,
    head: "border-indigo-200 bg-indigo-50 dark:border-indigo-500/25 dark:bg-indigo-500/10",
    badge: "bg-indigo-200/70 text-indigo-700 dark:bg-indigo-500/25 dark:text-indigo-200",
    text: "text-indigo-700 dark:text-indigo-300",
    active: "border-indigo-300 bg-indigo-100 text-indigo-800 dark:border-indigo-500/40 dark:bg-indigo-500/20 dark:text-indigo-200",
    bar: "bg-indigo-500",
  },
  {
    id: "TEST_DRIVE",
    label: "Test Drive",
    Icon: Car,
    head: "border-purple-200 bg-purple-50 dark:border-purple-500/25 dark:bg-purple-500/10",
    badge: "bg-purple-200/70 text-purple-700 dark:bg-purple-500/25 dark:text-purple-200",
    text: "text-purple-700 dark:text-purple-300",
    active: "border-purple-300 bg-purple-100 text-purple-800 dark:border-purple-500/40 dark:bg-purple-500/20 dark:text-purple-200",
    bar: "bg-purple-500",
  },
  {
    id: "BOOKED",
    label: "Booked",
    Icon: BadgeCheck,
    head: "border-emerald-200 bg-emerald-50 dark:border-emerald-500/25 dark:bg-emerald-500/10",
    badge: "bg-emerald-200/70 text-emerald-700 dark:bg-emerald-500/25 dark:text-emerald-200",
    text: "text-emerald-700 dark:text-emerald-300",
    active: "border-emerald-300 bg-emerald-100 text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-500/20 dark:text-emerald-200",
    bar: "bg-emerald-500",
  },
];

type FollowUpUrgency = "overdue" | "today" | "future" | null;

function getFollowUpUrgency(iso?: string | null): FollowUpUrgency {
  if (!iso) return null;
  const due = new Date(iso);
  const now = new Date();
  if (due < now && due.toDateString() !== now.toDateString()) return "overdue";
  if (due.toDateString() === now.toDateString()) return "today";
  return "future";
}

/* ---------- Presentational card body (shared by draggable, mobile & overlay) ---------- */
function CardBody({ enquiry, dragging, onMove }: { enquiry: Enquiry; dragging?: boolean; onMove?: () => void }) {
  const urgency = getFollowUpUrgency(enquiry.followUpDueAt);

  return (
    <div
      className={clsx(
        "relative overflow-hidden rounded-xl border bg-white p-3.5 transition-shadow dark:bg-slate-800",
        urgency === "overdue"
          ? "border-l-[3px] border-l-red-500 border-slate-200 dark:border-slate-700"
          : "border-slate-200 dark:border-slate-700",
        dragging ? "cursor-grabbing shadow-2xl shadow-blue-900/20 ring-2 ring-blue-500/40" : "shadow-sm"
      )}
    >
      <div className="mb-2.5 flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <Avatar name={enquiry.lead.name} size="sm" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{enquiry.lead.name}</p>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">{enquiry.lead.phoneRaw}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {enquiry.enquiryCategory && (
            <span className={clsx("rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ring-inset", CATEGORY_STYLES[enquiry.enquiryCategory])}>
              {enquiry.enquiryCategory}
            </span>
          )}
          <GripVertical size={15} className="hidden text-slate-300 transition-colors group-hover:text-slate-400 lg:block dark:text-slate-600" aria-hidden />
        </div>
      </div>

      <div className="mb-2.5 flex items-center gap-2 rounded-lg bg-slate-50 px-2.5 py-1.5 dark:bg-slate-900/60">
        <Car size={13} className="shrink-0 text-slate-400 dark:text-slate-500" />
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-slate-700 dark:text-slate-300">{enquiry.carModel}</p>
          <p className="truncate text-[10px] font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
            {enquiry.source.replaceAll("_", " ")}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-2 text-xs dark:border-slate-700/70">
        <span className="truncate font-medium text-slate-500 dark:text-slate-400">{enquiry.assignedCr?.name ?? "Unassigned"}</span>
        {enquiry.followUpDueAt && (
          <span
            className={clsx(
              "flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 font-semibold",
              urgency === "overdue"
                ? "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400"
                : urgency === "today"
                  ? "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
                  : "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
            )}
          >
            <Clock size={12} />
            {urgency === "overdue"
              ? "Overdue"
              : urgency === "today"
                ? "Today"
                : new Date(enquiry.followUpDueAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
          </span>
        )}
      </div>

      {/* Mobile-only "move stage" affordance (no drag between columns on small screens) */}
      {onMove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onMove();
          }}
          className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100 lg:hidden dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <ArrowRightLeft size={13} />
          Move stage
        </button>
      )}
    </div>
  );
}

/* ---------- Premium stage header (desktop column top) ---------- */
function StageHeader({ stage, count }: { stage: StageTheme; count: number }) {
  const { Icon } = stage;
  return (
    <div className={clsx("relative mb-3 flex items-center gap-2.5 overflow-hidden rounded-xl border px-3 py-2.5", stage.head)}>
      <span className={clsx("absolute inset-y-0 left-0 w-1", stage.bar)} />
      <span className={clsx("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", stage.badge)}>
        <Icon size={17} />
      </span>
      <div className="min-w-0 flex-1">
        <p className={clsx("truncate text-xs font-bold uppercase tracking-wide", stage.text)}>{stage.label}</p>
        <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
          {count} lead{count !== 1 ? "s" : ""}
        </p>
      </div>
    </div>
  );
}

/* ---------- Draggable card (desktop) ---------- */
function DraggableCard({ enquiry, onOpen }: { enquiry: Enquiry; onOpen: (leadId: string) => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: enquiry.id, data: { enquiry } });
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={() => onOpen(enquiry.leadId)}
      className={clsx(
        "group cursor-grab touch-none rounded-xl outline-none transition-all focus-visible:ring-2 focus-visible:ring-blue-500 active:cursor-grabbing",
        isDragging ? "opacity-40" : "hover:-translate-y-0.5"
      )}
    >
      <CardBody enquiry={enquiry} />
    </div>
  );
}

/* ---------- Droppable column (desktop) ---------- */
function DesktopColumn({ stage, enquiries, onOpen }: { stage: StageTheme; enquiries: Enquiry[]; onOpen: (leadId: string) => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });
  return (
    <div className="flex min-w-0 flex-col">
      <StageHeader stage={stage} count={enquiries.length} />
      <div
        ref={setNodeRef}
        className={clsx(
          "flex flex-1 flex-col gap-3 overflow-y-auto rounded-xl p-2 ring-1 transition-colors [scrollbar-width:thin]",
          isOver
            ? "bg-blue-50/70 ring-2 ring-blue-400 dark:bg-blue-500/10 dark:ring-blue-500/50"
            : "bg-slate-50/60 ring-slate-200/60 dark:bg-slate-900/40 dark:ring-slate-800/60"
        )}
      >
        {enquiries.map((enquiry) => (
          <DraggableCard key={enquiry.id} enquiry={enquiry} onOpen={onOpen} />
        ))}
        {enquiries.length === 0 && (
          <div
            className={clsx(
              "flex h-24 items-center justify-center rounded-lg border-2 border-dashed text-xs font-medium transition-colors",
              isOver ? "border-blue-400 text-blue-500 dark:border-blue-500/60" : "border-slate-200 text-slate-400 dark:border-slate-700 dark:text-slate-600"
            )}
          >
            {isOver ? "Release to move here" : "No leads"}
          </div>
        )}
      </div>
    </div>
  );
}

export function LeadKanbanBoard({ enquiries }: { enquiries: Enquiry[] }) {
  const navigate = useNavigate();
  const [activeEnquiry, setActiveEnquiry] = useState<Enquiry | null>(null);
  const [selectedStage, setSelectedStage] = useState<EnquiryStatus>("NEW");

  const [showStatusModal, setShowStatusModal] = useState(false);
  const [modalEnquiry, setModalEnquiry] = useState<Enquiry | null>(null);
  const [targetStatus, setTargetStatus] = useState<EnquiryStatus | undefined>();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
    useSensor(KeyboardSensor)
  );

  const byStage = (status: EnquiryStatus) => enquiries.filter((e) => e.status === status);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveEnquiry(enquiries.find((e) => e.id === event.active.id) ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveEnquiry(null);
    if (!over) return;
    const enquiry = enquiries.find((e) => e.id === active.id);
    const nextStatus = over.id as EnquiryStatus;
    if (!enquiry || enquiry.status === nextStatus) return;
    openStatusChange(enquiry, nextStatus);
  };

  const openStatusChange = (enquiry: Enquiry, target?: EnquiryStatus) => {
    setModalEnquiry(enquiry);
    setTargetStatus(target);
    setShowStatusModal(true);
  };

  const openDetail = (leadId: string) => navigate(`/leads/${leadId}`);
  const selected = STAGES.find((s) => s.id === selectedStage) ?? STAGES[0];
  const selectedEnquiries = byStage(selectedStage);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragCancel={() => setActiveEnquiry(null)}
      onDragEnd={handleDragEnd}
    >
      {/* ============ DESKTOP: full multi-column board (no horizontal scroll) ============ */}
      <div className="hidden h-[74vh] grid-cols-5 gap-3 lg:grid">
        {STAGES.map((stage) => (
          <DesktopColumn key={stage.id} stage={stage} enquiries={byStage(stage.id)} onOpen={openDetail} />
        ))}
      </div>

      {/* ============ MOBILE / TABLET: premium icon stage tabs + single list ============ */}
      <div className="lg:hidden">
        <div className="grid grid-cols-5 gap-1.5">
          {STAGES.map((stage) => {
            const count = byStage(stage.id).length;
            const isActive = stage.id === selectedStage;
            const { Icon } = stage;
            return (
              <button
                key={stage.id}
                type="button"
                onClick={() => setSelectedStage(stage.id)}
                aria-pressed={isActive}
                className={clsx(
                  "flex flex-col items-center gap-1 rounded-xl border px-1 py-2.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                  isActive
                    ? stage.active
                    : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-400 dark:hover:bg-slate-800/50"
                )}
              >
                <span className="relative">
                  <Icon size={18} />
                  {count > 0 && (
                    <span className="absolute -right-2.5 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 text-[9px] font-bold text-white">
                      {count}
                    </span>
                  )}
                </span>
                <span className="w-full truncate text-center text-[10px] font-semibold leading-tight">{stage.label}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex items-center gap-2">
          <span className={clsx("h-2 w-2 rounded-full", selected.bar)} />
          <h3 className={clsx("text-sm font-bold", selected.text)}>{selected.label}</h3>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {selectedEnquiries.length}
          </span>
        </div>

        <div className="mt-3 flex flex-col gap-3">
          {selectedEnquiries.map((enquiry) => (
            <div
              key={enquiry.id}
              onClick={() => openDetail(enquiry.leadId)}
              className="cursor-pointer rounded-xl outline-none transition-transform active:scale-[0.99]"
            >
              <CardBody enquiry={enquiry} onMove={() => openStatusChange(enquiry)} />
            </div>
          ))}
          {selectedEnquiries.length === 0 && (
            <div className="flex h-28 items-center justify-center rounded-xl border-2 border-dashed border-slate-200 text-sm font-medium text-slate-400 dark:border-slate-700 dark:text-slate-600">
              No leads in {selected.label}
            </div>
          )}
        </div>
      </div>

      {/* Floating card that follows the pointer while dragging (desktop) */}
      <DragOverlay dropAnimation={{ duration: 200, easing: "cubic-bezier(0.22, 1, 0.36, 1)" }}>
        {activeEnquiry ? (
          <div className="w-[240px] rotate-2">
            <CardBody enquiry={activeEnquiry} dragging />
          </div>
        ) : null}
      </DragOverlay>

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
    </DndContext>
  );
}
