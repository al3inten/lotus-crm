import { z } from "zod";

export const createStaffDepartmentSchema = z.object({
  name: z.string().min(1, "Department name is required"),
  branchId: z.string().min(1, "Branch is required"),
});

export const updateStaffDepartmentSchema = z.object({
  name: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
});

export const listStaffDepartmentsQuerySchema = z.object({
  branchId: z.string().optional(),
});

export type CreateStaffDepartmentInput = z.infer<typeof createStaffDepartmentSchema>;
export type UpdateStaffDepartmentInput = z.infer<typeof updateStaffDepartmentSchema>;
export type ListStaffDepartmentsQuery = z.infer<typeof listStaffDepartmentsQuerySchema>;
