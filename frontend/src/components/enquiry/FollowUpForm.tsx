import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input, Select, Textarea } from "../common/Input";
import { Button } from "../common/Button";
import { followUpFormSchema } from "../../schemas/enquiry.schema";
import type { FollowUpFormValues } from "../../schemas/enquiry.schema";
import { FOLLOW_UP_TYPES } from "../../types";
import { useSaveFollowUp } from "../../hooks/useEnquiry";
import { format } from "date-fns";

interface FollowUpFormProps {
  enquiryId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function FollowUpForm({ enquiryId, onSuccess, onCancel }: FollowUpFormProps) {
  const saveFollowUp = useSaveFollowUp(enquiryId);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FollowUpFormValues>({
    resolver: zodResolver(followUpFormSchema),
    defaultValues: {
      followUpDate: format(new Date(), "yyyy-MM-dd"),
      type: "CALL",
    },
  });

  const onSubmit = async (values: FollowUpFormValues) => {
    await saveFollowUp.mutateAsync({
      followUpDate: new Date(values.followUpDate).toISOString(),
      followUpTime: values.followUpTime || undefined,
      type: values.type,
      remark: values.remark,
      nextFollowUpDate: values.nextFollowUpDate ? new Date(values.nextFollowUpDate).toISOString() : undefined,
      nextFollowUpTime: values.nextFollowUpTime || undefined,
    });
    reset();
    onSuccess?.();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label="Date" type="date" error={errors.followUpDate?.message} {...register("followUpDate")} />
        <Input label="Time (optional)" type="time" error={errors.followUpTime?.message} {...register("followUpTime")} />
        
        <Select label="Type" error={errors.type?.message} {...register("type")}>
          {FOLLOW_UP_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </Select>
      </div>

      <Textarea label="Remark" error={errors.remark?.message} {...register("remark")} placeholder="What was discussed?" />

      <h4 className="font-medium text-sm text-gray-700 mt-2">Schedule Next Follow-up</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label="Next Date" type="date" error={errors.nextFollowUpDate?.message} {...register("nextFollowUpDate")} />
        <Input label="Next Time" type="time" error={errors.nextFollowUpTime?.message} {...register("nextFollowUpTime")} />
      </div>

      <div className="flex justify-end gap-2 mt-2">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" isLoading={isSubmitting}>
          Save Follow-up
        </Button>
      </div>
    </form>
  );
}
