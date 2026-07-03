import { z } from "zod";

export const convertConversationSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().email().optional(),
  carModel: z.string().min(1),
  enquiryType: z.enum(["NEW_CAR", "USED_CAR", "SERVICE_RELATED", "ACCESSORY", "OTHER"]),
  location: z.string().optional(),
  branchId: z.string().min(1),
});

export const listConversationsQuerySchema = z.object({
  channel: z.enum(["WHATSAPP", "INSTAGRAM"]).optional(),
  // z.coerce.boolean() would treat the literal string "false" as truthy — parse explicitly instead.
  onlyUnresolved: z
    .enum(["true", "false"])
    .default("true")
    .transform((val) => val === "true"),
});

export type ConvertConversationInput = z.infer<typeof convertConversationSchema>;
export type ListConversationsQuery = z.infer<typeof listConversationsQuerySchema>;
