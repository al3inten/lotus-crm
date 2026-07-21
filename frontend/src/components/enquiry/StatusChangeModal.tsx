import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { DateTimePicker, DatePickerField } from "../common/DateTimePicker";
import { useState, useEffect } from "react";
import { ArrowRight, CalendarClock, Trophy, XCircle } from "lucide-react";
import clsx from "clsx";
import { Modal } from "../common/Modal";
import { Select, Textarea } from "../common/Input";
import { Switch } from "../common/Switch";
import { Button } from "../common/Button";
import { StatusBadge } from "../common/StatusBadge";
import { statusChangeFormSchema } from "../../schemas/enquiry.schema";
import type { StatusChangeFormValues } from "../../schemas/enquiry.schema";
import { ALLOWED_TRANSITIONS, LOSS_REASONS, STATUS_LABELS } from "../../types";
import type { EnquiryStatus } from "../../types";
import { useChangeStatus } from "../../hooks/useEnquiry";
import { useBranchStaff } from "../../hooks/useUsers";

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
                  ? "bg-emerald-600 text-white"
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

// The date-stamped milestones and the label shown on their date picker.
const DATE_MILESTONES: Partial<Record<EnquiryStatus, { field: "bookedAt" | "retailDoneAt" | "rtoDoneAt" | "deliveredAt"; label: string }>> = {
  BOOKED: { field: "bookedAt", label: "Booking date" },
  RETAIL_DONE: { field: "retailDoneAt", label: "Retail date" },
  RTO_DONE: { field: "rtoDoneAt", label: "RTO date" },
  DELIVERED: { field: "deliveredAt", label: "Delivery date" },
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
}

export function StatusChangeModal({
  enquiryId,
  branchId,
  currentStatus,
  isOpen,
  onClose,
  initialTargetStatus,
  hasCompletedTestDrive,
}: StatusChangeModalProps) {
  const [outcome, setOutcome] = useState<"WON" | "LOST">("WON");
  const changeStatus = useChangeStatus(enquiryId);
  const { data: consultants, isLoading: consultantsLoading } = useBranchStaff(branchId, "CONSULTANT");
  const allowedNext = ALLOWED_TRANSITIONS[currentStatus];
  const noConsultants = !consultantsLoading && (consultants?.length ?? 0) === 0;

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<StatusChangeFormValues>({
    resolver: zodResolver(statusChangeFormSchema),
  });

  useEffect(() => {
    if (isOpen) {
      reset({
        toStatus: initialTargetStatus && allowedNext.includes(initialTargetStatus) ? initialTargetStatus : allowedNext[0],
        financeRequired: false,
      });
      setOutcome("WON");
    }
  }, [isOpen, initialTargetStatus, allowedNext, reset]);

  const toStatus = watch("toStatus");
  const financeRequired = watch("financeRequired");
  const dateMilestone = DATE_MILESTONES[toStatus];

  const onSubmit = async (values: StatusChangeFormValues) => {
    // A consultant must be allocated when the appointment is fixed (server enforces this too).
    if (values.toStatus === "APPOINTMENT_FIXED" && !values.consultantId) {
      setError("consultantId", { message: "Assign a consultant before fixing the appointment" });
      return;
    }
    // A test drive must be marked Done (via the Test Drives card) before the enquiry can be
    // booked — server enforces this too.
    if (values.toStatus === "BOOKED" && !hasCompletedTestDrive) {
      setError("toStatus", { message: "Mark a test drive as Done (Test Drives card) before booking." });
      return;
    }
    const toIso = (v?: string) => (v ? new Date(v).toISOString() : undefined);
    await changeStatus.mutateAsync({
      toStatus: values.toStatus,
      note: values.note,
      lossReason: values.toStatus === "CLOSED" && outcome === "LOST" ? values.lossReason || undefined : undefined,
      followUpDueAt: toIso(values.followUpDueAt),
      appointmentAt: toIso(values.appointmentAt),
      consultantId: values.consultantId,
      bookedAt: toIso(values.bookedAt),
      retailDoneAt: toIso(values.retailDoneAt),
      rtoDoneAt: toIso(values.rtoDoneAt),
      deliveredAt: toIso(values.deliveredAt),
      // Finance answers only travel with the Booked transition.
      ...(values.toStatus === "BOOKED"
        ? {
            financeRequired: values.financeRequired,
            financeDocumentCollected: values.financeRequired ? !!values.financeDocumentCollected : undefined,
            financeLoanApproved: values.financeRequired ? !!values.financeLoanApproved : undefined,
            financeDoReceived: values.financeRequired ? !!values.financeDoReceived : undefined,
          }
        : {}),
    });
    reset();
    setOutcome("WON");
    onClose();
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
    <Modal isOpen={isOpen} onClose={onClose} title="Update status" maxWidth="max-w-md">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {/* Current → New summary */}
        <div className="flex items-center justify-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/50">
          <StatusBadge status={currentStatus} />
          <ArrowRight size={16} className="text-slate-400" />
          {toStatus ? (
            <StatusBadge status={toStatus} lossReason={toStatus === "CLOSED" ? (outcome === "LOST" ? "pending" : null) : undefined} />
          ) : (
            <span className="text-sm text-slate-400">—</span>
          )}
        </div>

        <Select label="Move to" error={errors.toStatus?.message} {...register("toStatus")}>
          {allowedNext.map((status) => (
            <option key={status} value={status}>
              {STATUS_LABELS[status]}
            </option>
          ))}
        </Select>

        {toStatus === "TEST_DRIVE" && (
          <p className="rounded-lg border border-teal-200 bg-teal-50/60 px-3 py-2 text-xs font-medium text-teal-700 dark:border-teal-500/25 dark:bg-teal-500/10 dark:text-teal-300">
            The appointment's date/time and consultant carry straight over as the first test drive. Log
            each additional drive and mark one Done from the Test Drives card below.
          </p>
        )}

        {/* Can't book until a test drive is marked Done on the Test Drives card */}
        {toStatus === "BOOKED" && !hasCompletedTestDrive && (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-300">
            Mark at least one test drive as <strong>Done</strong> before booking (Test Drives card above).
          </p>
        )}

        {/* Date for the later milestones (Booked / Retail / RTO / Delivered) */}
        {dateMilestone && (toStatus !== "BOOKED" || hasCompletedTestDrive) && (
          <Controller
            control={control}
            name={dateMilestone.field}
            render={({ field }) => (
              <DatePickerField label={dateMilestone.label} value={field.value} onChange={field.onChange} />
            )}
          />
        )}

        {/* Booking-phase finance: toggle + three Yes/No checks */}
        {toStatus === "BOOKED" && hasCompletedTestDrive && (
          <div className="flex flex-col gap-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 dark:border-emerald-500/25 dark:bg-emerald-500/10">
            <Switch
              checked={!!financeRequired}
              onChange={(v) => setValue("financeRequired", v)}
              label="Finance needed"
              description="Turn on if the customer is financing this purchase."
            />
            {financeRequired && (
              <div className="flex flex-col gap-2 border-t border-emerald-200 pt-3 dark:border-emerald-500/25">
                <YesNo label="Documents collected" checked={!!watch("financeDocumentCollected")} onChange={(v) => setValue("financeDocumentCollected", v)} />
                <YesNo label="Loan approved" checked={!!watch("financeLoanApproved")} onChange={(v) => setValue("financeLoanApproved", v)} />
                <YesNo label="DO received" checked={!!watch("financeDoReceived")} onChange={(v) => setValue("financeDoReceived", v)} />
              </div>
            )}
          </div>
        )}

        {/* Appointment scheduling (G3) */}
        {toStatus === "APPOINTMENT_FIXED" && (
          <div className="flex flex-col gap-3 rounded-xl border border-indigo-200 bg-indigo-50/60 p-3 dark:border-indigo-500/25 dark:bg-indigo-500/10">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
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
                    ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-300"
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
                    ? "border-red-300 bg-red-50 text-red-700 dark:border-red-500/40 dark:bg-red-500/15 dark:text-red-300"
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

        <div className="mt-1 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Update status
          </Button>
        </div>
      </form>
    </Modal>
  );
}
