import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Car, Check, Clock, Plus, Star, X } from "lucide-react";
import clsx from "clsx";
import { Select, Textarea } from "../common/Input";
import { DateTimePicker } from "../common/DateTimePicker";
import { Switch } from "../common/Switch";
import { Button } from "../common/Button";
import { testDriveFormSchema } from "../../schemas/enquiry.schema";
import type { TestDriveFormValues, TestDriveFormInput } from "../../schemas/enquiry.schema";
import { useSaveTestDrive, useUpdateTestDrive } from "../../hooks/useEnquiry";
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
  defaultCarModel: string;
  defaultVariant?: string | null;
}) {
  const saveTestDrive = useSaveTestDrive(enquiryId);
  const { data: consultants, isLoading: consultantsLoading } = useBranchStaff(branchId, "CONSULTANT");
  const { data: vehicleModels } = useVehicleModels();
  const previousDrives = existing ?? [];
  const noConsultants = !consultantsLoading && (consultants?.length ?? 0) === 0;
  const hasDone = previousDrives.some((d) => !!d.completedAt);

  const [adding, setAdding] = useState(previousDrives.length === 0);
  const [carChoice, setCarChoice] = useState<"same" | "different">("same");
  const [markDone, setMarkDone] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TestDriveFormInput, unknown, TestDriveFormValues>({
    resolver: zodResolver(testDriveFormSchema),
    defaultValues: { conductedById: "", carModel: defaultCarModel, variant: defaultVariant ?? "", comments: "" },
  });

  // "Same car" locks the car to the enquiry's; "Different car" lets the CR pick another.
  useEffect(() => {
    if (carChoice === "same") {
      setValue("carModel", defaultCarModel);
      setValue("variant", defaultVariant ?? "");
    }
  }, [carChoice, defaultCarModel, defaultVariant, setValue]);

  const selectedModel = watch("carModel");
  const variantOptions =
    vehicleModels?.find((m) => m.name === selectedModel)?.variants.filter((v) => v.isActive) ?? [];

  const closeForm = () => {
    reset({ conductedById: "", carModel: defaultCarModel, variant: defaultVariant ?? "", scheduledAt: "", completedAt: "", rating: undefined, comments: "" });
    setMarkDone(false);
    setCarChoice("same");
    if (previousDrives.length > 0) setAdding(false);
  };

  const onSubmit = async (values: TestDriveFormValues) => {
    await saveTestDrive.mutateAsync({
      conductedById: values.conductedById,
      carModel: values.carModel,
      variant: values.variant || undefined,
      scheduledAt: values.scheduledAt || undefined,
      completedAt: markDone ? values.completedAt || new Date().toISOString() : undefined,
      rating: markDone ? (values.rating as number | undefined) : undefined,
      comments: markDone ? values.comments || undefined : undefined,
    });
    closeForm();
  };

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-600 dark:bg-teal-500/15 dark:text-teal-400">
            <Car size={16} />
          </span>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            Test Drives {previousDrives.length > 0 && <span className="text-slate-400">· {previousDrives.length}</span>}
          </h3>
        </div>
        {!adding && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-1 rounded-lg bg-teal-600 px-2.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-teal-700"
          >
            <Plus size={14} /> Add test drive
          </button>
        )}
      </div>

      {/* Ready-to-book indicator (a completed test drive is required before Booking). */}
      <p
        className={clsx(
          "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium",
          hasDone
            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
            : "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300"
        )}
      >
        {hasDone ? <Check size={13} /> : <Clock size={13} />}
        {hasDone ? "Test drive completed — ready to move to Booked." : "No test drive completed yet — mark one Done to enable Booking."}
      </p>

      {previousDrives.length > 0 && (
        <ul className="flex flex-col gap-2">
          {previousDrives.map((drive, index) => (
            <TestDriveRow key={drive.id} enquiryId={enquiryId} drive={drive} number={previousDrives.length - index} />
          ))}
        </ul>
      )}

      {adding && (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3 border-t border-slate-100 pt-3 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500">
              {previousDrives.length > 0 ? "Add another test drive" : "Fix a test drive"}
            </p>
            {previousDrives.length > 0 && (
              <button type="button" onClick={closeForm} aria-label="Cancel" className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X size={15} />
              </button>
            )}
          </div>

          {/* Same car or different car */}
          <div>
            <span className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">Which car?</span>
            <div className="flex overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
              {([["same", "Same car"], ["different", "Different car"]] as const).map(([val, text]) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setCarChoice(val)}
                  className={clsx(
                    "flex-1 px-3 py-1.5 text-xs font-semibold transition-colors",
                    carChoice === val
                      ? "bg-teal-600 text-white"
                      : "bg-white text-slate-500 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
                  )}
                >
                  {text}
                </button>
              ))}
            </div>
          </div>

          {carChoice === "same" ? (
            <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600 dark:bg-slate-800/50 dark:text-slate-300">
              <Car size={12} className="mr-1 inline" />
              {defaultCarModel}
              {defaultVariant ? ` · ${defaultVariant}` : ""}
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Select label="Car model" error={errors.carModel?.message} {...register("carModel")}>
                <option value="">Select car</option>
                {vehicleModels
                  ?.filter((m) => m.isActive)
                  .map((m) => (
                    <option key={m.id} value={m.name}>
                      {m.name}
                    </option>
                  ))}
              </Select>
              <Select label="Variant" {...register("variant")}>
                <option value="">Any / not specified</option>
                {variantOptions.map((v) => (
                  <option key={v.id} value={v.name}>
                    {v.name}
                  </option>
                ))}
              </Select>
            </div>
          )}

          <Select
            label="Consultant"
            required
            disabled={consultantsLoading || noConsultants}
            error={errors.conductedById?.message}
            {...register("conductedById")}
          >
            <option value="">
              {consultantsLoading ? "Loading…" : noConsultants ? "No consultants in this branch" : "Select consultant"}
            </option>
            {consultants?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          {noConsultants && (
            <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
              Add a Consultant to this branch (Branches → Employees) before fixing a test drive.
            </p>
          )}

          <Switch
            checked={markDone}
            onChange={setMarkDone}
            label="Test drive done?"
            description="On = completed now (capture feedback). Off = just scheduled/fixed for later."
          />

          {markDone ? (
            <>
              <Controller
                control={control}
                name="completedAt"
                render={({ field }) => <DateTimePicker label="Completed at" value={field.value} onChange={field.onChange} />}
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
            </>
          ) : (
            <Controller
              control={control}
              name="scheduledAt"
              render={({ field }) => <DateTimePicker label="Scheduled for" value={field.value} onChange={field.onChange} />}
            />
          )}

          <Button type="submit" isLoading={isSubmitting} className="w-fit">
            {markDone ? "Save test drive" : "Fix test drive"}
          </Button>
        </form>
      )}
    </div>
  );
}

/** One test drive in the list — shows Done/Scheduled status and lets a scheduled one be marked done. */
function TestDriveRow({ enquiryId, drive, number }: { enquiryId: string; drive: TestDriveFeedback; number: number }) {
  const updateTestDrive = useUpdateTestDrive(enquiryId);
  const isDone = !!drive.completedAt;
  const [markingDone, setMarkingDone] = useState(false);
  const [rating, setRating] = useState<string>("");
  const [comments, setComments] = useState("");

  const submitDone = () => {
    updateTestDrive.mutate(
      {
        testDriveId: drive.id,
        payload: {
          completedAt: new Date().toISOString(),
          rating: rating ? Number(rating) : undefined,
          comments: comments || undefined,
        },
      },
      { onSuccess: () => setMarkingDone(false) }
    );
  };

  return (
    <li className="rounded-md border border-slate-100 bg-slate-50 p-2.5 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-300">
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium text-slate-800 dark:text-slate-100">
          #{number}
          {drive.carModel && ` · ${drive.carModel}${drive.variant ? ` ${drive.variant}` : ""}`}
          {drive.conductedBy && ` · ${drive.conductedBy.name}`}
        </span>
        <span
          className={clsx(
            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
            isDone
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
              : "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"
          )}
        >
          {isDone ? <Check size={10} /> : <Clock size={10} />}
          {isDone ? "Done" : "Scheduled"}
        </span>
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-slate-500 dark:text-slate-400">
        {drive.rating != null && (
          <span className="inline-flex items-center gap-0.5">
            <Star size={10} className="fill-amber-400 text-amber-400" /> {drive.rating}/5
          </span>
        )}
        {drive.completedAt && <span>Done {new Date(drive.completedAt).toLocaleDateString()}</span>}
        {!drive.completedAt && drive.scheduledAt && <span>For {new Date(drive.scheduledAt).toLocaleDateString()}</span>}
      </div>
      {drive.comments && <p className="mt-1 text-slate-600 dark:text-slate-300">{drive.comments}</p>}

      {!isDone && !markingDone && (
        <button
          type="button"
          onClick={() => setMarkingDone(true)}
          className="mt-2 inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white transition-colors hover:bg-emerald-700"
        >
          <Check size={11} /> Mark as done
        </button>
      )}

      {markingDone && (
        <div className="mt-2 flex flex-col gap-2 rounded-md border border-emerald-200 bg-white p-2 dark:border-emerald-500/25 dark:bg-slate-900">
          <select
            value={rating}
            onChange={(e) => setRating(e.target.value)}
            className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          >
            <option value="">No rating</option>
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n}/5
              </option>
            ))}
          </select>
          <textarea
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="Consultant's feedback…"
            rows={2}
            className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={submitDone}
              disabled={updateTestDrive.isPending}
              className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
            >
              <Check size={11} /> {updateTestDrive.isPending ? "Saving…" : "Confirm done"}
            </button>
            <button
              type="button"
              onClick={() => setMarkingDone(false)}
              className="rounded-md border border-slate-200 px-2.5 py-1 text-[11px] font-medium text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </li>
  );
}
