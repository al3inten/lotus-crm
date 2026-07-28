import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { DateTimePicker, DatePickerField } from "../common/DateTimePicker";
import { useState, useEffect, useRef } from "react";
import {
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  Car,
  Check,
  CircleSlash,
  FileCheck2,
  PackageCheck,
  PhoneCall,
  Save,
  Sparkles,
  Trophy,
  XCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import clsx from "clsx";
import { Modal } from "../common/Modal";
import { Input, Select, Textarea } from "../common/Input";
import { Switch } from "../common/Switch";
import { Button } from "../common/Button";
import { StatusBadge } from "../common/StatusBadge";
import { statusChangeFormSchema } from "../../schemas/enquiry.schema";
import type { StatusChangeFormValues } from "../../schemas/enquiry.schema";
import { ALLOWED_TRANSITIONS, LOSS_REASONS, STATUS_LABELS } from "../../types";
import type { EnquiryStatus, Enquiry } from "../../types";
import {
  useChangeStatus,
  useUpdateBookingDetails,
  useUpdateRetailDetails,
  useUpdateRtoDetails,
  useUpdateEnquiryDetails,
  enquiryKeys,
} from "../../hooks/useEnquiry";
import { useConsultants } from "../../hooks/useConsultants";
import { useQueryClient } from "@tanstack/react-query";
import * as enquiriesApi from "../../api/enquiries.api";
import { toast } from "sonner";

/** One icon per pipeline stage — used on the "Move to" pills and section headers so
 * every status reads consistently instead of a bare text label. */
const STATUS_ICONS: Record<EnquiryStatus, LucideIcon> = {
  NEW: Sparkles,
  UNDER_FOLLOW_UP: PhoneCall,
  APPOINTMENT_FIXED: CalendarClock,
  TEST_DRIVE: Car,
  BOOKED: BadgeCheck,
  RETAIL_DONE: FileCheck2,
  RTO_DONE: FileCheck2,
  DELIVERED: PackageCheck,
  CLOSED: CircleSlash,
};

/** A compact Yes/No pair for the finance checklist. */
function YesNo({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-slate-700 dark:text-slate-200">{label}</span>
      <div className="flex overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
        {([["Yes", true], ["No", false]] as const).map(([text, val]) => (
          <button
            key={text}
            type="button"
            onClick={() => onChange(val)}
            className={clsx(
              "px-3 py-1 text-xs font-semibold transition-colors",
              checked === val
                ? val
                  ? "bg-primary-600 text-white"
                  : "bg-slate-600 text-white"
                : "bg-white text-slate-500 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
            )}
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  );
}

// The date-stamped milestones and the label shown on their date picker. Retail and RTO dates
// are deliberately absent here — like Booking date, each is only set/edited inline once the
// enquiry has actually reached that stage (see the currentStatus === "RETAIL_DONE"/"RTO_DONE"
// blocks below), not during the transition into it. Delivery date has no later stage to defer
// to (Delivered is terminal), so it stays here, on the transition itself.
const DATE_MILESTONES: Partial<Record<EnquiryStatus, { field: "deliveredAt"; label: string }>> = {
  DELIVERED: { field: "deliveredAt", label: "Vehicle delivery date" },
};

interface StatusChangeModalProps {
  enquiryId: string;
  branchId: string;
  currentStatus: EnquiryStatus;
  isOpen: boolean;
  onClose: () => void;
  initialTargetStatus?: EnquiryStatus;
  /** Whether the enquiry has at least one completed test drive — required before Booking. */
  hasCompletedTestDrive?: boolean;
  /** Consultant already assigned to the enquiry — prefills the consultant dropdown. */
  currentConsultantId?: string;
  /** Full enquiry — used to render the Booking Details card inside the modal at the Booked stage. */
  enquiry?: Enquiry;
}

export function StatusChangeModal({
  enquiryId,
  branchId,
  currentStatus,
  isOpen,
  onClose,
  initialTargetStatus,
  hasCompletedTestDrive,
  currentConsultantId,
  enquiry,
}: StatusChangeModalProps) {
  const [outcome, setOutcome] = useState<"WON" | "LOST">("WON");
  // Feedback for the standalone "Save progress" action on the finance checklist — cleared
  // whenever the modal is reopened or the user changes something after saving.
  const [progressSaved, setProgressSaved] = useState(false);
  // Same idea for the Retail/RTO date fields: at RTO Done, the only next stage is Delivered,
  // whose date/DOB/job are all mandatory — so submitting the form just to save a corrected
  // RTO date forced the CR through Delivery's validation too. A standalone save avoids that.
  const [milestoneSaved, setMilestoneSaved] = useState<"RETAIL_DONE" | "RTO_DONE" | null>(null);
  // CR/ARM must tick this off — confirming every test drive on the Test Drives card is marked
  // Done — before the enquiry can move to Booked.
  const [testDrivesConfirmed, setTestDrivesConfirmed] = useState(false);
  const changeStatus = useChangeStatus(enquiryId);
  const updateBooking = useUpdateBookingDetails(enquiryId);
  const updateRetail = useUpdateRetailDetails(enquiryId);
  const updateRto = useUpdateRtoDetails(enquiryId);
  const updateDetails = useUpdateEnquiryDetails(enquiryId);
  const { data: consultants, isLoading: consultantsLoading } = useConsultants(branchId);
  const allowedNext = ALLOWED_TRANSITIONS[currentStatus];
  const noConsultants = !consultantsLoading && (consultants?.length ?? 0) === 0;

  const {
    register,
    control,
    handleSubmit,
    watch,
    getValues,
    setValue,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<StatusChangeFormValues>({
    resolver: zodResolver(statusChangeFormSchema),
  });

  // Only re-seed the form when the modal actually opens (false -> true) — not on every
  // enquiry refetch while it stays open. Save progress / Save milestone trigger a background
  // invalidate+refetch, which changes the `enquiry` reference; re-running reset() on that
  // would wipe the date the CR just picked (and saved) right back to whatever the stale
  // closure held, and would also flash "Saved" back to "Save progress" and reset toStatus.
  const wasOpenRef = useRef(false);
  useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      reset({
        toStatus: initialTargetStatus && allowedNext.includes(initialTargetStatus) ? initialTargetStatus : allowedNext[0],
        consultantId: currentConsultantId,
        // Prefill the booking-details fields (shown at the Booked stage) from the enquiry.
        // DatePickerField parses strictly as "yyyy-MM-dd" — the server sends a full ISO
        // timestamp, which date-fns' parse() rejects as Invalid Date, so slice it down to
        // just the date (otherwise the saved date silently fails to render).
        bookedAt: enquiry?.bookedAt ? enquiry.bookedAt.slice(0, 10) : undefined,
        financeRequired: enquiry?.financeRequired ?? false,
        financeDocumentCollected: enquiry?.financeDocumentCollected ?? undefined,
        financeLoanApproved: enquiry?.financeLoanApproved ?? undefined,
        financeDoReceived: enquiry?.financeDoReceived ?? undefined,
        // Prefill the retail date (shown at the Retail Done stage) from the enquiry.
        retailDoneAt: enquiry?.retailDoneAt ? enquiry.retailDoneAt.slice(0, 10) : undefined,
        // Prefill the RTO date + vehicle colour (shown at the RTO Done stage) from the enquiry.
        rtoDoneAt: enquiry?.rtoDoneAt ? enquiry.rtoDoneAt.slice(0, 10) : undefined,
        colour: enquiry?.colour ?? undefined,
        // Delivery-stage customer details, prefilled from the lead.
        dob: enquiry?.lead?.dob ? enquiry.lead.dob.slice(0, 10) : undefined,
        profession: enquiry?.lead?.profession ?? undefined,
      });
      setOutcome("WON");
      setTestDrivesConfirmed(false);
      setProgressSaved(false);
      setMilestoneSaved(null);
    }
    wasOpenRef.current = isOpen;
  }, [isOpen, initialTargetStatus, allowedNext, currentConsultantId, enquiry, reset]);

  const toStatus = watch("toStatus");
  const financeRequired = watch("financeRequired");
  const dateMilestone = DATE_MILESTONES[toStatus];

  // react-hook-form's `isSubmitting` doesn't update fast enough to stop a second click fired
  // in the same tick as the first (e.g. a fast double-click before the button re-renders
  // disabled) — that second call re-enters with the same stale `currentStatus` closure and
  // re-submits `changeStatus` after the first call already moved the enquiry on, producing a
  // "Cannot move from X to X" 422. This ref blocks re-entrancy synchronously.
  const submittingRef = useRef(false);

  const onSubmit = async (values: StatusChangeFormValues) => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    try {
      await submit(values);
    } finally {
      submittingRef.current = false;
    }
  };

  const queryClient = useQueryClient();

  const submit = async (values: StatusChangeFormValues) => {
    // `currentStatus` is a prop captured when the modal opened — if the enquiry moved on
    // since then (another tab/user, or a stale cache from before this modal opened), every
    // branch below that keys off it (which detail-fields to save, what toStatus is even
    // valid) is wrong, and the changeStatus call fails with a confusing "same status" 422.
    // Re-check against the server right before submitting rather than trusting the prop.
    const fresh = await enquiriesApi.fetchEnquiry(enquiryId);
    queryClient.setQueryData(enquiryKeys.detail(enquiryId), fresh);
    if (fresh.status !== currentStatus) {
      toast.error(`This enquiry has already moved to ${STATUS_LABELS[fresh.status]}. Refreshing — please try again.`);
      onClose();
      return;
    }
    // A consultant must be allocated when the appointment is fixed (server enforces this too).
    if (values.toStatus === "APPOINTMENT_FIXED" && !values.consultantId) {
      setError("consultantId", { message: "Assign a consultant before fixing the appointment" });
      return;
    }
    // A consultant must be chosen when logging the first test drive (server enforces this too).
    if (values.toStatus === "TEST_DRIVE" && !values.consultantId) {
      setError("consultantId", { message: "Select a consultant for the test drive" });
      return;
    }
    // A test drive must be marked Done (via the Test Drives card) before the enquiry can be
    // booked — server enforces this too.
    if (values.toStatus === "BOOKED" && !hasCompletedTestDrive) {
      setError("toStatus", { message: "Mark a test drive as Done (Test Drives card) before booking." });
      return;
    }
    // CR/ARM confirmation gate: they must tick the toggle affirming all test drives are Done.
    if (values.toStatus === "BOOKED" && !testDrivesConfirmed) {
      setError("toStatus", { message: "Confirm all test drives are marked as Done before booking." });
      return;
    }
    // Leaving Booked for Retail Done requires the finance checklist to be fully resolved when
    // finance was needed — a status change alone must not skip past outstanding paperwork.
    if (currentStatus === "BOOKED" && values.toStatus === "RETAIL_DONE" && values.financeRequired) {
      const financeComplete =
        !!values.financeDocumentCollected && !!values.financeLoanApproved && !!values.financeDoReceived;
      if (!financeComplete) {
        setError("toStatus", {
          message: "Complete the finance checklist (Documents collected, Loan approved, DO received) before moving to Retail Done.",
        });
        return;
      }
    }
    // The enquiry must not be marked Delivered (Won) until the customer's DOB and job are
    // captured, alongside the vehicle delivery date — collecting these afterward would let
    // the status read "Won" before the CR has actually gathered this information.
    if (values.toStatus === "DELIVERED") {
      if (!values.deliveredAt) {
        setError("deliveredAt", { message: "Vehicle delivery date is required" });
        return;
      }
      if (!values.dob) {
        setError("dob", { message: "Customer date of birth is required" });
        return;
      }
      if (!values.profession?.trim()) {
        setError("profession", { message: "Customer job is required" });
        return;
      }
    }
    const toIso = (v?: string) => (v ? new Date(v).toISOString() : undefined);
    // Delivery-stage customer details are saved on the lead (DOB + job) before the status move.
    if (values.toStatus === "DELIVERED") {
      await updateDetails.mutateAsync({
        dob: values.dob ? new Date(values.dob).toISOString() : undefined,
        profession: values.profession?.trim(),
      });
    }
    // At the Booked stage the popup also edits booking details — save those first (same one
    // "Update status" click), then apply the status move.
    if (currentStatus === "BOOKED") {
      await updateBooking.mutateAsync({
        bookedAt: toIso(values.bookedAt),
        financeRequired: values.financeRequired,
        financeDocumentCollected: values.financeRequired ? !!values.financeDocumentCollected : undefined,
        financeLoanApproved: values.financeRequired ? !!values.financeLoanApproved : undefined,
        financeDoReceived: values.financeRequired ? !!values.financeDoReceived : undefined,
      });
    }
    // Same pattern at the Retail Done stage — the retail date is edited here, not during the
    // Booked -> Retail Done transition itself.
    if (currentStatus === "RETAIL_DONE") {
      await updateRetail.mutateAsync({ retailDoneAt: toIso(values.retailDoneAt) });
    }
    // Same pattern at the RTO Done stage — the RTO date and vehicle colour are edited here,
    // not during the Retail Done -> RTO Done transition itself.
    if (currentStatus === "RTO_DONE") {
      await updateRto.mutateAsync({ rtoDoneAt: toIso(values.rtoDoneAt), colour: values.colour?.trim() });
    }
    await changeStatus.mutateAsync({
      toStatus: values.toStatus,
      note: values.note,
      lossReason: values.toStatus === "CLOSED" && outcome === "LOST" ? values.lossReason || undefined : undefined,
      followUpDueAt: toIso(values.followUpDueAt),
      appointmentAt: toIso(values.appointmentAt),
      consultantId: values.consultantId,
      testDriveScheduledAt: toIso(values.testDriveScheduledAt),
      retailDoneAt: toIso(values.retailDoneAt),
      rtoDoneAt: toIso(values.rtoDoneAt),
      deliveredAt: toIso(values.deliveredAt),
    });
    reset();
    setOutcome("WON");
    onClose();
  };

  // Saves the booking/finance checklist as-is, without requiring it to be complete and
  // without moving the status — finance paperwork (documents, loan approval, DO) often
  // arrives over several days, so the CR needs to record whatever's done today and come
  // back to it later rather than losing progress or being forced through a status change.
  const handleSaveProgress = async () => {
    const values = getValues();
    const toIso = (v?: string) => (v ? new Date(v).toISOString() : undefined);
    await updateBooking.mutateAsync({
      bookedAt: toIso(values.bookedAt),
      financeRequired: values.financeRequired,
      // Left as-is (not coerced to false) — an item the CR hasn't answered yet should stay
      // unanswered (null in the DB) rather than being recorded as an explicit "No".
      financeDocumentCollected: values.financeRequired ? values.financeDocumentCollected : undefined,
      financeLoanApproved: values.financeRequired ? values.financeLoanApproved : undefined,
      financeDoReceived: values.financeRequired ? values.financeDoReceived : undefined,
    });
    setProgressSaved(true);
    setTimeout(() => setProgressSaved(false), 3000);
  };

  // Saves the Retail/RTO stage's own fields as a standalone action, without moving the
  // status — the "Move to" default from Retail Done / RTO Done is the next stage, whose own
  // requirements would otherwise have to be satisfied just to correct a value on the CURRENT
  // stage.
  const handleSaveMilestone = async (stage: "RETAIL_DONE" | "RTO_DONE") => {
    const toIso = (v?: string) => (v ? new Date(v).toISOString() : undefined);
    if (stage === "RETAIL_DONE") {
      await updateRetail.mutateAsync({ retailDoneAt: toIso(getValues("retailDoneAt")) });
    } else {
      await updateRto.mutateAsync({ rtoDoneAt: toIso(getValues("rtoDoneAt")), colour: getValues("colour")?.trim() });
    }
    setMilestoneSaved(stage);
    setTimeout(() => setMilestoneSaved(null), 3000);
  };

  if (allowedNext.length === 0) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Update status" maxWidth="max-w-md">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          This enquiry is in a terminal state and can't be moved further.
        </p>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Update status"
      maxWidth="max-w-md"
      footer={
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="status-change-form" isLoading={isSubmitting}>
            Update status
          </Button>
        </div>
      }
    >
      <form id="status-change-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {/* Current → New summary */}
        <div className="flex items-center justify-center gap-3 rounded-xl border border-primary-100 bg-primary-50/60 px-4 py-3.5 dark:border-primary-500/20 dark:bg-primary-500/5">
          <StatusBadge status={currentStatus} />
          <ArrowRight size={16} className="shrink-0 text-primary-400 dark:text-primary-500" />
          {toStatus ? (
            <StatusBadge status={toStatus} lossReason={toStatus === "CLOSED" ? (outcome === "LOST" ? "pending" : null) : undefined} />
          ) : (
            <span className="text-sm text-slate-400">—</span>
          )}
        </div>

        {/* Move to — icon pills instead of a plain dropdown, so every option (usually
            just 1-3) is visible and selectable at a glance. */}
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Move to</p>
          <div className="flex flex-wrap gap-2">
            {allowedNext.map((status) => {
              const Icon = STATUS_ICONS[status];
              const active = toStatus === status;
              return (
                <button
                  key={status}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setValue("toStatus", status, { shouldValidate: true })}
                  className={clsx(
                    "flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50",
                    active
                      ? "border-primary-600 bg-primary-600 text-white shadow-sm shadow-primary-600/25"
                      : "border-slate-200 bg-white text-slate-600 hover:border-primary-200 hover:bg-primary-50 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-300 dark:hover:border-primary-500/30 dark:hover:bg-primary-500/10"
                  )}
                >
                  <Icon size={14} />
                  {STATUS_LABELS[status]}
                </button>
              );
            })}
          </div>
          {errors.toStatus?.message && <p className="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400">{errors.toStatus.message}</p>}
        </div>

        {/* Booking details (date + finance) — editable inline at the Booked stage; saved on the
            same "Update status" click before the status move is applied. */}
        {currentStatus === "BOOKED" && (
          <>
            <Controller
              control={control}
              name="bookedAt"
              render={({ field }) => (
                <DatePickerField label="Booking date" value={field.value} onChange={field.onChange} />
              )}
            />
            <div className="flex flex-col gap-3 rounded-xl border border-primary-100 bg-primary-50/60 p-3 dark:border-primary-500/20 dark:bg-primary-500/10">
              <Switch
                checked={!!financeRequired}
                onChange={(v) => setValue("financeRequired", v)}
                label="Finance needed"
                description="Turn on if the customer is financing this purchase."
              />
              {financeRequired && (
                <div className="flex flex-col gap-2 border-t border-primary-100 pt-3 dark:border-primary-500/20">
                  <YesNo
                    label="Documents collected"
                    checked={!!watch("financeDocumentCollected")}
                    onChange={(v) => {
                      setValue("financeDocumentCollected", v);
                      setProgressSaved(false);
                    }}
                  />
                  <YesNo
                    label="Loan approved"
                    checked={!!watch("financeLoanApproved")}
                    onChange={(v) => {
                      setValue("financeLoanApproved", v);
                      setProgressSaved(false);
                    }}
                  />
                  <YesNo
                    label="DO received"
                    checked={!!watch("financeDoReceived")}
                    onChange={(v) => {
                      setValue("financeDoReceived", v);
                      setProgressSaved(false);
                    }}
                  />
                  <div className="mt-1 flex flex-wrap items-center justify-between gap-2 border-t border-primary-100 pt-3 dark:border-primary-500/20">
                    <p className="text-xs text-primary-700/80 dark:text-primary-300/80">
                      Finance paperwork can take a few days — save what's done so far without changing the status.
                    </p>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      icon={progressSaved ? <Check size={13} /> : <Save size={13} />}
                      isLoading={updateBooking.isPending}
                      onClick={handleSaveProgress}
                    >
                      {progressSaved ? "Saved" : "Save progress"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Retail date — editable inline at the Retail Done stage; saved either via the
            standalone Save progress button (no status change) or on the "Update status" click. */}
        {currentStatus === "RETAIL_DONE" && (
          <div className="flex flex-col gap-2">
            <Controller
              control={control}
              name="retailDoneAt"
              render={({ field }) => (
                <DatePickerField label="Retail date" value={field.value} onChange={field.onChange} />
              )}
            />
            <div className="flex justify-end">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                icon={milestoneSaved === "RETAIL_DONE" ? <Check size={13} /> : <Save size={13} />}
                isLoading={updateRetail.isPending}
                onClick={() => handleSaveMilestone("RETAIL_DONE")}
              >
                {milestoneSaved === "RETAIL_DONE" ? "Saved" : "Save progress"}
              </Button>
            </div>
          </div>
        )}

        {/* RTO date + vehicle colour — editable inline at the RTO Done stage; saved either via
            the standalone Save progress button (no status change) or on the "Update status"
            click. Needed because the only next stage from here is Delivered, whose date is
            mandatory — without this button, saving the RTO date forced that validation too. */}
        {currentStatus === "RTO_DONE" && (
          <div className="flex flex-col gap-2">
            <Controller
              control={control}
              name="rtoDoneAt"
              render={({ field }) => (
                <DatePickerField label="RTO date" value={field.value} onChange={field.onChange} />
              )}
            />
            <Input label="Colour" placeholder="e.g. Pearl White" {...register("colour")} />
            <div className="flex justify-end">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                icon={milestoneSaved === "RTO_DONE" ? <Check size={13} /> : <Save size={13} />}
                isLoading={updateRto.isPending}
                onClick={() => handleSaveMilestone("RTO_DONE")}
              >
                {milestoneSaved === "RTO_DONE" ? "Saved" : "Save progress"}
              </Button>
            </div>
          </div>
        )}

        {/* Can't advance to Retail Done until the finance checklist is fully resolved. */}
        {currentStatus === "BOOKED" &&
          toStatus === "RETAIL_DONE" &&
          financeRequired &&
          !(watch("financeDocumentCollected") && watch("financeLoanApproved") && watch("financeDoReceived")) && (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-300">
              Mark Documents collected, Loan approved, and DO received as Yes before moving to Retail Done.
            </p>
          )}

        {toStatus === "TEST_DRIVE" && (
          <div className="flex flex-col gap-3 rounded-xl border border-primary-100 bg-primary-50/60 p-3 dark:border-primary-500/20 dark:bg-primary-500/10">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-primary-700 dark:text-primary-300">
              <CalendarClock size={13} /> Schedule the test drive
            </p>
            <Controller
              control={control}
              name="testDriveScheduledAt"
              render={({ field }) => (
                <DateTimePicker
                  label="Test drive date & time"
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.testDriveScheduledAt?.message}
                />
              )}
            />
            <Select
              label="Consultant"
              required
              disabled={consultantsLoading || noConsultants}
              error={errors.consultantId?.message}
              {...register("consultantId")}
            >
              <option value="">
                {consultantsLoading ? "Loading consultants…" : noConsultants ? "No consultants in this branch" : "Select consultant"}
              </option>
              {consultants?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
            <p className="text-xs font-medium text-primary-600 dark:text-primary-400">
              This logs the first test drive. Log each additional drive and mark one Done from the Test Drives card below.
            </p>
          </div>
        )}

        {/* Can't book until a test drive is marked Done on the Test Drives card */}
        {toStatus === "BOOKED" && !hasCompletedTestDrive && (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-300">
            Mark at least one test drive as <strong>Done</strong> before booking (Test Drives card above).
          </p>
        )}

        {/* CR/ARM confirmation: all test drives on the Test Drives card are marked Done */}
        {toStatus === "BOOKED" && hasCompletedTestDrive && (
          <div className="rounded-xl border border-primary-100 bg-primary-50/60 p-3 dark:border-primary-500/20 dark:bg-primary-500/10">
            <Switch
              checked={testDrivesConfirmed}
              onChange={setTestDrivesConfirmed}
              label="All test drives marked as Done"
              description="Confirm every test drive on the Test Drives card is marked Done before booking."
            />
          </div>
        )}

        {/* Date for the later milestones (Retail / RTO / Delivered). Booking date + finance
            are captured on the Booked stage's Booking Details card, not here. */}
        {dateMilestone && (
          <Controller
            control={control}
            name={dateMilestone.field}
            render={({ field }) => (
              <DatePickerField
                label={dateMilestone.label}
                value={field.value}
                onChange={field.onChange}
                error={errors[dateMilestone.field]?.message}
              />
            )}
          />
        )}

        {/* Delivery: mandatory customer details for post-sale birthday/anniversary celebrations.
            Required to reach Delivered — the enquiry must not read "Won" before these are captured. */}
        {toStatus === "DELIVERED" && (
          <div className="flex flex-col gap-3 rounded-xl border border-primary-100 bg-primary-50/60 p-3 dark:border-primary-500/20 dark:bg-primary-500/10">
            <p className="text-xs font-semibold text-primary-700 dark:text-primary-300">
              Customer details — used for birthday &amp; anniversary celebrations.
            </p>
            <Controller
              control={control}
              name="dob"
              render={({ field }) => (
                <DatePickerField
                  label="Customer date of birth"
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.dob?.message}
                  captionLayout="dropdown"
                  startMonth={new Date(1940, 0)}
                  endMonth={new Date()}
                />
              )}
            />
            <Input label="Customer job" error={errors.profession?.message} {...register("profession")} />
          </div>
        )}

        {/* Appointment scheduling (G3) */}
        {toStatus === "APPOINTMENT_FIXED" && (
          <div className="flex flex-col gap-3 rounded-xl border border-primary-100 bg-primary-50/60 p-3 dark:border-primary-500/20 dark:bg-primary-500/10">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-primary-700 dark:text-primary-300">
              <CalendarClock size={13} /> Schedule the appointment
            </p>
            <Controller
              control={control}
              name="appointmentAt"
              render={({ field }) => (
                <DateTimePicker
                  label="Appointment date & time"
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.appointmentAt?.message}
                />
              )}
            />
            <Select
              label="Showroom consultant"
              required
              disabled={consultantsLoading || noConsultants}
              error={errors.consultantId?.message}
              {...register("consultantId")}
            >
              <option value="">
                {consultantsLoading ? "Loading consultants…" : noConsultants ? "No consultants in this branch" : "Select consultant"}
              </option>
              {consultants?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
            {noConsultants && (
              <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
                This branch has no consultants yet. Add one under Branches → Employees (role “Consultant”), then fix the appointment.
              </p>
            )}
          </div>
        )}

        {/* Next follow-up date */}
        {toStatus === "UNDER_FOLLOW_UP" && (
          <Controller
            control={control}
            name="followUpDueAt"
            render={({ field }) => (
              <DateTimePicker
                label="Next follow-up due"
                value={field.value}
                onChange={field.onChange}
                error={errors.followUpDueAt?.message}
              />
            )}
          />
        )}

        {/* Close outcome */}
        {toStatus === "CLOSED" && (
          <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setOutcome("WON")}
                aria-pressed={outcome === "WON"}
                className={clsx(
                  "flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors",
                  outcome === "WON"
                    ? "border-primary-600 bg-primary-600 text-white"
                    : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-400"
                )}
              >
                <Trophy size={15} /> Won
              </button>
              <button
                type="button"
                onClick={() => setOutcome("LOST")}
                aria-pressed={outcome === "LOST"}
                className={clsx(
                  "flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors",
                  outcome === "LOST"
                    ? "border-slate-500 bg-slate-600 text-white dark:border-slate-500 dark:bg-slate-600"
                    : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-400"
                )}
              >
                <XCircle size={15} /> Lost
              </button>
            </div>

            {outcome === "LOST" && (
              <Select label="Loss reason" error={errors.lossReason?.message} {...register("lossReason")} required>
                <option value="">Select a reason</option>
                {LOSS_REASONS.map((reason) => (
                  <option key={reason} value={reason}>
                    {reason.replaceAll("_", " ")}
                  </option>
                ))}
              </Select>
            )}
          </div>
        )}

        <Textarea label="Note (optional)" error={errors.note?.message} {...register("note")} />
      </form>
    </Modal>
  );
}
