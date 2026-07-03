import { z } from "zod";

export const createBranchSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  city: z.string().min(1),
  address: z.string().optional(),
  autoAssignEnabled: z.boolean().default(true),
});

export const updateBranchSchema = z.object({
  name: z.string().min(1).optional(),
  city: z.string().min(1).optional(),
  address: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const toggleAutoAssignSchema = z.object({
  autoAssignEnabled: z.boolean(),
});

export type CreateBranchInput = z.infer<typeof createBranchSchema>;
export type UpdateBranchInput = z.infer<typeof updateBranchSchema>;
