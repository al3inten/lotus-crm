import { z } from "zod";

export const segmentFiltersSchema = z.object({
  status: z.string().optional(),
  source: z.string().optional(),
  branchId: z.string().optional(),
  assignedCrId: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

export const createMessageCampaignSchema = z.object({
  name: z.string().min(1),
  templateId: z.string().min(1),
  segmentFilters: segmentFiltersSchema,
});

export type SegmentFilters = z.infer<typeof segmentFiltersSchema>;
export type CreateMessageCampaignInput = z.infer<typeof createMessageCampaignSchema>;
