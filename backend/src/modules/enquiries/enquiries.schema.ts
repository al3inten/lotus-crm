import { z } from "zod";
import { leadEnrichmentSchema } from "../leads/leads.schema";

// Same enrichment fields as the Add Lead wizard (leads.schema.ts), reused here for the
// "Complete Customer Details" flow on an existing enquiry — a partial PATCH, so every
// field stays optional (already the case on leadEnrichmentSchema). `consultantId` is
// additionally accepted so the showroom consultant can be reassigned from the detail page.
export const enquiryDetailsSchema = leadEnrichmentSchema.extend({
  name: z.string().optional(),
  location: z.string().optional(),
  consultantId: z.string().optional(),
});

export const changeStatusSchema = z.object({
  toStatus: z.enum([
    "NEW",
    "UNDER_FOLLOW_UP",
    "APPOINTMENT_FIXED",
    "TEST_DRIVE",
    "BOOKED",
    "RETAIL_DONE",
    "RTO_DONE",
    "DELIVERED",
    "CLOSED",
  ]),
  note: z.string().optional(),
  lossReason: z.enum([
    "LOST_TO_DEALER",
    "BOOKING_CANCEL",
    "RETAIL_CANCEL",
    "OUT_OF_TERRITORY",
    "NOT_CONTACTABLE",
    "PRICE_ISSUE",
    "PURCHASED_ANOTHER_BRAND",
    "OTHER_REASON",
  ]).optional(),
  followUpDueAt: z.string().datetime().optional(),
  // Appointment Fixed: date + allocated consultant.
  appointmentAt: z.string().datetime().optional(),
  consultantId: z.string().optional(),
  // Test Drive: scheduled date/time for the first drive (consultant reuses consultantId above).
  testDriveScheduledAt: z.string().datetime().optional(),
  // Milestone dates for the later stages (default to now if omitted).
  bookedAt: z.string().datetime().optional(),
  retailDoneAt: z.string().datetime().optional(),
  rtoDoneAt: z.string().datetime().optional(),
  deliveredAt: z.string().datetime().optional(),
  // Booking-phase finance: toggle + the three Yes/No checks.
  financeRequired: z.boolean().optional(),
  financeDocumentCollected: z.boolean().optional(),
  financeLoanApproved: z.boolean().optional(),
  financeDoReceived: z.boolean().optional(),
});

// Booking-stage details, captured once the enquiry is at BOOKED (not during the transition):
// the booking date plus the finance toggle and its three Yes/No checks.
export const bookingDetailsSchema = z.object({
  bookedAt: z.string().datetime().optional(),
  financeRequired: z.boolean().optional(),
  financeDocumentCollected: z.boolean().optional(),
  financeLoanApproved: z.boolean().optional(),
  financeDoReceived: z.boolean().optional(),
});

// Retail-stage details, captured once the enquiry has reached RETAIL_DONE (not during the
// Booked -> Retail Done transition itself).
export const retailDetailsSchema = z.object({
  retailDoneAt: z.string().datetime().optional(),
});

// RTO-stage details, captured once the enquiry has reached RTO_DONE (not during the
// Retail Done -> RTO Done transition itself).
export const rtoDetailsSchema = z.object({
  rtoDoneAt: z.string().datetime().optional(),
});

// Correcting the delivery date once the enquiry has reached DELIVERED (the vehicle delivery
// date is still mandatory to REACH Delivered — this is only for fixing it afterward). Distinct
// from deliveryDetailsSchema below, which is a separate, richer post-delivery checklist.
export const deliveryDateSchema = z.object({
  deliveredAt: z.string().datetime().optional(),
});

export const reassignSchema = z.object({
  toUserId: z.string().min(1),
  reason: z.string().optional(),
});

export const testDriveSchema = z.object({
  conductedById: z.string().min(1),
  // The car driven — defaults to the enquiry's car, but the customer may try a different
  // model/variant, which the CR records here.
  carModel: z.string().optional(),
  variant: z.string().optional(),
  scheduledAt: z.string().datetime().optional(),
  completedAt: z.string().datetime().optional(),
  address: z.string().optional(),
  rating: z.number().int().min(1).max(5).optional(),
  comments: z.string().optional(),
});

// Marking a scheduled test drive as done / editing its feedback (or just its address).
export const updateTestDriveSchema = z.object({
  completedAt: z.string().datetime().optional(),
  address: z.string().optional(),
  rating: z.number().int().min(1).max(5).optional(),
  comments: z.string().optional(),
});

export const quotationSchema = z.object({
  quotedById: z.string().min(1),
  variant: z.string().optional(),
  onRoadPrice: z.number().positive().max(999999999),
  discount: z.number().nonnegative().max(999999999).optional(),
  finalPrice: z.number().positive().max(999999999),
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

// A milestone date correction. The reason is mandatory: the whole point of the audit row
// is being able to explain later why a booking or retail date moved.
export const updateKeyDateSchema = z.object({
  field: z.enum(["APPOINTMENT_AT", "TEST_DRIVE_SCHEDULED_AT", "BOOKED_AT", "RETAIL_DONE_AT"]),
  date: z.string().datetime(),
  reason: z.string().trim().min(1, "A reason is required for this change"),
});

export const createFollowUpSchema = z.object({
  followUpDate: z.string().datetime(),
  followUpTime: z.string().optional(),
  type: z.enum(["CALL", "WHATSAPP", "VISIT", "EMAIL"]),
  remark: z.string().min(1),
  nextFollowUpDate: z.string().datetime().optional(),
  nextFollowUpTime: z.string().optional(),
});

// Private note — body only; the author and enquiry come from the request context.
export const createNoteSchema = z.object({
  body: z.string().trim().min(1, "Note cannot be empty"),
});

export const createCommentSchema = z.object({
  body: z.string().min(1),
  mentionedUserIds: z.array(z.string()).optional(),
});

export type EnquiryDetailsInput = z.infer<typeof enquiryDetailsSchema>;
export type ChangeStatusInput = z.infer<typeof changeStatusSchema>;
export type BookingDetailsInput = z.infer<typeof bookingDetailsSchema>;
export type RetailDetailsInput = z.infer<typeof retailDetailsSchema>;
export type RtoDetailsInput = z.infer<typeof rtoDetailsSchema>;
export type DeliveryDateInput = z.infer<typeof deliveryDateSchema>;
export type ReassignInput = z.infer<typeof reassignSchema>;
export type TestDriveInput = z.infer<typeof testDriveSchema>;
export type UpdateTestDriveInput = z.infer<typeof updateTestDriveSchema>;
export type QuotationInput = z.infer<typeof quotationSchema>;
export type ExchangeEvaluationInput = z.infer<typeof exchangeEvaluationSchema>;
export type FinanceApplicationInput = z.infer<typeof financeApplicationSchema>;
export type DeliveryDetailsInput = z.infer<typeof deliveryDetailsSchema>;
export type UpdateKeyDateInput = z.infer<typeof updateKeyDateSchema>;
export type CreateFollowUpInput = z.infer<typeof createFollowUpSchema>;
export type CreateNoteInput = z.infer<typeof createNoteSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
