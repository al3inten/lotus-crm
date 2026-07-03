import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input, Select, Textarea } from "../common/Input";
import { Button } from "../common/Button";
import { testDriveFormSchema } from "../../schemas/enquiry.schema";
import type { TestDriveFormValues, TestDriveFormInput } from "../../schemas/enquiry.schema";
import { useSaveTestDrive } from "../../hooks/useEnquiry";
import { useBranchStaff } from "../../hooks/useUsers";
import type { TestDriveFeedback } from "../../types";

export function TestDriveForm({
  enquiryId,
  branchId,
  existing,
}: {
  enquiryId: string;
  branchId: string;
  existing?: TestDriveFeedback | null;
}) {
  const saveTestDrive = useSaveTestDrive(enquiryId);
  const { data: consultants } = useBranchStaff(branchId, "CONSULTANT");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TestDriveFormInput, unknown, TestDriveFormValues>({
    resolver: zodResolver(testDriveFormSchema),
    defaultValues: {
      conductedById: existing?.conductedById ?? "",
      rating: existing?.rating != null ? String(existing.rating) : undefined,
      comments: existing?.comments ?? "",
    },
  });

  const onSubmit = async (values: TestDriveFormValues) => {
    await saveTestDrive.mutateAsync(values);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-gray-800">Test Drive Feedback</h3>
      <Select label="Conducted By" error={errors.conductedById?.message} {...register("conductedById")}>
        <option value="">Select consultant</option>
        {consultants?.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </Select>
      <Input label="Scheduled At" type="datetime-local" {...register("scheduledAt")} />
      <Input label="Completed At" type="datetime-local" {...register("completedAt")} />
      <Select label="Rating (1-5)" error={errors.rating?.message} {...register("rating")}>
        <option value="">No rating</option>
        {[1, 2, 3, 4, 5].map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </Select>
      <Textarea label="Comments" {...register("comments")} />
      <Button type="submit" isLoading={isSubmitting} className="w-fit">
        Save Test Drive
      </Button>
    </form>
  );
}
