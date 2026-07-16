import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Select, Textarea } from "../common/Input";
import { DatePickerField, TimePicker } from "../common/DateTimePicker";
import { Button } from "../common/Button";
import { followUpFormSchema } from "../../schemas/enquiry.schema";
import type { FollowUpFormValues } from "../../schemas/enquiry.schema";
import { FOLLOW_UP_TYPES } from "../../types";
import type { FollowUpType } from "../../types";
import { useSaveFollowUp } from "../../hooks/useEnquiry";
import { format } from "date-fns";

interface FollowUpFormProps {
  enquiryId: string;
  /** Pre-selects the type — e.g. the CR just tapped Call/WhatsApp, so default to that channel instead of always CALL. */
  initialType?: FollowUpType;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function FollowUpForm({ enquiryId, initialType = "CALL", onSuccess, onCancel }: FollowUpFormProps) {
  const saveFollowUp = useSaveFollowUp(enquiryId);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FollowUpFormValues>({
    resolver: zodResolver(followUpFormSchema),
    defaultValues: {
      followUpDate: format(new Date(), "yyyy-MM-dd"),
      type: initialType,
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
        <Controller
          control={control}
          name="followUpDate"
          render={({ field }) => (
            <DatePickerField label="Date" value={field.value} onChange={field.onChange} error={errors.followUpDate?.message} />
          )}
        />
        <Controller
          control={control}
          name="followUpTime"
          render={({ field }) => (
            <TimePicker label="Time (optional)" value={field.value} onChange={field.onChange} error={errors.followUpTime?.message} />
          )}
        />
        
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
        <Controller
          control={control}
          name="nextFollowUpDate"
          render={({ field }) => (
            <DatePickerField label="Next Date" value={field.value} onChange={field.onChange} error={errors.nextFollowUpDate?.message} />
          )}
        />
        <Controller
          control={control}
          name="nextFollowUpTime"
          render={({ field }) => (
            <TimePicker label="Next Time" value={field.value} onChange={field.onChange} error={errors.nextFollowUpTime?.message} />
          )}
        />
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
