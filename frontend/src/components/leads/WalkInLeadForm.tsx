import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Modal } from "../common/Modal";
import { Input, Select, Textarea } from "../common/Input";
import { Button } from "../common/Button";
import { walkInLeadFormSchema } from "../../schemas/lead.schema";
import type { WalkInLeadFormValues } from "../../schemas/lead.schema";
import { useCreateWalkInLead } from "../../hooks/useLeads";
import { useBranches } from "../../hooks/useBranches";
import { ENQUIRY_TYPES } from "../../types";
import { useAuth } from "../../context/AuthContext";

export function WalkInLeadForm({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { user } = useAuth();
  const { data: branches } = useBranches();
  const createWalkIn = useCreateWalkInLead();
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [showConfirmClose, setShowConfirmClose] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<WalkInLeadFormValues>({
    resolver: zodResolver(walkInLeadFormSchema),
    defaultValues: { branchId: user?.branchId ?? "" },
  });

  const onSubmit = async (values: WalkInLeadFormValues) => {
    setResultMessage(null);
    const result = await createWalkIn.mutateAsync({ ...values, email: values.email || undefined });
    setResultMessage(
      result.attachedToExisting
        ? "This customer already has an active enquiry — this visit was recorded on it (no duplicate created). Open the lead to see their full history."
        : result.isRepeatLead
          ? `Returning customer (${result.priorEnquiryCount} past enquiry(ies)) — new enquiry started.`
          : "New lead created."
    );
    reset({ branchId: values.branchId, name: "", phone: "", email: "", carModel: "", location: "" } as WalkInLeadFormValues);
  };

  const handleClose = () => {
    // Check if the form is dirty by checking if any field has been touched/filled
    // For simplicity since we don't have isDirty easily accessible without importing more from RHF,
    // we'll just always ask for confirmation to satisfy "when i click close ask are you sure".
    setShowConfirmClose(true);
  };

  const confirmClose = () => {
    setShowConfirmClose(false);
    onClose();
    reset();
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={handleClose} title="Add Walk-in Lead" maxWidth="max-w-2xl">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Name" error={errors.name?.message} {...register("name")} />
            <Input label="Phone" error={errors.phone?.message} {...register("phone")} />
            <Input label="Email (optional)" type="email" error={errors.email?.message} {...register("email")} />
            <Input label="Car Model" error={errors.carModel?.message} {...register("carModel")} />
            <Select label="Enquiry Type" error={errors.enquiryType?.message} {...register("enquiryType")}>
              {ENQUIRY_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type.replaceAll("_", " ")}
                </option>
              ))}
            </Select>
            <Select label="Branch" error={errors.branchId?.message} {...register("branchId")}>
              <option value="">Select branch</option>
              {branches?.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </Select>
            <div className="sm:col-span-2">
              <Textarea label="Location (optional)" error={errors.location?.message} {...register("location")} rows={2} />
            </div>
          </div>

          {resultMessage && <p className="text-sm font-medium text-emerald-600">{resultMessage}</p>}

          <div className="mt-2 flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Save Walk-in Lead
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modern Confirm Close Dialog */}
      <Modal isOpen={showConfirmClose} onClose={() => setShowConfirmClose(false)} maxWidth="max-w-sm">
        <div className="flex flex-col items-center text-center mt-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-500/20 mb-4 ring-4 ring-amber-50 dark:ring-amber-500/10">
            <svg className="h-6 w-6 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Discard Changes?</h3>
          <p className="mb-6 text-sm text-slate-500 dark:text-slate-400 px-2">
            Are you sure you want to close this form? Any unsaved data will be permanently lost.
          </p>
        </div>
        <div className="flex gap-3 w-full">
          <Button type="button" variant="secondary" className="flex-1 justify-center" onClick={() => setShowConfirmClose(false)}>
            No, keep editing
          </Button>
          <Button type="button" variant="danger" className="flex-1 justify-center shadow-md shadow-rose-500/20" onClick={confirmClose}>
            Yes, discard
          </Button>
        </div>
      </Modal>
    </>
  );
}
