import { z } from "zod";

export const createEnquirySchema = z.object({
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
});

export const walkInLeadSchema = createEnquirySchema.omit({ source: true });

export const leadListQuerySchema = z.object({
  search: z.string().optional(),
  status: z.string().optional(),
  source: z.string().optional(),
  branchId: z.string().optional(),
  assignedCrId: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateEnquiryInput = z.infer<typeof createEnquirySchema>;
export type WalkInLeadInput = z.infer<typeof walkInLeadSchema>;
export type LeadListQuery = z.infer<typeof leadListQuerySchema>;
