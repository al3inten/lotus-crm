import { z } from "zod";
import { ENQUIRY_TYPES, LEAD_SOURCES, DEPARTMENTS, LEAD_SUBSOURCES, SOURCE_CATEGORIES, ENQUIRY_CATEGORIES } from "../types";

/** z.coerce.number() turns a blank input ("") into 0, which then fails min()/nonnegative()
 * checks meant only for real values — treat "" (and null) as genuinely unset first. */
const optionalInt = <T extends z.ZodType<number>>(schema: T) =>
  z.preprocess((v) => (v === "" || v === null || v === undefined ? undefined : v), schema.optional());

// Offline-intake enrichment fields, shared by the Add Lead wizard (creation) and the
// Complete Customer Details flow (patch on an existing enquiry) — every field here is
// optional, matching the backend's leadEnrichmentSchema, except sourceCategory (Lead
// Source), which the Add Lead form now requires up front.
/** Indian mobile: exactly 10 digits, no spaces or country code. */
const TEN_DIGITS = /^\d{10}$/;

/**
 * Email is mandatory, but plenty of walk-in customers simply don't have one — typing
 * "Nil" (any casing) satisfies the field. It is NOT stored: `normaliseEmail` converts it
 * to undefined so the database keeps a real address or nothing at all, and campaign/
 * export features never see a fake "Nil" address.
 */
const NIL_EMAIL = /^nil$/i;

export const isNilEmail = (value?: string) => !!value && NIL_EMAIL.test(value.trim());

/** Form value → what the API should store: a real address, or nothing. */
export const normaliseEmail = (value?: string) =>
  !value || isNilEmail(value) ? undefined : value.trim();
/** Indian PIN code: exactly 6 digits. */
const SIX_DIGITS = /^\d{6}$/;

export const leadEnrichmentFormSchema = z.object({
  alternateMobile: z
    .string()
    .regex(TEN_DIGITS, "Alternate mobile must be exactly 10 digits")
    .optional()
    .or(z.literal("")),
  dob: z.string().optional().or(z.literal("")),
  profession: z.string().optional().or(z.literal("")),
  // Area + pincode are required on intake so every customer record is locatable.
  pincode: z.string().regex(SIX_DIGITS, "Pincode must be exactly 6 digits"),
  area: z.string().min(1, "Area is required"),
  address: z.string().optional().or(z.literal("")),
  department: z.enum(DEPARTMENTS).optional().or(z.literal("")),
  sourceCategory: z.enum(SOURCE_CATEGORIES, { message: "Lead source is required" }),
  subsource: z.enum(LEAD_SUBSOURCES).optional().or(z.literal("")),
  variant: z.string().optional().or(z.literal("")),
  enquiryCategory: z.enum(ENQUIRY_CATEGORIES).optional().or(z.literal("")),
  appointmentScheduled: z.boolean().optional(),
  appointmentAt: z.string().optional().or(z.literal("")),
  testDriveInterested: z.boolean().optional(),
  testDriveCount: optionalInt(z.coerce.number().int().nonnegative()),
  exchangeCarModel: z.string().optional().or(z.literal("")),
  exchangeCarYear: optionalInt(z.coerce.number().int().min(1980)),
  exchangeCarKms: optionalInt(z.coerce.number().int().nonnegative()),
  exchangeCarOwners: optionalInt(z.coerce.number().int().nonnegative()),
  exchangeCarRegNumber: z.string().optional().or(z.literal("")),
  // Mirrors the "Do you have a vehicle for exchange?" toggle. Kept in the form (rather
  // than as local state) so validation can require the exchange fields when it's on.
  hasExchangeVehicle: z.boolean().optional(),
  calledDate: z.string().optional().or(z.literal("")),
  remarks: z.string().optional().or(z.literal("")),
});

/** Every exchange field is mandatory once the customer declares an exchange vehicle —
 * a half-filled exchange record can't be valued by the evaluation team. */
const EXCHANGE_REQUIRED: { field: keyof z.infer<typeof leadEnrichmentFormSchema>; message: string }[] = [
  { field: "exchangeCarModel", message: "Exchange car model is required" },
  { field: "exchangeCarYear", message: "Exchange car year is required" },
  { field: "exchangeCarKms", message: "KMs driven is required" },
  { field: "exchangeCarOwners", message: "No. of owners is required" },
  { field: "exchangeCarRegNumber", message: "Car register number is required" },
];

function requireExchangeFields(
  values: { hasExchangeVehicle?: boolean } & Record<string, unknown>,
  ctx: z.RefinementCtx
) {
  if (!values.hasExchangeVehicle) return;
  for (const { field, message } of EXCHANGE_REQUIRED) {
    const value = values[field];
    // 0 is a legitimate value for kms/owners, so only null/undefined/"" count as missing.
    if (value === undefined || value === null || value === "") {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: [field], message });
    }
  }
}

/** Plain object form, kept un-refined so it can still be `.extend()`ed below. */
const walkInLeadBaseSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    phone: z.string().regex(TEN_DIGITS, "Mobile number must be exactly 10 digits"),
    email: z
      .string()
      .min(1, "Email is required — type \"Nil\" if the customer doesn't have one")
      .refine(
        (v) => isNilEmail(v) || z.string().email().safeParse(v.trim()).success,
        "Enter a valid email, or \"Nil\" if the customer doesn't have one"
      ),
    carModel: z.string().min(1, "Vehicle model is required"),
    enquiryType: z.enum(ENQUIRY_TYPES),
    location: z.string().min(1, "City is required"),
    branchId: z.string().min(1, "Branch is required"),
    assignedCrId: z.string().optional(),
    forceNew: z.boolean().optional(),
  })
  .merge(leadEnrichmentFormSchema);

export const walkInLeadFormSchema = walkInLeadBaseSchema.superRefine(requireExchangeFields);

export type WalkInLeadFormValues = z.infer<typeof walkInLeadFormSchema>;

// Raw values before zod's coercion runs. z.coerce fields type as `unknown` on the input
// side (zod accepts any coercible value) — this is what zodResolver's Resolver type
// expects for useForm's first generic, matching the convention in schemas/enquiry.schema.ts.
export interface WalkInLeadFormInput {
  name: string;
  phone: string;
  email: string;
  carModel: string;
  enquiryType: WalkInLeadFormValues["enquiryType"];
  location: string;
  branchId: string;
  assignedCrId?: string;
  forceNew?: boolean;
  alternateMobile?: string;
  dob?: string;
  profession?: string;
  pincode: string;
  area: string;
  address?: string;
  department?: WalkInLeadFormValues["department"];
  sourceCategory: WalkInLeadFormValues["sourceCategory"];
  subsource?: WalkInLeadFormValues["subsource"];
  variant?: string;
  enquiryCategory?: WalkInLeadFormValues["enquiryCategory"];
  appointmentScheduled?: boolean;
  appointmentAt?: string;
  testDriveInterested?: boolean;
  testDriveCount?: unknown;
  exchangeCarModel?: string;
  exchangeCarYear?: unknown;
  exchangeCarKms?: unknown;
  exchangeCarOwners?: unknown;
  exchangeCarRegNumber?: string;
  hasExchangeVehicle?: boolean;
  calledDate?: string;
  remarks?: string;
}

/** Alias kept for the multi-step Add Lead wizard — same shape as the walk-in form. */
export const addLeadFormSchema = walkInLeadFormSchema;
export type AddLeadFormValues = WalkInLeadFormValues;
export type AddLeadFormInput = WalkInLeadFormInput;

/** Fully-optional variant for completing a digital lead's missing details. */
export const leadDetailsFormSchema = leadEnrichmentFormSchema.superRefine(requireExchangeFields);
export type LeadDetailsFormValues = z.infer<typeof leadDetailsFormSchema>;

// Extends the un-refined base (a refined schema has no `.extend`), then re-applies the
// exchange rule so manual enquiries validate identically.
export const manualEnquiryFormSchema = walkInLeadBaseSchema
  .extend({ source: z.enum(LEAD_SOURCES) })
  .superRefine(requireExchangeFields);

export type ManualEnquiryFormValues = z.infer<typeof manualEnquiryFormSchema>;
