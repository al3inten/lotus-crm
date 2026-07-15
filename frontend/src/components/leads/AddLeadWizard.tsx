import { useEffect, useRef, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import type { FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import { Check, Save, Plus, Building2, UserCircle2, Car, CalendarClock, RefreshCw, ClipboardEdit } from "lucide-react";
import { Modal } from "../common/Modal";
import { Input, Select, Textarea } from "../common/Input";
import { SearchableSelect } from "../common/SearchableSelect";
import { YearPicker } from "../common/YearPicker";
import { DateTimePicker } from "../common/DateTimePicker";
import { Switch } from "../common/Switch";
import { Button } from "../common/Button";
import { Card, CardHeader } from "../common/Card";
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
import { fadeUp, staggerContainer, EASE } from "../../lib/motion";

/** Section order for the flattened, single-scroll form — Exchange Car sits before
 * Appointment & Test Drive per the dealership's intake flow. */
const SECTIONS = [
  { title: "Enquiry & Source", icon: Building2, iconClassName: "bg-blue-50 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400" },
  { title: "Customer Details", icon: UserCircle2, iconClassName: "bg-violet-50 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400" },
  { title: "Vehicle Interest", icon: Car, iconClassName: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400" },
  { title: "Exchange Car", icon: RefreshCw, iconClassName: "bg-cyan-50 text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-400" },
  { title: "Appointment & Test Drive", icon: CalendarClock, iconClassName: "bg-amber-50 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400" },
  { title: "Assignment & Follow-up", icon: ClipboardEdit, iconClassName: "bg-rose-50 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400" },
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
  "appointmentScheduled",
  "appointmentAt",
  "testDriveInterested",
  "testDriveCount",
  "calledDate",
  "remarks",
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
  const { data: branches } = useBranches();
  const createWalkIn = useCreateWalkInLead();
  const updateDetails = useUpdateEnquiryDetails(enquiryId ?? "");
  const saveDraft = useSaveDraft();
  const updateDraft = useUpdateDraft();
  const deleteDraft = useDeleteDraft();

  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [draftMessage, setDraftMessage] = useState<string | null>(null);
  const [showConfirmClose, setShowConfirmClose] = useState(false);
  const [draftId, setDraftId] = useState<string | undefined>(initialDraftId);
  const [autofilledPhone, setAutofilledPhone] = useState<string | null>(null);
  const [hasExchangeVehicle, setHasExchangeVehicle] = useState(false);
  const [pendingAction, setPendingAction] = useState<"save" | "saveAndNew" | null>(null);
  const autoCloseTimer = useRef<ReturnType<typeof setTimeout>>();
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [activeSection, setActiveSection] = useState(0);

  useEffect(() => () => clearTimeout(autoCloseTimer.current), []);

  // Drives the sticky section-nav's active highlight as the form scrolls, and
  // powers its click-to-jump behaviour — scoped to the Modal's own scroll container.
  useEffect(() => {
    if (!isOpen) return;
    const root = sectionRefs.current[0]?.closest(".overflow-y-auto") as HTMLElement | null;
    if (!root) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const topMost = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (!topMost) return;
        const idx = sectionRefs.current.findIndex((el) => el === topMost.target);
        if (idx !== -1) setActiveSection(idx);
      },
      { root, rootMargin: "-8% 0px -75% 0px", threshold: 0 }
    );
    sectionRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [isOpen]);

  const scrollToSection = (index: number) => {
    sectionRefs.current[index]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const {
    register,
    control,
    handleSubmit,
    watch,
    getValues,
    setValue,
    setFocus,
    reset,
    formState: { errors },
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
  const variantOptionsList = [
    ...(selectedVariantName && !variantOptions.some((v) => v.name === selectedVariantName)
      ? [{ value: selectedVariantName, label: selectedVariantName }]
      : []),
    ...variantOptions.map((v) => ({
      value: v.name,
      label: v.name,
      hint: `${v.transmissionType} · ${v.fuelType.replaceAll("_", " + ")}`,
    })),
  ];

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

  useEffect(() => {
    if (isOpen) {
      clearTimeout(autoCloseTimer.current);
      setResultMessage(null);
      setDraftMessage(null);
      setDraftId(initialDraftId);
      setPendingAction(null);
      setHasExchangeVehicle(
        !!(initialValues?.exchangeCarModel || initialValues?.exchangeCarYear || initialValues?.exchangeCarKms || initialValues?.exchangeCarOwners)
      );
    }
    // Only re-sync when the modal is (re)opened — not on every keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const toggleExchangeVehicle = (val: boolean) => {
    setHasExchangeVehicle(val);
    if (!val) {
      setValue("exchangeCarModel", "");
      setValue("exchangeCarYear", undefined);
      setValue("exchangeCarKms", undefined);
      setValue("exchangeCarOwners", undefined);
    }
  };

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

  const onSubmit = async (values: AddLeadFormValues, andAddAnother = false) => {
    setResultMessage(null);
    setPendingAction(andAddAnother ? "saveAndNew" : "save");
    try {
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
      setHasExchangeVehicle(false);
      reset({ branchId: values.branchId, assignedCrId: values.assignedCrId });

      if (andAddAnother) {
        setFocus("name");
      } else {
        autoCloseTimer.current = setTimeout(onClose, 1500);
      }
    } finally {
      setPendingAction(null);
    }
  };

  const onInvalid = (formErrors: FieldErrors<AddLeadFormInput>) => {
    const first = FIELD_ORDER.find((name) => formErrors[name]);
    if (first) setFocus(first);
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

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title={isComplete ? "Complete Customer Details" : "Add Lead"}
        maxWidth="max-w-6xl"
        footer={
          <div className="flex items-center justify-between gap-3">
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
            <div className="flex items-center gap-3">
              <Button type="button" variant="secondary" size="lg" onClick={handleClose}>
                Cancel
              </Button>
              {!isComplete && (
                <Button
                  type="button"
                  variant="secondary"
                  size="lg"
                  icon={<Plus size={16} />}
                  isLoading={pendingAction === "saveAndNew"}
                  onClick={() => handleSubmit((values) => onSubmit(values, true), onInvalid)()}
                >
                  Save & Add Another
                </Button>
              )}
              <Button
                type="button"
                size="lg"
                icon={<Check size={16} />}
                isLoading={pendingAction === "save"}
                onClick={() => handleSubmit((values) => onSubmit(values, false), onInvalid)()}
              >
                {isComplete ? "Save Details" : "Save Lead"}
              </Button>
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

          <p className="mb-5 text-xs font-medium text-slate-400 dark:text-slate-500">
            Fields marked with <span className="font-bold text-red-500">*</span> are required.
          </p>

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
                    "Force new enquiry" below.
                  </p>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit((values) => onSubmit(values, false), onInvalid)} className="flex flex-col gap-4">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
              <nav aria-label="Form sections" className="hidden shrink-0 flex-col gap-1 lg:sticky lg:top-0 lg:flex lg:w-56">
                {SECTIONS.map((section, i) => {
                  const Icon = section.icon;
                  const isActive = activeSection === i;
                  return (
                    <button
                      key={section.title}
                      type="button"
                      onClick={() => scrollToSection(i)}
                      aria-current={isActive ? "true" : undefined}
                      className={clsx(
                        "group flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-left text-sm font-medium transition-colors",
                        isActive
                          ? "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300"
                          : "text-slate-500 hover:bg-slate-50 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200"
                      )}
                    >
                      <span
                        className={clsx(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-transform duration-200 ease-out group-hover:scale-110",
                          isActive
                            ? "scale-105 bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300"
                            : "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500"
                        )}
                      >
                        <Icon size={15} />
                      </span>
                      {section.title}
                    </button>
                  );
                })}
              </nav>

            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="show"
              className="flex min-w-0 flex-1 flex-col gap-6 [&_input:not([type=checkbox])]:py-3 [&_input:not([type=checkbox])]:text-[15px] [&_select]:py-3 [&_select]:text-[15px] [&_textarea]:py-3 [&_textarea]:text-[15px]"
            >
              {/* 1. Enquiry & Source */}
              <motion.div ref={(el) => { sectionRefs.current[0] = el; }} variants={fadeUp}>
                <Card>
                  <CardHeader icon={<Building2 size={18} />} title={SECTIONS[0].title} iconClassName={SECTIONS[0].iconClassName} />
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
                        <label className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-1.5 text-sm text-amber-700 dark:border-amber-800/50 dark:bg-amber-900/20 dark:text-amber-400">
                          <input type="checkbox" {...register("forceNew")} className="rounded border-amber-300 text-amber-600 focus:ring-amber-500" />
                          <span className="font-medium">Force new enquiry</span>
                        </label>
                      </div>
                    )}
                  </div>
                </Card>
              </motion.div>

              {/* 2. Customer Details */}
              <motion.div ref={(el) => { sectionRefs.current[1] = el; }} variants={fadeUp}>
                <Card>
                  <CardHeader icon={<UserCircle2 size={18} />} title={SECTIONS[1].title} iconClassName={SECTIONS[1].iconClassName} />
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
                    <Input label="Email" type="email" disabled={isComplete} error={fieldError("email")} {...register("email")} />
                    <Input label="Date of birth" type="date" error={fieldError("dob")} {...register("dob")} />
                    <Input label="Profession" error={fieldError("profession")} {...register("profession")} />
                    <Input label="Pincode" error={fieldError("pincode")} {...register("pincode")} />
                    <Input label="City" required disabled={isComplete} error={fieldError("location")} {...register("location")} />
                    <div className="sm:col-span-2">
                      <Textarea label="Address" rows={2} error={fieldError("address")} {...register("address")} />
                    </div>
                  </div>
                </Card>
              </motion.div>

              {/* 3. Vehicle Interest */}
              <motion.div ref={(el) => { sectionRefs.current[2] = el; }} variants={fadeUp}>
                <Card>
                  <CardHeader icon={<Car size={18} />} title={SECTIONS[2].title} iconClassName={SECTIONS[2].iconClassName} />
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
                      {ENQUIRY_CATEGORIES.map((c) => (
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
              </motion.div>

              {/* 4. Exchange Car — optional, hidden unless the customer has one */}
              <motion.div ref={(el) => { sectionRefs.current[3] = el; }} variants={fadeUp}>
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
                            <Input label="Model name" error={fieldError("exchangeCarModel")} {...register("exchangeCarModel")} />
                            <Controller
                              control={control}
                              name="exchangeCarYear"
                              render={({ field }) => (
                                <YearPicker
                                  label="Year"
                                  value={field.value}
                                  onChange={field.onChange}
                                  onBlur={field.onBlur}
                                  error={fieldError("exchangeCarYear")}
                                />
                              )}
                            />
                            <Input label="KMs driven" type="number" min={0} error={fieldError("exchangeCarKms")} {...register("exchangeCarKms")} />
                            <Input label="No. of owners" type="number" min={0} error={fieldError("exchangeCarOwners")} {...register("exchangeCarOwners")} />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </Card>
              </motion.div>

              {/* 5. Appointment & Test Drive */}
              <motion.div ref={(el) => { sectionRefs.current[4] = el; }} variants={fadeUp}>
                <Card>
                  <CardHeader icon={<CalendarClock size={18} />} title={SECTIONS[4].title} iconClassName={SECTIONS[4].iconClassName} />
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <Switch checked={!!appointmentScheduled} onChange={(v) => setValue("appointmentScheduled", v)} label="Appointment scheduled" />
                    </div>
                    <AnimatePresence initial={false}>
                      {appointmentScheduled && (
                        <motion.div key="appointment-at" {...collapseProps}>
                          <Controller
                            control={control}
                            name="appointmentAt"
                            render={({ field }) => (
                              <DateTimePicker
                                label="Appointment date & time"
                                value={field.value}
                                onChange={field.onChange}
                                error={fieldError("appointmentAt")}
                              />
                            )}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="sm:col-span-2">
                      <Switch checked={!!testDriveInterested} onChange={(v) => setValue("testDriveInterested", v)} label="Test drive interested" />
                    </div>
                    <AnimatePresence initial={false}>
                      {testDriveInterested && (
                        <motion.div key="test-drive-count" {...collapseProps}>
                          <Input label="No. of test drives" type="number" min={0} error={fieldError("testDriveCount")} {...register("testDriveCount")} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </Card>
              </motion.div>

              {/* 6. Assignment & Follow-up */}
              <motion.div ref={(el) => { sectionRefs.current[5] = el; }} variants={fadeUp}>
                <Card>
                  <CardHeader icon={<ClipboardEdit size={18} />} title={SECTIONS[5].title} iconClassName={SECTIONS[5].iconClassName} />
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Input label="Called date" type="date" error={fieldError("calledDate")} {...register("calledDate")} />
                    <div className="sm:col-span-2">
                      <Textarea label="Remarks (others)" rows={2} error={fieldError("remarks")} {...register("remarks")} />
                    </div>
                  </div>
                </Card>
              </motion.div>
            </motion.div>
            </div>

            {resultMessage && <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">{resultMessage}</p>}
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
