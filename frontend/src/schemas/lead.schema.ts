import { z } from "zod";
import { ENQUIRY_TYPES, LEAD_SOURCES, DEPARTMENTS, LEAD_SUBSOURCES, SOURCE_CATEGORIES, ENQUIRY_CATEGORIES } from "../types";

/** z.coerce.number() turns a blank input ("") into 0, which then fails min()/nonnegative()
 * checks meant only for real values — treat "" (and null) as genuinely unset first. */
const optionalInt = <T extends z.ZodType<number>>(schema: T) =>
  z.preprocess((v) => (v === "" || v === null || v === undefined ? undefined : v), schema.optional());

// Offline-intake enrichment fields, shared by the Add Lead wizard (creation) and the
// Complete Customer Details flow (patch on an existing enquiry) — every field here is
// optional, matching the backend's leadEnrichmentSchema.
export const leadEnrichmentFormSchema = z.object({
  alternateMobile: z.string().optional().or(z.literal("")),
  dob: z.string().optional().or(z.literal("")),
  profession: z.string().optional().or(z.literal("")),
  pincode: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  department: z.enum(DEPARTMENTS).optional().or(z.literal("")),
  sourceCategory: z.enum(SOURCE_CATEGORIES).optional().or(z.literal("")),
  subsource: z.enum(LEAD_SUBSOURCES).optional().or(z.literal("")),
  variant: z.string().optional().or(z.literal("")),
  enquiryCategory: z.enum(ENQUIRY_CATEGORIES).optional().or(z.literal("")),
  financeRequired: z.boolean().optional(),
  financeRemarks: z.string().optional().or(z.literal("")),
  appointmentScheduled: z.boolean().optional(),
  appointmentAt: z.string().optional().or(z.literal("")),
  testDriveInterested: z.boolean().optional(),
  testDriveCount: optionalInt(z.coerce.number().int().nonnegative()),
  exchangeCarModel: z.string().optional().or(z.literal("")),
  exchangeCarYear: optionalInt(z.coerce.number().int().min(1980)),
  exchangeCarKms: optionalInt(z.coerce.number().int().nonnegative()),
  exchangeCarOwners: optionalInt(z.coerce.number().int().nonnegative()),
  calledDate: z.string().optional().or(z.literal("")),
  remarks: z.string().optional().or(z.literal("")),
});

export const walkInLeadFormSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    phone: z.string().min(10, "Enter a valid phone number"),
    email: z.string().email("Enter a valid email").optional().or(z.literal("")),
    carModel: z.string().min(1, "Car model is required"),
    enquiryType: z.enum(ENQUIRY_TYPES),
    location: z.string().optional(),
    branchId: z.string().min(1, "Branch is required"),
    assignedCrId: z.string().optional(),
    forceNew: z.boolean().optional(),
  })
  .merge(leadEnrichmentFormSchema);

export type WalkInLeadFormValues = z.infer<typeof walkInLeadFormSchema>;

// Raw values before zod's coercion runs. z.coerce fields type as `unknown` on the input
// side (zod accepts any coercible value) — this is what zodResolver's Resolver type
// expects for useForm's first generic, matching the convention in schemas/enquiry.schema.ts.
export interface WalkInLeadFormInput {
  name: string;
  phone: string;
  email?: string;
  carModel: string;
  enquiryType: WalkInLeadFormValues["enquiryType"];
  location?: string;
  branchId: string;
  assignedCrId?: string;
  forceNew?: boolean;
  alternateMobile?: string;
  dob?: string;
  profession?: string;
  pincode?: string;
  address?: string;
  department?: WalkInLeadFormValues["department"];
  sourceCategory?: WalkInLeadFormValues["sourceCategory"];
  subsource?: WalkInLeadFormValues["subsource"];
  variant?: string;
  enquiryCategory?: WalkInLeadFormValues["enquiryCategory"];
  financeRequired?: boolean;
  financeRemarks?: string;
  appointmentScheduled?: boolean;
  appointmentAt?: string;
  testDriveInterested?: boolean;
  testDriveCount?: unknown;
  exchangeCarModel?: string;
  exchangeCarYear?: unknown;
  exchangeCarKms?: unknown;
  exchangeCarOwners?: unknown;
  calledDate?: string;
  remarks?: string;
}

/** Alias kept for the multi-step Add Lead wizard — same shape as the walk-in form. */
export const addLeadFormSchema = walkInLeadFormSchema;
export type AddLeadFormValues = WalkInLeadFormValues;
export type AddLeadFormInput = WalkInLeadFormInput;

/** Fully-optional variant for completing a digital lead's missing details. */
export const leadDetailsFormSchema = leadEnrichmentFormSchema;
export type LeadDetailsFormValues = z.infer<typeof leadDetailsFormSchema>;

export const manualEnquiryFormSchema = walkInLeadFormSchema.extend({
  source: z.enum(LEAD_SOURCES),
});

export type ManualEnquiryFormValues = z.infer<typeof manualEnquiryFormSchema>;
