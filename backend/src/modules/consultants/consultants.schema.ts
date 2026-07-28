import { z } from "zod";

export const createConsultantSchema = z.object({
  name: z.string().min(1, "Name is required"),
  mobile: z.string().min(1, "Mobile number is required"),
  branchId: z.string().min(1, "Branch is required"),
});

export const updateConsultantSchema = z.object({
  name: z.string().min(1).optional(),
  mobile: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
});

export const listConsultantsQuerySchema = z.object({
  branchId: z.string().optional(),
});

export type CreateConsultantInput = z.infer<typeof createConsultantSchema>;
export type UpdateConsultantInput = z.infer<typeof updateConsultantSchema>;
export type ListConsultantsQuery = z.infer<typeof listConsultantsQuerySchema>;
