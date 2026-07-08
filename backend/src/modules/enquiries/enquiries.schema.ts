import { z } from "zod";
import { leadEnrichmentSchema } from "../leads/leads.schema";

// Same enrichment fields as the Add Lead wizard (leads.schema.ts), reused here for the
// "Complete Customer Details" flow on an existing enquiry — a partial PATCH, so every
// field stays optional (already the case on leadEnrichmentSchema).
export const enquiryDetailsSchema = leadEnrichmentSchema;

export const changeStatusSchema = z.object({
  toStatus: z.enum([
    "NEW",
    "CONTACTED",
    "FOLLOW_UP",
    "APPOINTMENT_SCHEDULED",
    "APPOINTMENT_NO_SHOW",
    "TEST_DRIVE_DONE",
    "FEEDBACK_COLLECTED",
    "QUOTATION_SHARED",
    "NEGOTIATION",
    "BOOKING_CONFIRMED",
    "FINANCE_IN_PROGRESS",
    "EXCHANGE_IN_PROGRESS",
    "SALE_CLOSED",
    "DELIVERY_IN_PROGRESS",
    "DELIVERED",
    "LOST",
  ]),
  note: z.string().optional(),
  lossReason: z
    .enum([
      "PRICE_TOO_HIGH",
      "BOUGHT_COMPETITOR",
      "BOUGHT_ANOTHER_BRANCH",
      "NOT_INTERESTED_ANYMORE",
      "FINANCE_REJECTED",
      "NO_RESPONSE",
      "OTHER",
    ])
    .optional(),
  followUpDueAt: z.string().datetime().optional(),
  consultantId: z.string().optional(),
});

export const reassignSchema = z.object({
  toUserId: z.string().min(1),
  reason: z.string().optional(),
});

export const testDriveSchema = z.object({
  conductedById: z.string().min(1),
  scheduledAt: z.string().datetime().optional(),
  completedAt: z.string().datetime().optional(),
  rating: z.number().int().min(1).max(5).optional(),
  comments: z.string().optional(),
});

export const quotationSchema = z.object({
  quotedById: z.string().min(1),
  variant: z.string().optional(),
  onRoadPrice: z.number().positive(),
  discount: z.number().nonnegative().optional(),
  finalPrice: z.number().positive(),
  validUntil: z.string().datetime().optional(),
  pdfUrl: z.string().url().optional(),
});

export const exchangeEvaluationSchema = z.object({
  oldCarMake: z.string().min(1),
  oldCarModel: z.string().min(1),
  oldCarYear: z.number().int().min(1980),
  oldCarKms: z.number().int().nonnegative(),
  oldCarCondition: z.string().optional(),
  valuationAmount: z.number().nonnegative(),
  evaluatedById: z.string().min(1),
});

export const financeApplicationSchema = z.object({
  bankOrNbfc: z.string().min(1),
  loanAmount: z.number().positive().optional(),
  status: z.enum(["NOT_STARTED", "DOCS_PENDING", "SUBMITTED", "APPROVED", "REJECTED"]).optional(),
  docsChecklist: z.record(z.boolean()).optional(),
  rejectionReason: z.string().optional(),
});

export const deliveryDetailsSchema = z.object({
  rcTransferDone: z.boolean().optional(),
  insuranceDone: z.boolean().optional(),
  accessoriesFitted: z.boolean().optional(),
  deliveryDate: z.string().datetime().optional(),
  deliveredAt: z.string().datetime().optional(),
  notes: z.string().optional(),
});

export type EnquiryDetailsInput = z.infer<typeof enquiryDetailsSchema>;
export type ChangeStatusInput = z.infer<typeof changeStatusSchema>;
export type ReassignInput = z.infer<typeof reassignSchema>;
export type TestDriveInput = z.infer<typeof testDriveSchema>;
export type QuotationInput = z.infer<typeof quotationSchema>;
export type ExchangeEvaluationInput = z.infer<typeof exchangeEvaluationSchema>;
export type FinanceApplicationInput = z.infer<typeof financeApplicationSchema>;
export type DeliveryDetailsInput = z.infer<typeof deliveryDetailsSchema>;
