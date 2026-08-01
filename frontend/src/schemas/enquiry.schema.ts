import { z } from "zod";
import { ENQUIRY_STATUSES, LOSS_REASONS, CLOSE_REASONS } from "../types";

export const statusChangeFormSchema = z.object({
  toStatus: z.enum(ENQUIRY_STATUSES),
  note: z.string().optional(),
  lossReason: z.enum(LOSS_REASONS).optional().or(z.literal("")),
  // Free-text detail, required when lossReason is LOST_TO_COMPETITOR.
  lossNote: z.string().optional(),
  closeReason: z.enum(CLOSE_REASONS).optional().or(z.literal("")),
  // Free-text detail, required when closeReason is OTHER.
  closeNote: z.string().optional(),
  followUpDueAt: z.string().optional(),
  appointmentAt: z.string().optional(),
  consultantId: z.string().optional(),
  // Test Drive: scheduled date/time for the first drive.
  testDriveScheduledAt: z.string().optional(),
  // Later-stage milestone dates.
  bookedAt: z.string().optional(),
  retailDoneAt: z.string().optional(),
  rtoDoneAt: z.string().optional(),
  // Vehicle colour, captured at the RTO Done stage alongside the RTO date.
  colour: z.string().optional(),
  deliveredAt: z.string().optional(),
  // Delivered-stage customer details — used for birthday/anniversary celebrations, collected
  // via the standalone Save progress action once the enquiry is at Delivered.
  dob: z.string().optional(),
  profession: z.string().optional(),
  // Booking-phase finance.
  financeRequired: z.boolean().optional(),
  financeDocumentCollected: z.boolean().optional(),
  financeLoanApproved: z.boolean().optional(),
  financeDoReceived: z.boolean().optional(),
});

export type StatusChangeFormValues = z.infer<typeof statusChangeFormSchema>;

export const testDriveFormSchema = z.object({
  conductedById: z.string().min(1, "Select a consultant"),
  carModel: z.string().min(1, "Select the car"),
  variant: z.string().optional(),
  scheduledAt: z.string().optional(),
  completedAt: z.string().optional(),
  address: z.string().optional(),
  rating: z.preprocess(
    (val) => (val === "" || val === undefined ? undefined : val),
    z.coerce.number().int().min(1).max(5).optional()
  ),
  comments: z.string().optional(),
});
export type TestDriveFormValues = z.infer<typeof testDriveFormSchema>;
// Raw values before zod's coercion runs. z.coerce fields type as `unknown` on the input side
// (zod accepts any coercible value), which is what zodResolver's Resolver type expects here.
export interface TestDriveFormInput {
  conductedById: string;
  carModel: string;
  variant?: string;
  scheduledAt?: string;
  completedAt?: string;
  address?: string;
  rating?: unknown;
  comments?: string;
}

// Follow-up edit once the drive has happened: mark it complete and capture rating/feedback.
export const testDriveEditFormSchema = z.object({
  completedAt: z.string().optional(),
  rating: z.preprocess(
    (val) => (val === "" || val === undefined ? undefined : val),
    z.coerce.number().int().min(1).max(5).optional()
  ),
  comments: z.string().optional(),
});
export type TestDriveEditFormValues = z.infer<typeof testDriveEditFormSchema>;
export interface TestDriveEditFormInput {
  completedAt?: string;
  rating?: unknown;
  comments?: string;
}

export const quotationFormSchema = z.object({
  quotedById: z.string().min(1, "Select who quoted"),
  variant: z.string().optional(),
  onRoadPrice: z.coerce.number().positive("Must be positive").max(999999999, "Price is too large"),
  discount: z.coerce.number().nonnegative().max(999999999, "Discount is too large").optional(),
  finalPrice: z.coerce.number().positive("Must be positive").max(999999999, "Price is too large"),
  validUntil: z.string().optional(),
  pdfUrl: z.string().url("Enter a valid URL").optional().or(z.literal("")),
});
export type QuotationFormValues = z.infer<typeof quotationFormSchema>;
export interface QuotationFormInput {
  quotedById: string;
  variant?: string;
  onRoadPrice: unknown;
  discount?: unknown;
  finalPrice: unknown;
  validUntil?: string;
  pdfUrl?: string;
}

export const exchangeFormSchema = z.object({
  oldCarMake: z.string().min(1),
  oldCarModel: z.string().min(1),
  oldCarYear: z.coerce.number().int().min(1980),
  oldCarKms: z.coerce.number().int().nonnegative(),
  oldCarCondition: z.string().optional(),
  valuationAmount: z.coerce.number().nonnegative(),
  evaluatedById: z.string().min(1, "Select an evaluator"),
});
export type ExchangeFormValues = z.infer<typeof exchangeFormSchema>;
export interface ExchangeFormInput {
  oldCarMake: string;
  oldCarModel: string;
  oldCarYear: unknown;
  oldCarKms: unknown;
  oldCarCondition?: string;
  valuationAmount: unknown;
  evaluatedById: string;
}

export const financeFormSchema = z.object({
  bankOrNbfc: z.string().min(1, "Bank/NBFC is required"),
  loanAmount: z.coerce.number().positive().optional(),
  status: z.enum(["NOT_STARTED", "DOCS_PENDING", "SUBMITTED", "APPROVED", "REJECTED"]).optional(),
  rejectionReason: z.string().optional(),
});
export type FinanceFormValues = z.infer<typeof financeFormSchema>;
export interface FinanceFormInput {
  bankOrNbfc: string;
  loanAmount?: unknown;
  status?: FinanceFormValues["status"];
  rejectionReason?: string;
}

export const deliveryFormSchema = z.object({
  rcTransferDone: z.boolean().optional(),
  insuranceDone: z.boolean().optional(),
  accessoriesFitted: z.boolean().optional(),
  deliveryDate: z.string().optional(),
  deliveredAt: z.string().optional(),
  notes: z.string().optional(),
});
export type DeliveryFormValues = z.infer<typeof deliveryFormSchema>;

export const followUpFormSchema = z.object({
  followUpDate: z.string().min(1, "Date is required"),
  followUpTime: z.string().optional(),
  type: z.enum(["CALL", "WHATSAPP", "VISIT", "EMAIL"]),
  remark: z.string().min(1, "Remark is required"),
  nextFollowUpDate: z.string().min(1, "Next Follow-up Date is strictly required"),
  nextFollowUpTime: z.string().optional(),
});
export type FollowUpFormValues = z.infer<typeof followUpFormSchema>;
