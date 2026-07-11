import { z } from "zod";

// Offline-intake enrichment fields, shared by the Add Lead wizard (creation) and the
// Complete Customer Details flow (patch on an existing enquiry) — all optional since a
// digital lead may never collect some of these, and a walk-in draft may only have a few.
export const leadEnrichmentSchema = z.object({
  // Lead (customer profile) fields
  alternateMobile: z.string().optional(),
  dob: z.string().datetime().optional(),
  profession: z.string().optional(),
  pincode: z.string().optional(),
  address: z.string().optional(),
  // Enquiry (vehicle/visit) fields
  department: z.enum(["SALES", "SERVICE", "USED_CAR", "ACCESSORIES", "HR", "OTHER_TERRITORY", "OTHERS"]).optional(),
  sourceCategory: z.enum(["WALK_IN", "DIGITAL", "DIGITAL_WALK_IN", "REFERRAL", "FIELD_ACTIVITY", "TELE_IN"]).optional(),
  subsource: z
    .enum([
      "WALK_IN",
      "HMIL_WEBSITE",
      "HMIL_SOCIAL_MEDIA",
      "HMIL_CHATBOT",
      "SOCIAL_MEDIA",
      "HYPERLOCAL",
      "CARPORTAL",
      "CTB",
      "CRM",
      "REFERRAL",
      "INCOMING_CALL",
      "DEALER_ACTIVITY",
      "SC_OWN_SOURCE",
      "HMIL_EVENT",
      "EXCHANGE_CAMP",
    ])
    .optional(),
  variant: z.string().optional(),
  enquiryCategory: z.enum(["HOT", "WARM", "COLD"]).optional(),
  financeRequired: z.boolean().optional(),
  financeRemarks: z.string().optional(),
  appointmentScheduled: z.boolean().optional(),
  appointmentAt: z.string().datetime().optional(),
  testDriveInterested: z.boolean().optional(),
  testDriveCount: z.number().int().nonnegative().optional(),
  exchangeCarModel: z.string().optional(),
  exchangeCarYear: z.number().int().min(1980).optional(),
  exchangeCarKms: z.number().int().nonnegative().optional(),
  exchangeCarOwners: z.number().int().nonnegative().optional(),
  calledDate: z.string().datetime().optional(),
  remarks: z.string().optional(),
});

export const createEnquirySchema = z
  .object({
    name: z.string().min(1),
    phone: z.string().min(1),
    email: z.string().email().optional(),
    carModel: z.string().min(1),
    source: z.enum(["WALK_IN", "MANUAL_OTHER", "META_ADS", "WHATSAPP", "INSTAGRAM", "GOOGLE_SHEETS", "REFERRAL", "VOICE_AGENT"]),
    enquiryType: z.enum(["NEW_CAR", "USED_CAR", "SERVICE_RELATED", "ACCESSORY", "OTHER"]),
    location: z.string().optional(),
    branchId: z.string().min(1),
    // Only honored for manually-assigned sources (WALK_IN/MANUAL_OTHER/REFERRAL).
    assignedCrId: z.string().optional(),
    forceNew: z.boolean().optional(),
  })
  .merge(leadEnrichmentSchema);

export const walkInLeadSchema = createEnquirySchema.omit({ source: true });

export const leadDraftSchema = z.object({
  branchId: z.string().optional(),
  data: z.record(z.unknown()),
});

export const leadListQuerySchema = z.object({
  search: z.string().optional(),
  status: z.string().optional(),
  source: z.string().optional(),
  enquiryCategory: z.enum(["HOT", "WARM", "COLD"]).optional(),
  branchId: z.string().optional(),
  assignedCrId: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateEnquiryInput = z.infer<typeof createEnquirySchema>;
export type WalkInLeadInput = z.infer<typeof walkInLeadSchema>;
export type LeadDraftInput = z.infer<typeof leadDraftSchema>;
export type LeadListQuery = z.infer<typeof leadListQuerySchema>;
