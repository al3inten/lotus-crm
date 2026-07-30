import { useState } from "react";
import clsx from "clsx";
import { Check, ChevronDown, X } from "lucide-react";

import { Button } from "../../common/Button";
import { Select, Textarea } from "../../common/Input";
import { DateTimePicker } from "../../common/DateTimePicker";
import { useUpdateKeyDate } from "../../../hooks/useEnquiry";
import type { DateFieldKey, Enquiry, EnquiryStatus } from "../../../types";

interface KeyDateSection {
  field: DateFieldKey;
  title: string;
  dateValue: string | null;
  /** A single muted summary line — kept short, not a mini table. */
  summary?: string;
  showConsultant?: boolean;
  /** Whether the pipeline has actually gotten to this milestone yet. Unreached milestones
   * are shown as "Not available" and can't be edited — there's nothing to correct yet. */
  reached: boolean;
}

const yesNo = (v: boolean | null | undefined) => (v == null ? "—" : v ? "Yes" : "No");

// Same forward-pipeline ordering as LeadPipelinePanel's STAGE_RANK — used here to tell
// whether a milestone has been *reached*, even if its date was left blank at the time
// (e.g. a CR fixes an appointment via the status modal without picking a date).
const STAGE_RANK: Record<EnquiryStatus, number> = {
  NEW: 0,
  UNDER_FOLLOW_UP: 0,
  APPOINTMENT_FIXED: 1,
  TEST_DRIVE: 2,
  BOOKED: 3,
  RETAIL_DONE: 4,
  RTO_DONE: 5,
  DELIVERED: 6,
  CLOSED_TEMP: -1,
  LOST: -1,
};

function reachedRank(enquiry: Enquiry): number {
  const historyMax = (enquiry.statusHistory ?? []).reduce((max, h) => Math.max(max, STAGE_RANK[h.toStatus]), -Infinity);
  return Math.max(historyMax, STAGE_RANK[enquiry.status]);
}

/** Always returns all three milestones — unreached ones carry `reached: false` and render
 * as "Not available" with no edit affordance, rather than being hidden or left editable
 * before the pipeline actually gets there. Test Drive is deliberately left out: it already
 * has its own tab. */
function buildSections(enquiry: Enquiry): KeyDateSection[] {
  const rank = reachedRank(enquiry);
  const bookingHistoryDate = enquiry.statusHistory?.find((h) => h.toStatus === "BOOKED")?.createdAt;
  const retailHistoryDate = enquiry.statusHistory?.find((h) => h.toStatus === "RETAIL_DONE")?.createdAt;

  const appointmentReached = enquiry.appointmentScheduled || !!enquiry.appointmentAt || rank >= STAGE_RANK.APPOINTMENT_FIXED;
  const bookingReached = !!enquiry.bookedAt || !!bookingHistoryDate || rank >= STAGE_RANK.BOOKED;
  const retailReached = !!enquiry.retailDoneAt || !!retailHistoryDate || rank >= STAGE_RANK.RETAIL_DONE;

  return [
    {
      field: "APPOINTMENT_AT",
      title: "Appointment",
      dateValue: enquiry.appointmentAt ?? null,
      showConsultant: appointmentReached,
      reached: appointmentReached,
    },
    {
      field: "BOOKED_AT",
      title: "Booking",
      dateValue: enquiry.bookedAt ?? bookingHistoryDate ?? null,
      summary: bookingReached
        ? enquiry.financeRequired
          ? `Finance: docs ${yesNo(enquiry.financeDocumentCollected)} · loan ${yesNo(enquiry.financeLoanApproved)} · DO ${yesNo(enquiry.financeDoReceived)}`
          : "Finance not required"
        : undefined,
      reached: bookingReached,
    },
    {
      field: "RETAIL_DONE_AT",
      title: "Retail",
      dateValue: enquiry.retailDoneAt ?? retailHistoryDate ?? null,
      reached: retailReached,
    },
  ];
}

function EditSectionForm({
  section,
  enquiryId,
  onDone,
}: {
  section: KeyDateSection;
  enquiryId: string;
  onDone: () => void;
}) {
  const [date, setDate] = useState<string | undefined>(section.dateValue ?? undefined);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const updateKeyDate = useUpdateKeyDate(enquiryId);

  const onSubmit = async () => {
    if (!date) return setError("Pick a date.");
    if (!reason.trim()) return setError("A reason is required for this change.");
    setError(null);
    try {
      await updateKeyDate.mutateAsync({ field: section.field, date, reason: reason.trim() });
      onDone();
    } catch (err) {
      // Without this the rejection escaped as an unhandled promise: the form just sat there
      // looking idle while the request had already failed.
      setError(
        (err as { response?: { data?: { error?: string } } }).response?.data?.error ??
          "Could not update this date. Please try again."
      );
    }
  };

  return (
    <div className="mt-3 flex flex-col gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 dark:border-slate-800/60 dark:bg-slate-900/30">
      <DateTimePicker label={`${section.title} date`} value={date} onChange={setDate} />
      <Textarea
        label="Reason for change"
        placeholder="Why is this date being updated?"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        rows={2}
      />
      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
      <div className="flex items-center gap-3">
        <Button type="button" size="sm" onClick={onSubmit} isLoading={updateKeyDate.isPending} className="w-fit">
          Save
        </Button>
        <button
          type="button"
          onClick={onDone}
          className="text-xs font-medium text-slate-500 transition-colors hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function ConsultantField({
  enquiry,
  consultants,
  canReassign,
  onUpdateConsultant,
  isUpdatingConsultant,
}: {
  enquiry: Enquiry;
  consultants?: { id: string; name: string }[];
  canReassign: boolean;
  onUpdateConsultant: (consultantId: string) => void;
  isUpdatingConsultant: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(enquiry.consultantId ?? "");

  if (editing) {
    return (
      <div className="mt-1.5 flex items-center gap-1.5">
        <Select value={value} onChange={(e) => setValue(e.target.value)} className="w-full text-xs">
          <option value="">Select…</option>
          {consultants?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
        <button
          type="button"
          aria-label="Save consultant"
          disabled={!value || isUpdatingConsultant}
          onClick={() => {
            onUpdateConsultant(value);
            setEditing(false);
          }}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-teal-600 text-white transition-colors hover:bg-teal-500 disabled:opacity-40"
        >
          <Check size={12} />
        </button>
        <button
          type="button"
          aria-label="Cancel"
          onClick={() => setEditing(false)}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
        >
          <X size={12} />
        </button>
      </div>
    );
  }

  return (
    <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
      Consultant: <span className="text-slate-600 dark:text-slate-300">{enquiry.consultant?.name ?? "—"}</span>
      {canReassign && (
        <button
          type="button"
          onClick={() => {
            setValue(enquiry.consultantId ?? "");
            setEditing(true);
          }}
          className="ml-1.5 font-medium text-teal-600 transition-colors hover:text-teal-700 hover:underline dark:text-teal-400 dark:hover:text-teal-300"
        >
          Change
        </button>
      )}
    </p>
  );
}

function KeyDateRow({
  section,
  enquiry,
  consultants,
  canReassign,
  onUpdateConsultant,
  isUpdatingConsultant,
}: {
  section: KeyDateSection;
  enquiry: Enquiry;
  consultants?: { id: string; name: string }[];
  canReassign: boolean;
  onUpdateConsultant: (consultantId: string) => void;
  isUpdatingConsultant: boolean;
}) {
  const [mode, setMode] = useState<"idle" | "editing">("idle");

  return (
    <div className="py-4 first:pt-0 last:pb-0">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className={clsx("text-[13px] font-semibold", section.reached ? "text-slate-900 dark:text-white" : "text-slate-400 dark:text-slate-500")}>
            {section.title}
          </p>
          <p className={clsx("mt-0.5 text-sm", section.reached ? "text-slate-600 dark:text-slate-300" : "text-slate-400 dark:text-slate-500")}>
            {!section.reached
              ? "Not available"
              : section.dateValue
                ? new Date(section.dateValue).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
                : "Date not set"}
          </p>
          {section.summary && <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{section.summary}</p>}
          {section.showConsultant && (
            <ConsultantField
              enquiry={enquiry}
              consultants={consultants}
              canReassign={canReassign}
              onUpdateConsultant={onUpdateConsultant}
              isUpdatingConsultant={isUpdatingConsultant}
            />
          )}
        </div>
        {section.reached && (
          <button
            type="button"
            onClick={() => setMode(mode === "editing" ? "idle" : "editing")}
            className="shrink-0 text-xs font-medium text-teal-600 transition-colors hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300"
          >
            {mode === "editing" ? "Cancel" : section.dateValue ? "Edit" : "Set date"}
          </button>
        )}
      </div>

      {mode === "editing" && (
        <EditSectionForm section={section} enquiryId={enquiry.id} onDone={() => setMode("idle")} />
      )}
    </div>
  );
}

/**
 * Activity-tab pane for the pipeline's key milestones (Appointment / Booking / Retail).
 * Meant to be embedded as one tab's content — no outer Card chrome, the tab bar above
 * already carries the "Key Dates" label. All three milestones always show; the ones the
 * pipeline hasn't reached yet read "Not available" and have no edit control — there's
 * nothing to correct before the flow actually gets there.
 *
 * A reached row with a still-blank date (e.g. status moved to Appointment Fixed without
 * picking a date) reads "Date not set" with a "Set date" affordance instead. Any date can
 * be corrected inline with a required reason, logged to DateChangeHistory and surfaced
 * again in the Activity Timeline.
 */
export function KeyDatesEditCard({
  enquiry,
  consultants,
  canReassign,
  onUpdateConsultant,
  isUpdatingConsultant,
}: {
  enquiry: Enquiry;
  consultants?: { id: string; name: string }[];
  canReassign: boolean;
  onUpdateConsultant: (consultantId: string) => void;
  isUpdatingConsultant: boolean;
}) {
  const sections = buildSections(enquiry);
  const history = enquiry.dateChangeHistory ?? [];
  const [showHistory, setShowHistory] = useState(false);

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto [scrollbar-width:thin]">
        <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800/60">
          {sections.map((section) => (
            <KeyDateRow
              key={section.field}
              section={section}
              enquiry={enquiry}
              consultants={consultants}
              canReassign={canReassign}
              onUpdateConsultant={onUpdateConsultant}
              isUpdatingConsultant={isUpdatingConsultant}
            />
          ))}
        </div>

        {history.length > 0 && (
          <div className="mt-3 border-t border-slate-100 pt-3 dark:border-slate-800/60">
            <button
              type="button"
              onClick={() => setShowHistory((v) => !v)}
              className="flex items-center gap-1 text-xs font-medium text-slate-500 transition-colors hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
            >
              <ChevronDown size={13} className={showHistory ? "rotate-180 transition-transform" : "transition-transform"} />
              {showHistory ? "Hide" : "Show"} update history ({history.length})
            </button>

            {showHistory && (
              <ul className="mt-2 flex flex-col gap-1.5">
                {history.map((h) => (
                  <li key={h.id} className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                    <span className="font-medium text-slate-700 dark:text-slate-300">{h.changedBy?.name ?? "System"}</span>{" "}
                    changed <span className="font-medium">{h.field.replaceAll("_", " ").toLowerCase()}</span> to{" "}
                    {new Date(h.newValue).toLocaleString()}
                    {h.oldValue && <> (was {new Date(h.oldValue).toLocaleString()})</>} — <span className="italic">{h.reason}</span>
                    <span className="text-slate-400 dark:text-slate-500"> · {new Date(h.createdAt).toLocaleDateString()}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
