import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Select, Textarea } from "../common/Input";
import { DateTimePicker } from "../common/DateTimePicker";
import { Button } from "../common/Button";
import { testDriveEditFormSchema } from "../../schemas/enquiry.schema";
import type { TestDriveEditFormValues, TestDriveEditFormInput } from "../../schemas/enquiry.schema";
import { useUpdateTestDrive } from "../../hooks/useEnquiry";
import type { TestDriveFeedback } from "../../types";

/** Compact follow-up edit for an existing test drive — mark it complete and capture the rating. */
export function TestDriveEditForm({
  enquiryId,
  drive,
  onSaved,
}: {
  enquiryId: string;
  drive: TestDriveFeedback;
  onSaved?: () => void;
}) {
  const updateTestDrive = useUpdateTestDrive(enquiryId);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TestDriveEditFormInput, unknown, TestDriveEditFormValues>({
    resolver: zodResolver(testDriveEditFormSchema),
    defaultValues: {
      completedAt: drive.completedAt ?? "",
      rating: drive.rating ?? "",
      comments: drive.comments ?? "",
    },
  });

  const onSubmit = async (values: TestDriveEditFormValues) => {
    await updateTestDrive.mutateAsync({ testDriveId: drive.id, payload: values });
    onSaved?.();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
      <Controller
        control={control}
        name="completedAt"
        render={({ field }) => <DateTimePicker label="Completed At" value={field.value} onChange={field.onChange} />}
      />
      <Select label="Rating (1-5)" error={errors.rating?.message} {...register("rating")}>
        <option value="">No rating</option>
        {[1, 2, 3, 4, 5].map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </Select>
      <Textarea label="Consultant's feedback / comments" {...register("comments")} />
      <Button type="submit" isLoading={isSubmitting} size="sm" className="w-fit">
        Save
      </Button>
    </form>
  );
}
