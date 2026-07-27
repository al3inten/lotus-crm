import { Fragment, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import type { FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import { Check, Save, Building2, UserCircle2, Car, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import { Modal } from "../common/Modal";
import { Button } from "../common/Button";
import { addLeadFormSchema, normaliseEmail } from "../../schemas/lead.schema";
import type { AddLeadFormValues, AddLeadFormInput } from "../../schemas/lead.schema";
import { useCreateWalkInLead, useSaveDraft, useUpdateDraft, useDeleteDraft, useLeadLookup } from "../../hooks/useLeads";
import { usePincodeLookup, usePostOfficeSearch, rankSuggestions } from "../../hooks/useLocationLookup";
import type { TypeaheadOption } from "../common/TypeaheadInput";
import { usePushRepeatEnquiryAlert } from "../../hooks/useNotifications";
import { useUpdateEnquiryDetails } from "../../hooks/useEnquiry";
import { useBranches } from "../../hooks/useBranches";
import { useBranchStaff } from "../../hooks/useUsers";
import { useVehicleModels } from "../../hooks/useVehicles";
import { useAuth } from "../../context/AuthContext";
import {
  LEAD_SUBSOURCES,
  SOURCE_CATEGORY_SUBSOURCES,
  ENQUIRY_CATEGORIES,
} from "../../types";
import type { LeadEnrichmentPayload, WalkInLeadPayload } from "../../api/leads.api";
import { EASE } from "../../lib/motion";
import { RepeatEnquiryBanner } from "./wizard/RepeatEnquiryBanner";
import { Step1EnquirySource } from "./wizard/Step1EnquirySource";
import { Step2CustomerDetails } from "./wizard/Step2CustomerDetails";
import { Step3VehicleInterest } from "./wizard/Step3VehicleInterest";
import { Step4ExchangeCar } from "./wizard/Step4ExchangeCar";
import { ConfirmCloseModal } from "./wizard/ConfirmCloseModal";

/** Section order for the flattened, single-scroll form, matching the dealership's
 * intake flow. */
const SECTIONS = [
  { title: "Enquiry & Source", icon: Building2, iconClassName: "bg-blue-50 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400" },
  { title: "Customer Details", icon: UserCircle2, iconClassName: "bg-violet-50 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400" },
  { title: "Vehicle Interest", icon: Car, iconClassName: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400" },
  { title: "Exchange Car", icon: RefreshCw, iconClassName: "bg-cyan-50 text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-400" },
] as const;

/** Visual top-to-bottom field order, used to focus the first invalid field on save
 * (independent of whatever order zod happens to report validation issues in). */
const FIELD_ORDER: (keyof AddLeadFormInput)[] = [
  "branchId",
  "assignedCrId",
  "department",
  "sourceCategory",
  "subsource",
  "name",
  "phone",
  "alternateMobile",
  "email",
  "dob",
  "profession",
  "pincode",
  "area",
  "location",
  "address",
  "carModel",
  "variant",
  "enquiryType",
  "enquiryCategory",
  "exchangeCarModel",
  "exchangeCarYear",
  "exchangeCarKms",
  "exchangeCarOwners",
  "exchangeCarRegNumber",
  "calledDate",
  "remarks",
];

/** Fields owned by each wizard step (index-aligned to SECTIONS) — used to validate
 * a step before advancing and to jump to the offending step on a failed save. */
const STEP_FIELDS: (keyof AddLeadFormInput)[][] = [
  ["branchId", "assignedCrId", "department", "sourceCategory", "subsource"],
  ["name", "phone", "alternateMobile", "email", "dob", "profession", "pincode", "area", "location", "address"],
  ["carModel", "variant", "enquiryType", "enquiryCategory"],
  ["exchangeCarModel", "exchangeCarYear", "exchangeCarKms", "exchangeCarOwners", "exchangeCarRegNumber"],
];

const collapseTransition = { duration: 0.25, ease: EASE };
export const collapseProps = {
  initial: { height: 0, opacity: 0 },
  animate: { height: "auto", opacity: 1 },
  exit: { height: 0, opacity: 0 },
  transition: collapseTransition,
  className: "overflow-hidden sm:col-span-2",
} as const;

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
  // Only fetch the wizard's option lists once it's actually opened. This component sits
  // permanently mounted (closed) on pages like LeadDetail — fetching on mount fired
  // branches/vehicle-models/staff requests before the user ever opened it.
  const { data: branches } = useBranches(isOpen);
  const createWalkIn = useCreateWalkInLead();
  const updateDetails = useUpdateEnquiryDetails(enquiryId ?? "");
  const saveDraft = useSaveDraft();
  const updateDraft = useUpdateDraft();
  const deleteDraft = useDeleteDraft();
  const pushAlert = usePushRepeatEnquiryAlert();
  const [alertResult, setAlertResult] = useState<string | null>(null);

  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [draftMessage, setDraftMessage] = useState<string | null>(null);
  const [showConfirmClose, setShowConfirmClose] = useState(false);
  const [draftId, setDraftId] = useState<string | undefined>(initialDraftId);
  const [autofilledPhone, setAutofilledPhone] = useState<string | null>(null);
  const [hasExchangeVehicle, setHasExchangeVehicle] = useState(false);
  const [pendingAction, setPendingAction] = useState<"save" | "saveAndNew" | null>(null);
  const autoCloseTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [step, setStep] = useState(0);
  const totalSteps = SECTIONS.length;
  const isLastStep = step === totalSteps - 1;
  // From the Vehicle Interest step (index 2) onward every required field has been
  // captured, so the enquiry can be saved without walking through the optional
  // Exchange step.
  const REQUIRED_UP_TO_STEP = 2;
  const canSave = step >= REQUIRED_UP_TO_STEP;
  // Complete-details mode reviews an existing enquiry, so it drops the step-by-step
  // flow and shows every section on one scrollable page for quick top-to-bottom edits.
  const singlePage = mode === "complete";

  useEffect(() => () => clearTimeout(autoCloseTimer.current), []);

  const {
    register,
    control,
    handleSubmit,
    watch,
    getValues,
    setValue,
    setFocus,
    trigger,
    reset,
    formState: { errors },
  } = useForm<AddLeadFormInput, unknown, AddLeadFormValues>({
    resolver: zodResolver(addLeadFormSchema),
    defaultValues: {
      branchId: user?.branchId ?? "",
      assignedCrId: user?.role === "CR_TEAM" ? user.id : "",
      forceNew: false,
      ...initialValues,
    },
  });

  // Only supervisors may override the "customer already exists" block (enforced by the API too).
  const canForceNew = !!user && ["SUPER_ADMIN", "ADMIN", "BRANCH_MANAGER"].includes(user.role);

  const { data: crStaff } = useBranchStaff(watch("branchId"), "CR_TEAM", isOpen);
  const { data: consultantStaff } = useBranchStaff(watch("branchId"), "CONSULTANT", isOpen);
  const { data: vehicleModels } = useVehicleModels(isOpen);
  const selectedSourceCategory = watch("sourceCategory");
  const subsourceOptions = selectedSourceCategory
    ? SOURCE_CATEGORY_SUBSOURCES[selectedSourceCategory]
    : LEAD_SUBSOURCES;

  // A walk-in customer is physically in the showroom, so they're never a cold lead —
  // only Hot/Warm apply. Every other source keeps the full Hot/Warm/Cold set.
  const isWalkInSource = selectedSourceCategory === "WALK_IN";
  const enquiryCategoryOptions = isWalkInSource
    ? ENQUIRY_CATEGORIES.filter((c) => c !== "COLD")
    : ENQUIRY_CATEGORIES;
  const selectedEnquiryCategory = watch("enquiryCategory");

  // Switching to Walk-in after Cold was already picked would leave an option that's no
  // longer offered selected — clear it so the user consciously re-picks Hot or Warm.
  useEffect(() => {
    if (isWalkInSource && selectedEnquiryCategory === "COLD") {
      setValue("enquiryCategory", "");
    }
  }, [isWalkInSource, selectedEnquiryCategory, setValue]);

  // Subsource options depend on the chosen Source Category — a value carried over from a
  // previously selected category (or a stale/mismatched value from existing data) that
  // isn't valid for the current one would stay silently set (invisible in the dropdown,
  // which shows blank) and still get saved. Clear it so the user consciously re-picks.
  const selectedSubsource = watch("subsource");
  useEffect(() => {
    if (selectedSubsource && !subsourceOptions.includes(selectedSubsource)) {
      setValue("subsource", "");
    }
  }, [selectedSubsource, subsourceOptions, setValue]);
  const selectedModelName = watch("carModel") as string | undefined;
  const selectedVariantName = watch("variant") as string | undefined;
  const activeModels = vehicleModels?.filter((m) => m.isActive) ?? [];
  const selectedModel = vehicleModels?.find((m) => m.name === selectedModelName);
  const variantOptions = selectedModel?.variants.filter((v) => v.isActive) ?? [];

  const modelOptions = [
    ...(selectedModelName && !activeModels.some((m) => m.name === selectedModelName)
      ? [{ value: selectedModelName, label: selectedModelName }]
      : []),
    ...activeModels.map((m) => ({ value: m.name, label: m.name })),
  ];
  // A model may have several variants sharing a name but differing in fuel type — the
  // schema only requires (model, name, fuelType) to be unique. Since an enquiry stores
  // the variant as a plain name string, those rows are indistinguishable once selected,
  // so collapse them into one option (and merge their hints) rather than rendering
  // duplicate rows with duplicate React keys.
  const variantsByName = new Map<string, string[]>();
  for (const v of variantOptions) {
    const hint = `${v.transmissionType} · ${v.fuelType.replaceAll("_", " + ")}`;
    const hints = variantsByName.get(v.name) ?? [];
    if (!hints.includes(hint)) hints.push(hint);
    variantsByName.set(v.name, hints);
  }
  const variantOptionsList = [
    ...(selectedVariantName && !variantsByName.has(selectedVariantName)
      ? [{ value: selectedVariantName, label: selectedVariantName }]
      : []),
    ...Array.from(variantsByName, ([name, hints]) => ({
      value: name,
      label: name,
      hint: hints.join(" / "),
    })),
  ];

  const phone = watch("phone") || "";
  const { data: lookupResult, isFetching: lookupLoading } = useLeadLookup(phone);
  const isComplete = mode === "complete";

  // Duplicate mobile → the save is blocked (not merely warned about) until "Force new
  // enquiry" is ticked. The API enforces the same rule.
  const forceNew = watch("forceNew");
  const isDuplicateBlocked = !isComplete && !!lookupResult && lookupResult.enquiryCount > 0 && !forceNew;

  // Location assistance (India Post public API, no key needed) — works whichever field the
  // CR fills in first:
  //  • Pincode typed → auto-fill City + suggest Area options.
  //  • Area or City typed → suggest matching Pincode (and each other) options.
  const pincode = watch("pincode") || "";
  const areaText = watch("area") || "";
  const cityText = watch("location") || "";
  const { data: pincodeInfo, isFetching: pincodeLoading } = usePincodeLookup(pincode);
  const { data: areaMatches } = usePostOfficeSearch(areaText);
  const { data: cityMatches } = usePostOfficeSearch(cityText);

  // Seeded with the pincode the form opened with so we don't clobber an already-saved
  // city on open, but still autofill on any subsequent pincode edit — including in
  // "complete"/edit mode, where the CR may correct a wrong pincode and expects City to update.
  const autofilledPincodeRef = useRef<string | null>(initialValues?.pincode ?? null);
  useEffect(() => {
    if (pincodeInfo && pincode !== autofilledPincodeRef.current) {
      if (pincodeInfo.city) setValue("location", pincodeInfo.city);
      autofilledPincodeRef.current = pincode;
    }
  }, [pincodeInfo, pincode, setValue]);

  const toOptions = (values: string[]): TypeaheadOption[] => [...new Set(values)].map((v) => ({ value: v, label: v }));

  // Ranked against whatever the CR has already typed in that field (or, for Pincode, the
  // Area/City text driving the search) — exact/prefix matches surface first, capped to a
  // short list instead of dumping every match the API returns.
  const pincodeSuggestions = rankSuggestions(
    toOptions([...(areaMatches ?? []), ...(cityMatches ?? [])].map((m) => m.pincode)),
    pincode
  );
  const areaSuggestions = rankSuggestions(
    toOptions([...(pincodeInfo?.areas ?? []), ...(cityMatches ?? []).map((m) => m.name)]),
    areaText
  );
  const citySuggestions = rankSuggestions(
    toOptions([...(areaMatches ?? []), ...(cityMatches ?? [])].map((m) => m.city)),
    cityText
  );

  useEffect(() => {
    if (lookupResult && phone && phone !== autofilledPhone && !isComplete) {
      if (lookupResult.name) setValue("name", lookupResult.name);
      if (lookupResult.email) setValue("email", lookupResult.email);
      if (lookupResult.alternateMobile) setValue("alternateMobile", lookupResult.alternateMobile);
      if (lookupResult.dob) setValue("dob", lookupResult.dob.slice(0, 10));
      if (lookupResult.profession) setValue("profession", lookupResult.profession);
      if (lookupResult.pincode) setValue("pincode", lookupResult.pincode);
      if (lookupResult.area) setValue("area", lookupResult.area);
      if (lookupResult.address) setValue("address", lookupResult.address);
      if (lookupResult.location) setValue("location", lookupResult.location);
      if (lookupResult.department) setValue("department", lookupResult.department);
      setAutofilledPhone(phone);
    }
  }, [lookupResult, phone, autofilledPhone, setValue, isComplete]);

  useEffect(() => {
    if (isOpen) {
      clearTimeout(autoCloseTimer.current);
      setResultMessage(null);
      setDraftMessage(null);
      setDraftId(initialDraftId);
      setPendingAction(null);
      setAlertResult(null);
      setStep(0);
      setHasExchangeVehicle(
        !!(initialValues?.exchangeCarModel || initialValues?.exchangeCarYear || initialValues?.exchangeCarKms || initialValues?.exchangeCarOwners)
      );
      // react-hook-form only applies `defaultValues` at mount, so re-push the latest
      // initialValues (e.g. the lead's saved address) into the form every time it reopens.
      reset({
        branchId: user?.branchId ?? "",
        assignedCrId: user?.role === "CR_TEAM" ? user.id : "",
        forceNew: false,
        ...initialValues,
      });
    }
    // Only re-sync when the modal is (re)opened — not on every keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Mirror the exchange toggle into the form so zod's conditional rule (which makes every
  // exchange field mandatory) can see it. One effect covers all the places the state is set.
  useEffect(() => {
    setValue("hasExchangeVehicle", hasExchangeVehicle);
  }, [hasExchangeVehicle, setValue]);

  const toggleExchangeVehicle = (val: boolean) => {
    setHasExchangeVehicle(val);
    if (!val) {
      setValue("exchangeCarModel", "");
      setValue("exchangeCarYear", undefined);
      setValue("exchangeCarKms", undefined);
      setValue("exchangeCarOwners", undefined);
      setValue("exchangeCarRegNumber", "");
    }
  };

  const buildEnrichmentPayload = (values: AddLeadFormValues): LeadEnrichmentPayload => ({
    name: values.name || undefined,
    location: values.location || undefined,
    alternateMobile: values.alternateMobile || undefined,
    dob: toIso(values.dob),
    profession: values.profession || undefined,
    pincode: values.pincode || undefined,
    area: values.area || undefined,
    address: values.address || undefined,
    department: values.department || undefined,
    sourceCategory: values.sourceCategory || undefined,
    // null (not undefined) — an empty value here means the user cleared it (directly, or
    // via the Source Category reset effect above), and that clear must actually reach the
    // DB. undefined would be read by the backend as "field not touched", leaving whatever
    // subsource was already saved in place even though the dropdown now shows blank.
    subsource: values.subsource || null,
    variant: values.variant || undefined,
    enquiryCategory: values.enquiryCategory || undefined,
    exchangeCarModel: values.exchangeCarModel || undefined,
    exchangeCarYear: values.exchangeCarYear,
    exchangeCarKms: values.exchangeCarKms,
    exchangeCarOwners: values.exchangeCarOwners,
    exchangeCarRegNumber: values.exchangeCarRegNumber || undefined,
    calledDate: toIso(values.calledDate),
    remarks: values.remarks || undefined,
  });

  const onSubmit = async (values: AddLeadFormValues, andAddAnother = false) => {
    setResultMessage(null);
    if (isDuplicateBlocked) {
      setSaveError(
        `This mobile number already belongs to ${lookupResult?.name ?? "an existing customer"}. ` +
          (canForceNew
            ? 'Tick "Force new enquiry" in the Vehicle Interest step to save this as a separate enquiry.'
            : "Ask a manager to save it as a new enquiry, or work on their existing enquiry instead.")
      );
      return;
    }
    setPendingAction(andAddAnother ? "saveAndNew" : "save");
    setSaveError(null);
    try {
      if (isComplete) {
        await updateDetails.mutateAsync(buildEnrichmentPayload(values));
        onClose();
        return;
      }

      const payload: WalkInLeadPayload = {
        name: values.name,
        phone: values.phone,
        // "Nil" means the customer has no email — store nothing rather than the literal.
        email: normaliseEmail(values.email),
        carModel: values.carModel,
        enquiryType: values.enquiryType,
        location: values.location || undefined,
        branchId: values.branchId,
        assignedCrId: values.assignedCrId || undefined,
        consultantId: values.consultantId || undefined,
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
      setHasExchangeVehicle(false);
      reset({ branchId: values.branchId, assignedCrId: values.assignedCrId });

      if (andAddAnother) {
        setStep(0);
        setFocus("name");
      } else {
        autoCloseTimer.current = setTimeout(onClose, 1500);
      }
    } catch (err) {
      // The API rejects a second enquiry for a known customer unless forced, so show
      // that message verbatim rather than a generic failure.
      const message =
        (err as { response?: { data?: { error?: string } } }).response?.data?.error ??
        "Could not save this enquiry. Please try again.";
      setSaveError(message);
    } finally {
      setPendingAction(null);
    }
  };

  const onInvalid = (formErrors: FieldErrors<AddLeadFormInput>) => {
    const first = FIELD_ORDER.find((name) => formErrors[name]);
    if (!first) return;
    // Jump to whichever step owns the first invalid field, then focus it.
    const stepIdx = STEP_FIELDS.findIndex((fields) => fields.includes(first));
    if (stepIdx !== -1) setStep(stepIdx);
    setTimeout(() => setFocus(first), 0);
  };

  // Advance a step. In create mode we validate the current step's fields first so the
  // user can't skip past required inputs; complete mode advances freely (final save
  // still validates and jumps back to any offending step).
  const goNext = async () => {
    if (!isComplete) {
      const valid = await trigger(STEP_FIELDS[step]);
      if (!valid) {
        const firstBad = STEP_FIELDS[step].find((name) => errors[name]);
        if (firstBad) setFocus(firstBad);
        return;
      }
    }
    setStep((s) => Math.min(totalSteps - 1, s + 1));
  };
  const goBack = () => setStep((s) => Math.max(0, s - 1));

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

  const notifyRepeatEnquiry = async () => {
    if (!lookupResult?.activeEnquiryId) return;
    const { notified } = await pushAlert.mutateAsync(lookupResult.activeEnquiryId);
    setAlertResult(
      notified > 0
        ? `Notified ${notified} ${notified === 1 ? "person" : "people"} (CR & branch manager).`
        : "No one to notify — the CR/manager may be you, or none is assigned."
    );
  };

  const handleClose = () => setShowConfirmClose(true);
  const confirmClose = () => {
    setShowConfirmClose(false);
    onClose();
    // Form is re-synced from the latest initialValues on next open (see isOpen effect above);
    // resetting here to the stale mount-time defaults would blow away unrelated saved fields.
  };

  const fieldError = (name: keyof AddLeadFormInput) => errors[name]?.message as string | undefined;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title={isComplete ? "Complete Customer Details" : "Add Lead"}
        maxWidth="max-w-3xl"
        footer={
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
            <div>
              {!isComplete && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  icon={<Save size={14} />}
                  isLoading={saveDraft.isPending || updateDraft.isPending}
                  onClick={onSaveDraft}
                >
                  Save as Draft
                </Button>
              )}
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Button type="button" variant="secondary" size="lg" onClick={handleClose}>
                Cancel
              </Button>
              {!singlePage && step > 0 && (
                <Button type="button" variant="secondary" size="lg" icon={<ChevronLeft size={16} />} onClick={goBack}>
                  Back
                </Button>
              )}
              {!singlePage && !isLastStep && (
                <Button type="button" size="lg" icon={<ChevronRight size={16} />} onClick={goNext}>
                  Next
                </Button>
              )}
              {(canSave || isComplete) && (
                <Button
                  type="button"
                  size="lg"
                  icon={<Check size={16} />}
                  isLoading={pendingAction === "save"}
                  disabled={isDuplicateBlocked}
                  title={
                    isDuplicateBlocked
                      ? 'Duplicate mobile number — tick "Force new enquiry" in the Vehicle Interest step to save'
                      : undefined
                  }
                  onClick={() => handleSubmit((values) => onSubmit(values, false), onInvalid)()}
                >
                  {isComplete ? "Save Details" : "Save Enquiry"}
                </Button>
              )}
            </div>
          </div>
        }
      >
        <div className="flex flex-col">
          {contextLabel && (
            <p className="-mt-2 mb-1 text-xs font-medium text-slate-500 dark:text-slate-400">{contextLabel}</p>
          )}

          {isComplete && (
            <p className="-mt-1 mb-3 text-sm text-slate-500 dark:text-slate-400">
              Everything known about this customer, grouped below — review and fill in whatever's missing.
            </p>
          )}

          <RepeatEnquiryBanner
            lookupResult={lookupResult}
            isComplete={isComplete}
            isDuplicateBlocked={isDuplicateBlocked}
            canForceNew={canForceNew}
            alertResult={alertResult}
            pushAlertPending={pushAlert.isPending}
            onNotify={notifyRepeatEnquiry}
          />

          {/* Progress rail — connectors fill blue as the enquiry advances. */}
          {!singlePage && (
          <div className="mb-4 flex items-center">
            {SECTIONS.map((section, i) => {
              const Icon = section.icon;
              const active = i === step;
              const done = i < step;
              return (
                <Fragment key={section.title}>
                  {i > 0 && (
                    <div
                      className={clsx(
                        "mx-1.5 h-[3px] flex-1 rounded-full transition-colors duration-300",
                        i <= step ? "bg-blue-500" : "bg-slate-200 dark:bg-slate-700"
                      )}
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => setStep(i)}
                    aria-current={active ? "step" : undefined}
                    aria-label={`Step ${i + 1}: ${section.title}`}
                    title={section.title}
                    className={clsx(
                      "relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all duration-200",
                      done && "bg-blue-500 text-white",
                      active && "bg-blue-600 text-white shadow-lg shadow-blue-600/30 ring-4 ring-blue-100 dark:ring-blue-500/25",
                      !done && !active &&
                        "border-2 border-slate-200 bg-white text-slate-400 hover:border-blue-300 hover:text-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-blue-500/50"
                    )}
                  >
                    {done ? <Check size={15} strokeWidth={3} /> : <Icon size={16} />}
                  </button>
                </Fragment>
              );
            })}
          </div>
          )}

          <form onSubmit={handleSubmit((values) => onSubmit(values, false), onInvalid)} className="flex flex-col gap-4">
            <div className="flex items-baseline justify-between gap-3">
              {singlePage ? (
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-blue-600 dark:text-blue-400">
                  All details
                </p>
              ) : (
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-blue-600 dark:text-blue-400">
                  Step {step + 1} <span className="text-slate-300 dark:text-slate-600">/ {totalSteps}</span>
                </p>
              )}
              <p className="text-xs font-medium text-slate-400 dark:text-slate-500">
                <span className="font-bold text-red-500">*</span> required
              </p>
            </div>
            <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.2, ease: EASE }}
              className="flex min-w-0 flex-1 flex-col gap-6 [&_input:not([type=checkbox])]:py-3 [&_input:not([type=checkbox])]:text-[15px] [&_select]:py-3 [&_select]:text-[15px] [&_textarea]:py-3 [&_textarea]:text-[15px]"
            >
              {/* 1. Enquiry & Source */}
              {(singlePage || step === 0) && (
                <Step1EnquirySource
                  control={control}
                  register={register}
                  fieldError={fieldError}
                  setValue={setValue}
                  isComplete={isComplete}
                  branches={branches}
                  crStaff={crStaff}
                  subsourceOptions={subsourceOptions}
                  sectionTitle={SECTIONS[0].title}
                  sectionIconClassName={SECTIONS[0].iconClassName}
                />
              )}

              {/* 2. Customer Details */}
              {(singlePage || step === 1) && (
                <Step2CustomerDetails
                  control={control}
                  register={register}
                  fieldError={fieldError}
                  isComplete={isComplete}
                  lookupLoading={lookupLoading}
                  cityLoading={pincodeLoading}
                  citySuggestions={citySuggestions}
                  areaSuggestions={areaSuggestions}
                  pincodeSuggestions={pincodeSuggestions}
                  sectionTitle={SECTIONS[1].title}
                  sectionIconClassName={SECTIONS[1].iconClassName}
                />
              )}

              {/* 3. Vehicle Interest */}
              {(singlePage || step === 2) && (
                <Step3VehicleInterest
                  control={control}
                  register={register}
                  fieldError={fieldError}
                  setValue={setValue}
                  isComplete={isComplete}
                  canForceNew={canForceNew}
                  selectedModelName={selectedModelName}
                  modelOptions={modelOptions}
                  variantOptionsList={variantOptionsList}
                  enquiryCategoryOptions={enquiryCategoryOptions}
                  consultantOptions={(consultantStaff ?? []).map((c) => ({ value: c.id, label: c.name }))}
                  sectionTitle={SECTIONS[2].title}
                  sectionIconClassName={SECTIONS[2].iconClassName}
                />
              )}

              {/* 4. Exchange Car — optional, hidden unless the customer has one */}
              {(singlePage || step === 3) && (
                <Step4ExchangeCar
                  register={register}
                  fieldError={fieldError}
                  control={control}
                  hasExchangeVehicle={hasExchangeVehicle}
                  toggleExchangeVehicle={toggleExchangeVehicle}
                  sectionTitle={SECTIONS[3].title}
                  sectionIconClassName={SECTIONS[3].iconClassName}
                />
              )}

            </motion.div>
            </AnimatePresence>

            {resultMessage && <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">{resultMessage}</p>}
            {saveError && (
              <p className="text-sm font-medium text-red-600 dark:text-red-400" role="alert">
                {saveError}
              </p>
            )}
            {draftMessage && <p className="text-sm font-medium text-blue-600 dark:text-blue-400">{draftMessage}</p>}
          </form>
        </div>
      </Modal>

      <ConfirmCloseModal
        isOpen={showConfirmClose}
        onClose={() => setShowConfirmClose(false)}
        onConfirm={confirmClose}
        isComplete={isComplete}
      />
    </>
  );
}
