import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Car } from "lucide-react";
import { Select, Textarea } from "../common/Input";
import { DateTimePicker } from "../common/DateTimePicker";
import { Button } from "../common/Button";
import { testDriveFormSchema } from "../../schemas/enquiry.schema";
import type { TestDriveFormValues, TestDriveFormInput } from "../../schemas/enquiry.schema";
import { useSaveTestDrive } from "../../hooks/useEnquiry";
import { useBranchStaff } from "../../hooks/useUsers";
import { useVehicleModels } from "../../hooks/useVehicles";
import type { TestDriveFeedback } from "../../types";

export function TestDriveForm({
  enquiryId,
  branchId,
  existing,
  defaultCarModel,
  defaultVariant,
}: {
  enquiryId: string;
  branchId: string;
  existing?: TestDriveFeedback[];
  /** The enquiry's car — each new test drive defaults to it, but the CR can pick another. */
  defaultCarModel: string;
  defaultVariant?: string | null;
}) {
  const saveTestDrive = useSaveTestDrive(enquiryId);
  const { data: consultants } = useBranchStaff(branchId, "CONSULTANT");
  const { data: vehicleModels } = useVehicleModels();
  const previousDrives = existing ?? [];

  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TestDriveFormInput, unknown, TestDriveFormValues>({
    resolver: zodResolver(testDriveFormSchema),
    defaultValues: { conductedById: "", carModel: defaultCarModel, variant: defaultVariant ?? "", comments: "" },
  });

  const selectedModel = watch("carModel");
  const variantOptions =
    vehicleModels?.find((m) => m.name === selectedModel)?.variants.filter((v) => v.isActive) ?? [];

  const onSubmit = async (values: TestDriveFormValues) => {
    await saveTestDrive.mutateAsync(values);
    // Reset back to the enquiry's car for the next entry.
    reset({ conductedById: "", carModel: defaultCarModel, variant: defaultVariant ?? "", scheduledAt: "", completedAt: "", rating: undefined, comments: "" });
  };

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
        Test Drives {previousDrives.length > 0 && <span className="text-slate-400">({previousDrives.length} so far)</span>}
      </h3>

      {previousDrives.length > 0 && (
        <ul className="flex flex-col gap-2">
          {previousDrives.map((drive, index) => (
            <li key={drive.id} className="rounded-md border border-slate-100 bg-slate-50 p-2.5 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-300">
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-800 dark:text-slate-100">
                  Test drive #{previousDrives.length - index}
                  {drive.conductedBy && ` · ${drive.conductedBy.name}`}
                </span>
                <span>
                  {drive.rating != null && `★ ${drive.rating}/5`}
                  {drive.completedAt && ` · ${new Date(drive.completedAt).toLocaleDateString()}`}
                </span>
              </div>
              {drive.carModel && (
                <p className="mt-1 flex items-center gap-1 font-medium text-slate-700 dark:text-slate-200">
                  <Car size={11} /> {drive.carModel}
                  {drive.variant && ` · ${drive.variant}`}
                </p>
              )}
              {drive.comments && <p className="mt-1">{drive.comments}</p>}
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3 border-t border-slate-100 pt-3 dark:border-slate-800">
        <p className="text-xs font-medium text-slate-500">
          {previousDrives.length > 0 ? "Record another test drive" : "Record test drive feedback"}
        </p>

        {/* Which car — defaults to the enquiry's car, change it for a different-car test drive. */}
        <Select label="Car model" error={errors.carModel?.message} {...register("carModel")}>
          {vehicleModels
            ?.filter((m) => m.isActive || m.name === defaultCarModel)
            .map((m) => (
              <option key={m.id} value={m.name}>
                {m.name}
              </option>
            ))}
          {/* Keep the enquiry's car selectable even if it's not in the active catalogue. */}
          {defaultCarModel && !vehicleModels?.some((m) => m.name === defaultCarModel) && (
            <option value={defaultCarModel}>{defaultCarModel}</option>
          )}
        </Select>
        <Select label="Variant" {...register("variant")}>
          <option value="">Any / not specified</option>
          {variantOptions.map((v) => (
            <option key={v.id} value={v.name}>
              {v.name}
            </option>
          ))}
          {defaultVariant && !variantOptions.some((v) => v.name === defaultVariant) && (
            <option value={defaultVariant}>{defaultVariant}</option>
          )}
        </Select>

        <Select label="Conducted By (consultant)" error={errors.conductedById?.message} {...register("conductedById")}>
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
        <Textarea label="Consultant's feedback / comments" {...register("comments")} />
        <Button type="submit" isLoading={isSubmitting} className="w-fit">
          Save Test Drive
        </Button>
      </form>
    </div>
  );
}
