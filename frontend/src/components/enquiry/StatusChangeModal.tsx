import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { DateTimePicker } from "../common/DateTimePicker";
import { useState, useEffect } from "react";
import { ArrowRight, CalendarClock, Trophy, XCircle } from "lucide-react";
import clsx from "clsx";
import { Modal } from "../common/Modal";
import { Select, Textarea } from "../common/Input";
import { Button } from "../common/Button";
import { StatusBadge } from "../common/StatusBadge";
import { statusChangeFormSchema } from "../../schemas/enquiry.schema";
import type { StatusChangeFormValues } from "../../schemas/enquiry.schema";
import { ALLOWED_TRANSITIONS, LOSS_REASONS } from "../../types";
import type { EnquiryStatus } from "../../types";
import { useChangeStatus } from "../../hooks/useEnquiry";
import { useBranchStaff } from "../../hooks/useUsers";

interface StatusChangeModalProps {
  enquiryId: string;
  branchId: string;
  currentStatus: EnquiryStatus;
  isOpen: boolean;
  onClose: () => void;
  initialTargetStatus?: EnquiryStatus;
}

export function StatusChangeModal({ enquiryId, branchId, currentStatus, isOpen, onClose, initialTargetStatus }: StatusChangeModalProps) {
  const [outcome, setOutcome] = useState<"WON" | "LOST">("WON");
  const changeStatus = useChangeStatus(enquiryId);
  const { data: consultants } = useBranchStaff(branchId, "CONSULTANT");
  const allowedNext = ALLOWED_TRANSITIONS[currentStatus];

  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<StatusChangeFormValues>({
    resolver: zodResolver(statusChangeFormSchema),
  });

  useEffect(() => {
    if (isOpen) {
      reset({
        toStatus: initialTargetStatus && allowedNext.includes(initialTargetStatus) ? initialTargetStatus : allowedNext[0],
      });
      setOutcome("WON");
    }
  }, [isOpen, initialTargetStatus, allowedNext, reset]);

  const toStatus = watch("toStatus");

  const onSubmit = async (values: StatusChangeFormValues) => {
    await changeStatus.mutateAsync({
      toStatus: values.toStatus,
      note: values.note,
      lossReason: values.toStatus === "CLOSED" && outcome === "LOST" ? values.lossReason || undefined : undefined,
      followUpDueAt: values.followUpDueAt ? new Date(values.followUpDueAt).toISOString() : undefined,
      appointmentAt: values.appointmentAt ? new Date(values.appointmentAt).toISOString() : undefined,
      consultantId: values.consultantId,
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
              {status.replaceAll("_", " ")}
            </option>
          ))}
        </Select>

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
            <Select label="Showroom consultant" error={errors.consultantId?.message} {...register("consultantId")}>
              <option value="">Select consultant</option>
              {consultants?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
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
