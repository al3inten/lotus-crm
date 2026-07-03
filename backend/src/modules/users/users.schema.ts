import { z } from "zod";

// Used by the Departments UI to add Consultants/CR Team members under a branch.
export const createBranchStaffSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  role: z.enum(["CONSULTANT", "CR_TEAM"]),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

// Reserved for ADMIN/SUPER_ADMIN to create Branch Managers or other admins.
export const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  role: z.enum(["SUPER_ADMIN", "ADMIN", "BRANCH_MANAGER", "CR_TEAM", "CONSULTANT"]),
  branchId: z.string().nullable().optional(),
  password: z.string().min(8),
});

export const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().optional(),
  isActive: z.boolean().optional(),
  isAvailableForRouting: z.boolean().optional(),
});

export type CreateBranchStaffInput = z.infer<typeof createBranchStaffSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
