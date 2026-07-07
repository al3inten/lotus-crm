import { z } from "zod";

export const createCallCampaignSchema = z.object({
  name: z.string().min(1),
  branchId: z.string().optional(),
  enquiryIds: z.array(z.string().min(1)).min(1, "Select at least one enquiry to call"),
  callmaticCampaignId: z.string().optional(),
});

export type CreateCallCampaignInput = z.infer<typeof createCallCampaignSchema>;
