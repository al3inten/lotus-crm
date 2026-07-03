import { z } from "zod";

export const createTemplateSchema = z.object({
  name: z.string().min(1),
  channel: z.enum(["WHATSAPP", "INSTAGRAM"]),
  category: z.string().min(1),
  bodyText: z.string().min(1),
  mediaAssetId: z.string().optional(),
  metaTemplateName: z.string().optional(),
  metaApprovalStatus: z.string().optional(),
});

export const updateTemplateSchema = createTemplateSchema.partial();

export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;
export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>;
