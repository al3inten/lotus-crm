import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Select, Textarea } from "../common/Input";
import { DateTimePicker } from "../common/DateTimePicker";
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
  existing?: TestDriveFeedback[];
}) {
  const saveTestDrive = useSaveTestDrive(enquiryId);
  const { data: consultants } = useBranchStaff(branchId, "CONSULTANT");
  const previousDrives = existing ?? [];

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TestDriveFormInput, unknown, TestDriveFormValues>({
    resolver: zodResolver(testDriveFormSchema),
    defaultValues: { conductedById: "", comments: "" },
  });

  const onSubmit = async (values: TestDriveFormValues) => {
    await saveTestDrive.mutateAsync(values);
    reset({ conductedById: "", scheduledAt: "", completedAt: "", rating: undefined, comments: "" });
  };

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-gray-800">
        Test Drives {previousDrives.length > 0 && <span className="text-gray-400">({previousDrives.length} so far)</span>}
      </h3>

      {previousDrives.length > 0 && (
        <ul className="flex flex-col gap-2">
          {previousDrives.map((drive, index) => (
            <li key={drive.id} className="rounded-md border border-gray-100 bg-gray-50 p-2.5 text-xs text-gray-600">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-800">
                  Test drive #{previousDrives.length - index}
                  {drive.conductedBy && ` · ${drive.conductedBy.name}`}
                </span>
                <span>
                  {drive.rating != null && `★ ${drive.rating}/5`}
                  {drive.completedAt && ` · ${new Date(drive.completedAt).toLocaleDateString()}`}
                </span>
              </div>
              {drive.comments && <p className="mt-1">{drive.comments}</p>}
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3 border-t border-gray-100 pt-3">
        <p className="text-xs font-medium text-gray-500">
          {previousDrives.length > 0 ? "Record another test drive" : "Record test drive feedback"}
        </p>
        <Select label="Conducted By" error={errors.conductedById?.message} {...register("conductedById")}>
          <option value="">Select consultant</option>
          {consultants?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
        <Controller
          control={control}
          name="scheduledAt"
          render={({ field }) => <DateTimePicker label="Scheduled At" value={field.value} onChange={field.onChange} />}
        />
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
        <Textarea label="Client Feedback / Comments" {...register("comments")} />
        <Button type="submit" isLoading={isSubmitting} className="w-fit">
          Save Test Drive
        </Button>
      </form>
    </div>
  );
}
