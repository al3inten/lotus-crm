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

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Walk-in Lead">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
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
        <Textarea label="Location (optional)" error={errors.location?.message} {...register("location")} />

        {resultMessage && <p className="text-sm text-green-700">{resultMessage}</p>}

        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Close
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Save Walk-in Lead
          </Button>
        </div>
      </form>
    </Modal>
  );
}
