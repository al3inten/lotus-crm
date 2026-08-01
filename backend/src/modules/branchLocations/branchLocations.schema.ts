import { z } from "zod";

export const createLocationSchema = z.object({
  name: z.string().min(1),
  state: z.string().optional(),
  code: z.string().optional(),
});

export const updateLocationSchema = z.object({
  name: z.string().min(1).optional(),
  state: z.string().optional(),
  code: z.string().optional(),
  isActive: z.boolean().optional(),
});

export type CreateLocationInput = z.infer<typeof createLocationSchema>;
export type UpdateLocationInput = z.infer<typeof updateLocationSchema>;
