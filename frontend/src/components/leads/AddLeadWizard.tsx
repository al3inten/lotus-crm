import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, ChevronLeft, ChevronRight, Save, Building2, UserCircle2, Car, CalendarClock, RefreshCw, ClipboardEdit } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import clsx from "clsx";
import { Modal } from "../common/Modal";
import { Input, Select, Textarea } from "../common/Input";
import { Button } from "../common/Button";
import { addLeadFormSchema } from "../../schemas/lead.schema";
import type { AddLeadFormValues, AddLeadFormInput } from "../../schemas/lead.schema";
import { useCreateWalkInLead, useSaveDraft, useUpdateDraft, useDeleteDraft, useLeadLookup } from "../../hooks/useLeads";
import { useUpdateEnquiryDetails } from "../../hooks/useEnquiry";
import { useBranches } from "../../hooks/useBranches";
import { useBranchStaff } from "../../hooks/useUsers";
import { useVehicleModels } from "../../hooks/useVehicles";
import { useAuth } from "../../context/AuthContext";
import {
  ENQUIRY_TYPES,
  DEPARTMENTS,
  LEAD_SUBSOURCES,
  SOURCE_CATEGORIES,
  SOURCE_CATEGORY_SUBSOURCES,
  ENQUIRY_CATEGORIES,
} from "../../types";
import type { LeadEnrichmentPayload, WalkInLeadPayload } from "../../api/leads.api";

const STEP_TITLES = [
  "Enquiry & Source",
  "Customer Details",
  "Vehicle Interest",
  "Appointment & Test Drive",
  "Exchange Car",
  "Assignment & Follow-up",
];

const STEP_ICONS: LucideIcon[] = [Building2, UserCircle2, Car, CalendarClock, RefreshCw, ClipboardEdit];

/** One accent color per section so the flattened "Complete Details" view reads as
 * distinct groups at a glance, instead of six identical blue badges in a row. */
const STEP_ICON_STYLES = [
  "bg-blue-50 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400",
  "bg-violet-50 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400",
  "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400",
  "bg-amber-50 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400",
  "bg-cyan-50 text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-400",
  "bg-rose-50 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400",
];

const STEP_FIELDS: (keyof AddLeadFormInput)[][] = [
  ["branchId", "assignedCrId", "department", "sourceCategory", "subsource"],
  ["name", "phone", "alternateMobile", "email", "dob", "profession", "pincode", "location", "address"],
  ["carModel", "variant", "enquiryType", "enquiryCategory", "financeRequired", "financeRemarks"],
  ["appointmentScheduled", "appointmentAt", "testDriveInterested", "testDriveCount"],
  ["exchangeCarModel", "exchangeCarYear", "exchangeCarKms", "exchangeCarOwners"],
  ["calledDate", "remarks"],
];

const toIso = (value?: string) => (value ? new Date(value).toISOString() : undefined);

interface AddLeadWizardProps {
  isOpen: boolean;
  onClose: () => void;
  /** "create" opens a fresh walk-in intake; "complete" patches an existing (usually digital) enquiry. */
  mode?: "create" | "complete";
  enquiryId?: string;
  initialValues?: Partial<AddLeadFormInput>;
  /** Read-only context shown in complete mode, e.g. "MTP Road · Google Sheets". */
  contextLabel?: string;
  /** Resume an existing draft (create mode) — deleted once the enquiry is successfully saved. */
  draftId?: string;
}

export function AddLeadWizard({
  isOpen,
  onClose,
  mode = "create",
  enquiryId,
  initialValues,
  contextLabel,
  draftId: initialDraftId,
}: AddLeadWizardProps) {
  const { user } = useAuth();
  const { data: branches } = useBranches();
  const createWalkIn = useCreateWalkInLead();
  const updateDetails = useUpdateEnquiryDetails(enquiryId ?? "");
  const saveDraft = useSaveDraft();
  const updateDraft = useUpdateDraft();
  const deleteDraft = useDeleteDraft();

  const [step, setStep] = useState(1);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [draftMessage, setDraftMessage] = useState<string | null>(null);
  const [showConfirmClose, setShowConfirmClose] = useState(false);
  const [draftId, setDraftId] = useState<string | undefined>(initialDraftId);
  const [autofilledPhone, setAutofilledPhone] = useState<string | null>(null);
  const autoCloseTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => () => clearTimeout(autoCloseTimer.current), []);

  const {
    register,
    handleSubmit,
    watch,
    trigger,
    getValues,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AddLeadFormInput, unknown, AddLeadFormValues>({
    resolver: zodResolver(addLeadFormSchema),
    defaultValues: {
      branchId: user?.branchId ?? "",
      assignedCrId: user?.role === "CR_TEAM" ? user.id : "",
      financeRequired: false,
      appointmentScheduled: false,
      testDriveInterested: false,
      forceNew: false,
      ...initialValues,
    },
  });

  const { data: crStaff } = useBranchStaff(watch("branchId"), "CR_TEAM");
  const { data: vehicleModels } = useVehicleModels();
  const selectedSourceCategory = watch("sourceCategory");
  const subsourceOptions = selectedSourceCategory
    ? SOURCE_CATEGORY_SUBSOURCES[selectedSourceCategory]
    : LEAD_SUBSOURCES;
  const financeRequired = watch("financeRequired");
  const appointmentScheduled = watch("appointmentScheduled");
  const testDriveInterested = watch("testDriveInterested");
  const selectedModelName = watch("carModel") as string | undefined;
  const activeModels = vehicleModels?.filter((m) => m.isActive) ?? [];
  const selectedModel = vehicleModels?.find((m) => m.name === selectedModelName);
  const variantOptions = selectedModel?.variants.filter((v) => v.isActive) ?? [];

  const phone = watch("phone") || "";
  const { data: lookupResult, isFetching: lookupLoading } = useLeadLookup(phone);
  const isComplete = mode === "complete";

  useEffect(() => {
    if (lookupResult && phone && phone !== autofilledPhone && !isComplete) {
      if (lookupResult.name) setValue("name", lookupResult.name);
      if (lookupResult.email) setValue("email", lookupResult.email);
      if (lookupResult.alternateMobile) setValue("alternateMobile", lookupResult.alternateMobile);
      if (lookupResult.dob) setValue("dob", lookupResult.dob.slice(0, 10));
      if (lookupResult.profession) setValue("profession", lookupResult.profession);
      if (lookupResult.pincode) setValue("pincode", lookupResult.pincode);
      if (lookupResult.address) setValue("address", lookupResult.address);
      setAutofilledPhone(phone);
    }
  }, [lookupResult, phone, autofilledPhone, setValue, isComplete]);

  const totalSteps = STEP_TITLES.length;

  useEffect(() => {
    if (isOpen) {
      clearTimeout(autoCloseTimer.current);
      setStep(1);
      setResultMessage(null);
      setDraftMessage(null);
      setDraftId(initialDraftId);
    }
    // Only re-sync when the modal is (re)opened — not on every keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const goNext = async () => {
    const fields = isComplete ? [] : STEP_FIELDS[step - 1];
    const valid = fields.length === 0 || (await trigger(fields));
    if (valid) setStep((s) => Math.min(totalSteps, s + 1));
  };
  const goBack = () => setStep((s) => Math.max(1, s - 1));

  const buildEnrichmentPayload = (values: AddLeadFormValues): LeadEnrichmentPayload => ({
    alternateMobile: values.alternateMobile || undefined,
    dob: toIso(values.dob),
    profession: values.profession || undefined,
    pincode: values.pincode || undefined,
    address: values.address || undefined,
    department: values.department || undefined,
    sourceCategory: values.sourceCategory || undefined,
    subsource: values.subsource || undefined,
    variant: values.variant || undefined,
    enquiryCategory: values.enquiryCategory || undefined,
    financeRequired: values.financeRequired,
    financeRemarks: values.financeRemarks || undefined,
    appointmentScheduled: values.appointmentScheduled,
    appointmentAt: toIso(values.appointmentAt),
    testDriveInterested: values.testDriveInterested,
    testDriveCount: values.testDriveCount,
    exchangeCarModel: values.exchangeCarModel || undefined,
    exchangeCarYear: values.exchangeCarYear,
    exchangeCarKms: values.exchangeCarKms,
    exchangeCarOwners: values.exchangeCarOwners,
    calledDate: toIso(values.calledDate),
    remarks: values.remarks || undefined,
  });

  const onSubmit = async (values: AddLeadFormValues) => {
    setResultMessage(null);
    if (isComplete) {
      await updateDetails.mutateAsync(buildEnrichmentPayload(values));
      onClose();
      return;
    }

    const payload: WalkInLeadPayload = {
      name: values.name,
      phone: values.phone,
      email: values.email || undefined,
      carModel: values.carModel,
      enquiryType: values.enquiryType,
      location: values.location || undefined,
      branchId: values.branchId,
      assignedCrId: values.assignedCrId || undefined,
      forceNew: values.forceNew,
      ...buildEnrichmentPayload(values),
    };
    const result = await createWalkIn.mutateAsync(payload);
    if (draftId) await deleteDraft.mutateAsync(draftId);

    setResultMessage(
      result.attachedToExisting
        ? "This customer already has an active enquiry — this visit was recorded on it (no duplicate created)."
        : result.isRepeatLead
          ? `Returning customer (${result.priorEnquiryCount} past enquiry(ies)) — new enquiry started.`
          : "New lead created."
    );
    setDraftId(undefined);
    setStep(1);
    reset({ branchId: values.branchId, assignedCrId: values.assignedCrId });
    autoCloseTimer.current = setTimeout(onClose, 1500);
  };

  const onSaveDraft = async () => {
    const values = getValues() as unknown as Record<string, unknown>;
    if (draftId) {
      await updateDraft.mutateAsync({ id: draftId, data: values });
    } else {
      const saved = await saveDraft.mutateAsync({ branchId: values.branchId as string | undefined, data: values });
      setDraftId(saved.id);
    }
    setDraftMessage("Draft saved — resume it any time from Drafts.");
  };

  const handleClose = () => setShowConfirmClose(true);
  const confirmClose = () => {
    setShowConfirmClose(false);
    onClose();
    reset();
  };

  const fieldError = (name: keyof AddLeadFormInput) => errors[name]?.message as string | undefined;

  // One content block per step. In "create" mode only the active step renders (classic
  // wizard); in "complete" mode every block renders at once under its own section header —
  // there's nothing left to progressively disclose, so pagination just added clicks.
  const stepPanels: ReactNode[] = [
    (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {isComplete ? (
          <p className="sm:col-span-2 text-sm text-slate-500 dark:text-slate-400">
            Branch, source, and assigned CR are already set for this enquiry — fill in department/sub-source below if
            known.
          </p>
        ) : (
          <>
            <Select label="Dealer / Branch" error={fieldError("branchId")} {...register("branchId")}>
              <option value="">Select branch</option>
              {branches?.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.code} - {b.name}
                </option>
              ))}
            </Select>
            <Select label="CR (handled by)" error={fieldError("assignedCrId")} {...register("assignedCrId")}>
              <option value="">Select CR</option>
              {crStaff?.map((cr) => (
                <option key={cr.id} value={cr.id}>
                  {cr.name}
                </option>
              ))}
            </Select>
          </>
        )}
        <Select label="Department" error={fieldError("department")} {...register("department")}>
          <option value="">Select department</option>
          {DEPARTMENTS.map((d) => (
            <option key={d} value={d}>
              {d.replaceAll("_", " ")}
            </option>
          ))}
        </Select>
        <Select
          label="Source"
          error={fieldError("sourceCategory")}
          {...register("sourceCategory", { onChange: () => setValue("subsource", "") })}
        >
          <option value="">Select source</option>
          {SOURCE_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c.replaceAll("_", " ")}
            </option>
          ))}
        </Select>
        <Select label="Subsource" error={fieldError("subsource")} {...register("subsource")}>
          <option value="">Select subsource</option>
          {subsourceOptions.map((s) => (
            <option key={s} value={s}>
              {s.replaceAll("_", " ")}
            </option>
          ))}
        </Select>

        {!isComplete && (
          <div className="sm:col-span-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-800 pt-3 mt-1">
            <p className="text-xs text-slate-400 dark:text-slate-500">Enquiry date: {new Date().toLocaleDateString()}</p>
            <label className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-3 py-1.5 rounded-md border border-amber-200 dark:border-amber-800/50">
              <input type="checkbox" {...register("forceNew")} className="text-amber-600 focus:ring-amber-500 rounded border-amber-300" />
              <span className="font-medium">Force new enquiry</span>
            </label>
          </div>
        )}
      </div>
    ),
    (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input label="Name" disabled={isComplete} error={fieldError("name")} {...register("name")} />
        <div className="relative">
          <Input label="Phone" disabled={isComplete} error={fieldError("phone")} {...register("phone")} />
          {lookupLoading && (
            <div className="absolute right-3 top-[34px]">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
            </div>
          )}
        </div>
        <Input label="Alternate mobile" error={fieldError("alternateMobile")} {...register("alternateMobile")} />
        <Input label="Email" type="email" disabled={isComplete} error={fieldError("email")} {...register("email")} />
        <Input label="Date of birth" type="date" error={fieldError("dob")} {...register("dob")} />
        <Input label="Profession" error={fieldError("profession")} {...register("profession")} />
        <Input label="Pincode" error={fieldError("pincode")} {...register("pincode")} />
        <Input label="Location" disabled={isComplete} error={fieldError("location")} {...register("location")} />
        <div className="sm:col-span-2">
          <Textarea label="Address" rows={2} error={fieldError("address")} {...register("address")} />
        </div>
      </div>
    ),
    (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Select
          label="Model"
          disabled={isComplete}
          error={fieldError("carModel")}
          {...register("carModel", { onChange: () => setValue("variant", "") })}
        >
          <option value="">Select model</option>
          {selectedModelName && !activeModels.some((m) => m.name === selectedModelName) && (
            <option value={selectedModelName}>{selectedModelName}</option>
          )}
          {activeModels.map((m) => (
            <option key={m.id} value={m.name}>
              {m.name}
            </option>
          ))}
        </Select>
        <Select label="Variant" disabled={isComplete || !selectedModelName} error={fieldError("variant")} {...register("variant")}>
          <option value="">Select variant</option>
          {watch("variant") && !variantOptions.some((v) => v.name === watch("variant")) && (
            <option value={watch("variant") as string}>{watch("variant") as string}</option>
          )}
          {variantOptions.map((v) => (
            <option key={v.id} value={v.name}>
              {v.name} · {v.transmissionType} · {v.fuelType.replaceAll("_", " + ")}
            </option>
          ))}
        </Select>
        <Select label="Enquiry Type" disabled={isComplete} error={fieldError("enquiryType")} {...register("enquiryType")}>
          {ENQUIRY_TYPES.map((type) => (
            <option key={type} value={type}>
              {type.replaceAll("_", " ")}
            </option>
          ))}
        </Select>
        <Select label="Enquiry Category" error={fieldError("enquiryCategory")} {...register("enquiryCategory")}>
          <option value="">Select category</option>
          {ENQUIRY_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
        <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
          <input type="checkbox" {...register("financeRequired")} />
          Finance required
        </label>
        {financeRequired && <Input label="Finance remarks" error={fieldError("financeRemarks")} {...register("financeRemarks")} />}
      </div>
    ),
    (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
          <input type="checkbox" {...register("appointmentScheduled")} />
          Appointment scheduled
        </label>
        {appointmentScheduled && (
          <Input label="Appointment date/time" type="datetime-local" error={fieldError("appointmentAt")} {...register("appointmentAt")} />
        )}
        <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
          <input type="checkbox" {...register("testDriveInterested")} />
          Test drive interested
        </label>
        {testDriveInterested && (
          <Input label="No. of test drives" type="number" min={0} error={fieldError("testDriveCount")} {...register("testDriveCount")} />
        )}
      </div>
    ),
    (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <p className="sm:col-span-2 text-sm text-slate-500 dark:text-slate-400">Optional — only if the customer mentioned an exchange car.</p>
        <Input label="Model name" error={fieldError("exchangeCarModel")} {...register("exchangeCarModel")} />
        <Input label="Year" type="number" error={fieldError("exchangeCarYear")} {...register("exchangeCarYear")} />
        <Input label="KMs driven" type="number" min={0} error={fieldError("exchangeCarKms")} {...register("exchangeCarKms")} />
        <Input label="No. of owners" type="number" min={0} error={fieldError("exchangeCarOwners")} {...register("exchangeCarOwners")} />
      </div>
    ),
    (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input label="Called date" type="date" error={fieldError("calledDate")} {...register("calledDate")} />
        <div className="sm:col-span-2">
          <Textarea label="Remarks (others)" rows={2} error={fieldError("remarks")} {...register("remarks")} />
        </div>
      </div>
    ),
  ];

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title={isComplete ? "Complete Customer Details" : "Add Lead"}
        maxWidth={isComplete ? "max-w-3xl" : "max-w-2xl"}
      >
        {contextLabel && (
          <p className="-mt-2 mb-4 text-xs font-medium text-slate-500 dark:text-slate-400">{contextLabel}</p>
        )}

        {isComplete && (
          <p className="-mt-2 mb-5 text-sm text-slate-500 dark:text-slate-400">
            Everything known about this customer, grouped below — review and fill in whatever's missing.
          </p>
        )}

        {/* Step indicator — only meaningful for the "create" wizard flow */}
        {!isComplete && (
          <div className="mb-6 flex items-center gap-0.5 overflow-x-auto pb-1">
            {STEP_TITLES.map((title, index) => {
              const stepNumber = index + 1;
              const active = stepNumber === step;
              const done = stepNumber < step;
              return (
                <div key={title} className="flex items-center">
                  {index > 0 && (
                    <div className={clsx("h-0.5 w-5 shrink-0 sm:w-8", done ? "bg-blue-500" : "bg-slate-200 dark:bg-slate-700")} />
                  )}
                  <div className="flex flex-col items-center gap-1 px-0.5">
                    <span
                      className={clsx(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                        done && "bg-blue-500 text-white",
                        active && "bg-blue-600 text-white ring-4 ring-blue-100 dark:ring-blue-500/20",
                        !done && !active && "border-2 border-slate-200 bg-white text-slate-400 dark:border-slate-700 dark:bg-slate-900"
                      )}
                    >
                      {done ? <Check size={12} strokeWidth={3} /> : stepNumber}
                    </span>
                    <span
                      className={clsx(
                        "hidden max-w-[70px] text-center text-[10px] leading-tight sm:block",
                        active ? "font-semibold text-blue-700 dark:text-blue-400" : "text-slate-400"
                      )}
                    >
                      {title}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {lookupResult && !isComplete && (
          <div className="mb-4 flex flex-col gap-2">
            <div className="rounded-md bg-emerald-50 p-3 border border-emerald-200">
              <p className="text-sm text-emerald-800 font-medium flex items-center gap-2">
                <Check size={16} /> Customer Found! Existing details have been auto-filled.
              </p>
            </div>
            {lookupResult.hasActiveEnquiry && (
              <div className="rounded-md bg-amber-50 p-3 border border-amber-200">
                <p className="text-sm text-amber-800">
                  <span className="font-bold">Active Enquiry Detected:</span> This customer currently has an active enquiry in the <span className="font-semibold">{lookupResult.activeEnquiryStatus?.replaceAll("_", " ")}</span> stage. Saving this form will attach this contact to their existing enquiry unless you check the "Force new enquiry" box below.
                </p>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {isComplete ? (
            <div className="flex flex-col gap-5">
              {STEP_TITLES.map((title, index) => {
                const Icon = STEP_ICONS[index];
                return (
                  <div
                    key={title}
                    className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 shadow-sm shadow-slate-900/[0.02] dark:border-slate-800 dark:bg-slate-800/30"
                  >
                    <div className="mb-4 flex items-center gap-2.5">
                      <span className={clsx("flex h-8 w-8 shrink-0 items-center justify-center rounded-xl", STEP_ICON_STYLES[index])}>
                        <Icon size={15} />
                      </span>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h3>
                    </div>
                    {stepPanels[index]}
                  </div>
                );
              })}
            </div>
          ) : (
            stepPanels[step - 1]
          )}

          {resultMessage && <p className="text-sm font-medium text-emerald-600">{resultMessage}</p>}
          {draftMessage && <p className="text-sm font-medium text-blue-600 dark:text-blue-400">{draftMessage}</p>}

          <div className="mt-2 flex items-center justify-between gap-3 pt-2">
            <div>
              {!isComplete && step > 1 && (
                <Button type="button" variant="secondary" icon={<ChevronLeft size={15} />} onClick={goBack}>
                  Back
                </Button>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Button type="button" variant="secondary" onClick={handleClose}>
                Cancel
              </Button>
              {!isComplete && step < totalSteps && (
                <Button type="button" variant={step > 2 ? "secondary" : "primary"} onClick={goNext}>
                  Next
                  <ChevronRight size={15} />
                </Button>
              )}
              {!isComplete && step > 2 && (
                <Button
                  type="button"
                  variant="secondary"
                  icon={<Save size={15} />}
                  isLoading={saveDraft.isPending || updateDraft.isPending}
                  onClick={onSaveDraft}
                >
                  Save as Draft
                </Button>
              )}
              {(isComplete || step > 2) && (
                <Button type="submit" isLoading={isSubmitting}>
                  {isComplete ? "Save Details" : "Save Enquiry"}
                </Button>
              )}
            </div>
          </div>
        </form>
      </Modal>

      {/* Confirm-close dialog */}
      <Modal isOpen={showConfirmClose} onClose={() => setShowConfirmClose(false)} maxWidth="max-w-sm">
        <div className="mt-2 flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 ring-4 ring-amber-50 dark:bg-amber-500/20 dark:ring-amber-500/10">
            <svg className="h-6 w-6 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="mb-2 text-lg font-bold text-slate-900 dark:text-white">Discard Changes?</h3>
          <p className="mb-6 px-2 text-sm text-slate-500 dark:text-slate-400">
            Are you sure you want to close this form? Any unsaved data will be permanently lost
            {!isComplete && " (unless you Save as Draft first)"}.
          </p>
        </div>
        <div className="flex w-full gap-3">
          <Button type="button" variant="secondary" className="flex-1 justify-center" onClick={() => setShowConfirmClose(false)}>
            No, keep editing
          </Button>
          <Button type="button" variant="danger" className="flex-1 justify-center shadow-md shadow-rose-500/20" onClick={confirmClose}>
            Yes, discard
          </Button>
        </div>
      </Modal>
    </>
  );
}
