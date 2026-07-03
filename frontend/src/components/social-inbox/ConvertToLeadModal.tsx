import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal } from "../common/Modal";
import { Input, Select } from "../common/Input";
import { Button } from "../common/Button";
import { useConvertConversation } from "../../hooks/useSocialInbox";
import { useBranches } from "../../hooks/useBranches";
import { ENQUIRY_TYPES } from "../../types";
import { walkInLeadFormSchema } from "../../schemas/lead.schema";
import type { WalkInLeadFormValues } from "../../schemas/lead.schema";

export function ConvertToLeadModal({
  conversationId,
  suggestedName,
  isOpen,
  onClose,
}: {
  conversationId: string;
  suggestedName?: string;
  isOpen: boolean;
  onClose: () => void;
}) {
  const { data: branches } = useBranches();
  const convertConversation = useConvertConversation(conversationId);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<WalkInLeadFormValues>({
    resolver: zodResolver(walkInLeadFormSchema),
    defaultValues: { name: suggestedName ?? "" },
  });

  const onSubmit = async (values: WalkInLeadFormValues) => {
    await convertConversation.mutateAsync({ ...values, email: values.email || undefined });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Convert to Lead">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
        <p className="text-xs text-gray-500">
          Enter the customer's phone number once you have it from the conversation — this is what links them into
          the CRM's lead/enquiry history.
        </p>
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
        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Convert to Lead
          </Button>
        </div>
      </form>
    </Modal>
  );
}
