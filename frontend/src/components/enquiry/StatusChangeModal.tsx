import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal } from "../common/Modal";
import { Select, Textarea, Input } from "../common/Input";
import { Button } from "../common/Button";
import { statusChangeFormSchema } from "../../schemas/enquiry.schema";
import type { StatusChangeFormValues } from "../../schemas/enquiry.schema";
import { ALLOWED_TRANSITIONS, LOSS_REASONS } from "../../types";
import type { EnquiryStatus } from "../../types";
import { useChangeStatus } from "../../hooks/useEnquiry";
import { useBranchStaff } from "../../hooks/useUsers";

import { useState, useEffect } from "react";

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
    }
  }, [isOpen, initialTargetStatus, allowedNext, reset]);

  const toStatus = watch("toStatus");

  const onSubmit = async (values: StatusChangeFormValues) => {
    await changeStatus.mutateAsync({
      toStatus: values.toStatus,
      note: values.note,
      lossReason: values.toStatus === "CLOSED" && outcome === "LOST" ? values.lossReason || undefined : undefined,
      followUpDueAt: values.followUpDueAt ? new Date(values.followUpDueAt).toISOString() : undefined,
      consultantId: values.consultantId,
    });
    reset();
    setOutcome("WON");
    onClose();
  };

  if (allowedNext.length === 0) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Update Status">
        <p className="text-sm text-gray-500">This enquiry is in a terminal state and cannot be moved further.</p>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Update Status">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
        <Select label="New Status" error={errors.toStatus?.message} {...register("toStatus")}>
          {allowedNext.map((status) => (
            <option key={status} value={status}>
              {status.replaceAll("_", " ")}
            </option>
          ))}
        </Select>

        {toStatus === "CLOSED" && (
          <div className="flex flex-col gap-3 p-3 bg-gray-50 rounded-md border border-gray-200">
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input type="radio" checked={outcome === "WON"} onChange={() => setOutcome("WON")} />
                Won (Retail Done)
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" checked={outcome === "LOST"} onChange={() => setOutcome("LOST")} />
                Lost
              </label>
            </div>
            
            {outcome === "LOST" && (
              <Select label="Loss Reason" error={errors.lossReason?.message} {...register("lossReason")} required>
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

        {toStatus === "UNDER_FOLLOW_UP" && (
          <Input label="Follow-up due" type="datetime-local" error={errors.followUpDueAt?.message} {...register("followUpDueAt")} />
        )}

        {toStatus === "APPOINTMENT_FIXED" && (
          <Select label="Assign Consultant" error={errors.consultantId?.message} {...register("consultantId")}>
            <option value="">Select consultant</option>
            {consultants?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        )}

        <Textarea label="Note (optional)" error={errors.note?.message} {...register("note")} />

        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Update
          </Button>
        </div>
      </form>
    </Modal>
  );
}
