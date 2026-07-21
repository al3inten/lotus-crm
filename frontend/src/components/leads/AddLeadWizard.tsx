import { Fragment, useEffect, useRef, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import type { FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import { Check, Save, Building2, UserCircle2, Car, RefreshCw, ChevronLeft, ChevronRight, ExternalLink, BellRing } from "lucide-react";
import { Modal } from "../common/Modal";
import { Input, Select, Textarea } from "../common/Input";
import { SearchableSelect } from "../common/SearchableSelect";
import { DatePickerField, YearPicker } from "../common/DateTimePicker";
import { Switch } from "../common/Switch";
import { Button } from "../common/Button";
import { Card, CardHeader } from "../common/Card";
import { addLeadFormSchema, normaliseEmail } from "../../schemas/lead.schema";
import type { AddLeadFormValues, AddLeadFormInput } from "../../schemas/lead.schema";
import { useCreateWalkInLead, useSaveDraft, useUpdateDraft, useDeleteDraft, useLeadLookup } from "../../hooks/useLeads";
import { usePincodeLookup, usePostOfficeSearch, rankSuggestions } from "../../hooks/useLocationLookup";
import { TypeaheadInput } from "../common/TypeaheadInput";
import type { TypeaheadOption } from "../common/TypeaheadInput";
import { usePushRepeatEnquiryAlert } from "../../hooks/useNotifications";
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
import { EASE } from "../../lib/motion";

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
  "financeRequired",
  "financeRemarks",
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
  ["carModel", "variant", "enquiryType", "enquiryCategory", "financeRequired", "financeRemarks"],
  ["exchangeCarModel", "exchangeCarYear", "exchangeCarKms", "exchangeCarOwners", "exchangeCarRegNumber"],
];

const collapseTransition = { duration: 0.25, ease: EASE };
const collapseProps = {
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
      financeRequired: false,
      forceNew: false,
      ...initialValues,
    },
  });

  // Only supervisors may override the "customer already exists" block (enforced by the API too).
  const canForceNew = !!user && ["SUPER_ADMIN", "ADMIN", "BRANCH_MANAGER"].includes(user.role);

  const { data: crStaff } = useBranchStaff(watch("branchId"), "CR_TEAM", isOpen);
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
  const financeRequired = watch("financeRequired");
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

  // Location assistance (India Post public API, no key needed) — works whichever field the
  // CR fills in first:
  //  • Pincode typed → auto-fill City + suggest Area options.
  //  • Area or City typed → suggest matching Pincode (and each other) options.
  const pincode = watch("pincode") || "";
  const areaText = watch("area") || "";
  const cityText = watch("location") || "";
  const { data: pincodeInfo } = usePincodeLookup(pincode);
  const { data: areaMatches } = usePostOfficeSearch(areaText);
  const { data: cityMatches } = usePostOfficeSearch(cityText);

  const autofilledPincodeRef = useRef<string | null>(null);
  useEffect(() => {
    if (pincodeInfo && pincode !== autofilledPincodeRef.current && !isComplete) {
      if (pincodeInfo.city) setValue("location", pincodeInfo.city);
      autofilledPincodeRef.current = pincode;
    }
  }, [pincodeInfo, pincode, isComplete, setValue]);

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
      if (lookupResult.address) setValue("address", lookupResult.address);
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
    alternateMobile: values.alternateMobile || undefined,
    dob: toIso(values.dob),
    profession: values.profession || undefined,
    pincode: values.pincode || undefined,
    area: values.area || undefined,
    address: values.address || undefined,
    department: values.department || undefined,
    sourceCategory: values.sourceCategory || undefined,
    subsource: values.subsource || undefined,
    variant: values.variant || undefined,
    enquiryCategory: values.enquiryCategory || undefined,
    financeRequired: values.financeRequired,
    financeRemarks: values.financeRemarks || undefined,
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
    reset();
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

          {lookupResult && !isComplete && (
            <div className="mb-5 flex flex-col gap-2">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-500/20 dark:bg-emerald-500/10">
                <p className="flex items-center gap-2 text-sm font-medium text-emerald-800 dark:text-emerald-300">
                  <Check size={16} /> Customer found! Existing details have been auto-filled.
                </p>
              </div>
              {lookupResult.hasActiveEnquiry && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-500/20 dark:bg-amber-500/10">
                  <p className="text-sm text-amber-800 dark:text-amber-300">
                    <span className="font-bold">Active enquiry detected:</span> this customer currently has an active
                    enquiry in the{" "}
                    <span className="font-semibold">{lookupResult.activeEnquiryStatus?.replaceAll("_", " ")}</span>{" "}
                    stage. Saving this form will attach this contact to their existing enquiry unless you check
                    "Force new enquiry" in step 1.
                  </p>
                  <div className="mt-2.5 flex flex-wrap items-center gap-2">
                    {lookupResult.activeEnquiryId && (
                      <a
                        href={`/leads/${lookupResult.leadId}/enquiries/${lookupResult.activeEnquiryId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-amber-800 transition-colors hover:bg-amber-100 dark:border-amber-500/30 dark:bg-transparent dark:text-amber-200 dark:hover:bg-amber-500/10"
                      >
                        <ExternalLink size={13} /> View previous enquiry
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={notifyRepeatEnquiry}
                      disabled={pushAlert.isPending || !!alertResult}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-2.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <BellRing size={13} /> {pushAlert.isPending ? "Notifying…" : "Notify CR & manager"}
                    </button>
                    {alertResult && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                        <Check size={13} /> {alertResult}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

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
                <Card>
                  <CardHeader icon={<Building2 size={18} />} title={SECTIONS[0].title} subtitle="Where this enquiry came from and who's handling it." iconClassName={SECTIONS[0].iconClassName} />
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {isComplete ? (
                      <p className="sm:col-span-2 text-sm text-slate-500 dark:text-slate-400">
                        Branch, source, and assigned CR are already set for this enquiry — fill in department/sub-source
                        below if known.
                      </p>
                    ) : (
                      <>
                        <Controller
                          control={control}
                          name="branchId"
                          render={({ field }) => (
                            <SearchableSelect
                              ref={field.ref}
                              label="Dealer / Branch"
                              required
                              placeholder="Search branches…"
                              value={field.value}
                              onChange={field.onChange}
                              onBlur={field.onBlur}
                              error={fieldError("branchId")}
                              options={branches?.map((b) => ({ value: b.id, label: `${b.code} — ${b.name}` })) ?? []}
                            />
                          )}
                        />
                        <Controller
                          control={control}
                          name="assignedCrId"
                          render={({ field }) => (
                            <SearchableSelect
                              ref={field.ref}
                              label="CR (handled by)"
                              placeholder="Search CRs…"
                              value={field.value}
                              onChange={field.onChange}
                              onBlur={field.onBlur}
                              error={fieldError("assignedCrId")}
                              options={crStaff?.map((cr) => ({ value: cr.id, label: cr.name })) ?? []}
                            />
                          )}
                        />
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
                      label="Lead Source"
                      required
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
                      <div className="sm:col-span-2 mt-1 flex flex-col justify-between gap-2 border-t border-slate-100 pt-4 dark:border-slate-800 sm:flex-row sm:items-center">
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                          Enquiry date: {new Date().toLocaleDateString()}
                        </p>
                        {/* Overriding the duplicate-customer block is a supervisor call —
                            the API enforces the same rule regardless of this checkbox. */}
                        {canForceNew && (
                          <label className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-1.5 text-sm text-amber-700 dark:border-amber-800/50 dark:bg-amber-900/20 dark:text-amber-400">
                            <input type="checkbox" {...register("forceNew")} className="rounded border-amber-300 text-amber-600 focus:ring-amber-500" />
                            <span className="font-medium">Force new enquiry</span>
                          </label>
                        )}
                      </div>
                    )}
                  </div>
                </Card>
              )}

              {/* 2. Customer Details */}
              {(singlePage || step === 1) && (
                <Card>
                  <CardHeader icon={<UserCircle2 size={18} />} title={SECTIONS[1].title} subtitle="Who the customer is and how to reach them." iconClassName={SECTIONS[1].iconClassName} />
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Input label="Customer Name" required disabled={isComplete} error={fieldError("name")} {...register("name")} />
                    <div className="relative">
                      <Input label="Mobile Number" required disabled={isComplete} error={fieldError("phone")} {...register("phone")} />
                      {lookupLoading && (
                        <div className="absolute right-3 top-[38px]">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
                        </div>
                      )}
                    </div>
                    <Input label="Alternate mobile" error={fieldError("alternateMobile")} {...register("alternateMobile")} />
                    <Input label="Email" placeholder='name@example.com or "Nil"' required disabled={isComplete} error={fieldError("email")} {...register("email")} />
                    <Controller
                      control={control}
                      name="dob"
                      render={({ field }) => (
                        <DatePickerField
                          label="Date of birth"
                          value={field.value}
                          onChange={field.onChange}
                          error={fieldError("dob")}
                        />
                      )}
                    />
                    <Input label="Profession" error={fieldError("profession")} {...register("profession")} />
                    <Controller
                      control={control}
                      name="location"
                      render={({ field }) => (
                        <TypeaheadInput
                          label="City"
                          required
                          disabled={isComplete}
                          error={fieldError("location")}
                          value={field.value ?? ""}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          suggestions={citySuggestions}
                        />
                      )}
                    />
                    <Controller
                      control={control}
                      name="area"
                      render={({ field }) => (
                        <TypeaheadInput
                          label="Area"
                          required
                          placeholder="e.g. Peelamedu"
                          error={fieldError("area")}
                          value={field.value ?? ""}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          suggestions={areaSuggestions}
                        />
                      )}
                    />
                    <Controller
                      control={control}
                      name="pincode"
                      render={({ field }) => (
                        <TypeaheadInput
                          label="Pincode"
                          required
                          error={fieldError("pincode")}
                          value={field.value ?? ""}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          suggestions={pincodeSuggestions}
                        />
                      )}
                    />
                    <div className="sm:col-span-2">
                      <Textarea label="Address" rows={2} error={fieldError("address")} {...register("address")} />
                    </div>
                  </div>
                </Card>
              )}

              {/* 3. Vehicle Interest */}
              {(singlePage || step === 2) && (
                <Card>
                  <CardHeader icon={<Car size={18} />} title={SECTIONS[2].title} subtitle="The car they're after and how they'll pay for it." iconClassName={SECTIONS[2].iconClassName} />
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Controller
                      control={control}
                      name="carModel"
                      render={({ field }) => (
                        <SearchableSelect
                          ref={field.ref}
                          label="Vehicle Model"
                          required
                          disabled={isComplete}
                          placeholder="Search models…"
                          value={field.value}
                          onChange={(v) => {
                            field.onChange(v);
                            setValue("variant", "");
                          }}
                          onBlur={field.onBlur}
                          error={fieldError("carModel")}
                          options={modelOptions}
                        />
                      )}
                    />
                    <Controller
                      control={control}
                      name="variant"
                      render={({ field }) => (
                        <SearchableSelect
                          ref={field.ref}
                          label="Variant"
                          disabled={isComplete || !selectedModelName}
                          placeholder="Search variants…"
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          error={fieldError("variant")}
                          options={variantOptionsList}
                        />
                      )}
                    />
                    <Select label="Lead Type" required disabled={isComplete} error={fieldError("enquiryType")} {...register("enquiryType")}>
                      {ENQUIRY_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type.replaceAll("_", " ")}
                        </option>
                      ))}
                    </Select>
                    <Select label="Enquiry Category" error={fieldError("enquiryCategory")} {...register("enquiryCategory")}>
                      <option value="">Select category</option>
                      {enquiryCategoryOptions.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </Select>
                    <div className="sm:col-span-2">
                      <Switch
                        checked={!!financeRequired}
                        onChange={(v) => setValue("financeRequired", v)}
                        label="Finance required"
                        description="Toggle on if the customer needs financing for this purchase."
                      />
                    </div>
                    <AnimatePresence initial={false}>
                      {financeRequired && (
                        <motion.div key="finance-remarks" {...collapseProps}>
                          <Input label="Finance remarks" error={fieldError("financeRemarks")} {...register("financeRemarks")} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </Card>
              )}

              {/* 4. Exchange Car — optional, hidden unless the customer has one */}
              {(singlePage || step === 3) && (
                <Card>
                  <CardHeader
                    icon={<RefreshCw size={18} />}
                    title={SECTIONS[3].title}
                    subtitle="Optional — only if the customer mentioned an exchange vehicle."
                    iconClassName={SECTIONS[3].iconClassName}
                  />
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <Switch
                        checked={hasExchangeVehicle}
                        onChange={toggleExchangeVehicle}
                        label="Do you have a vehicle for exchange?"
                        description="Switch on to capture the customer's exchange vehicle details."
                      />
                    </div>
                    <AnimatePresence initial={false}>
                      {hasExchangeVehicle && (
                        <motion.div key="exchange-fields" {...collapseProps}>
                          <div className="grid grid-cols-1 gap-4 pt-1 sm:grid-cols-2">
                            <Input label="Model name" required error={fieldError("exchangeCarModel")} {...register("exchangeCarModel")} />
                            <Controller
                              control={control}
                              name="exchangeCarYear"
                              render={({ field }) => (
                                <YearPicker
                                  label="Year"
                                  required
                                  value={field.value as number | string | undefined}
                                  onChange={field.onChange}
                                  error={fieldError("exchangeCarYear")}
                                />
                              )}
                            />
                            <Input label="KMs driven" type="number" required min={0} error={fieldError("exchangeCarKms")} {...register("exchangeCarKms")} />
                            <Input label="No. of owners" type="number" required min={0} error={fieldError("exchangeCarOwners")} {...register("exchangeCarOwners")} />
                            <Input
                              label="Car Register Number"
                              required
                              placeholder="e.g. TN 37 AB 1234"
                              error={fieldError("exchangeCarRegNumber")}
                              {...register("exchangeCarRegNumber")}
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </Card>
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
