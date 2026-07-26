import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarClock } from "lucide-react";
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
    // This follow-up is being logged right now — the date/time isn't user-editable, so stamp
    // the actual moment of saving rather than trusting whatever was in the form at mount.
    const now = new Date();
    await saveFollowUp.mutateAsync({
      followUpDate: now.toISOString(),
      followUpTime: format(now, "HH:mm"),
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
      {/* This follow-up is being logged now — the date/time isn't editable (see onSubmit,
          which stamps the actual save moment), only shown for confirmation. */}
      <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-300">
        <CalendarClock size={15} className="shrink-0 text-slate-400" />
        Logging this follow-up for <span className="font-medium">{format(new Date(), "d MMM yyyy, h:mm a")}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
