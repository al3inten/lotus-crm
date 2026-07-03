import { z } from "zod";

export const uploadMediaSchema = z.object({
  label: z.string().min(1, "Label is required"),
  mediaType: z.enum(["IMAGE", "VIDEO", "DOCUMENT"]),
  carModel: z.string().optional(),
});

export const listMediaQuerySchema = z.object({
  mediaType: z.enum(["IMAGE", "VIDEO", "DOCUMENT"]).optional(),
  carModel: z.string().optional(),
});

export type UploadMediaInput = z.infer<typeof uploadMediaSchema>;
export type ListMediaQuery = z.infer<typeof listMediaQuerySchema>;
