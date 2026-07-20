import { z } from "zod";

// Used by the Branches UI to add an employee under a branch. Role and department are
// both mandatory: every employee must belong to exactly one department of their branch,
// and carry either a custom roleDefinitionId (baseRole + module permissions) or a
// plain base role.
export const createBranchStaffSchema = z
  .object({
    name: z.string().min(1),
    email: z.string().email(),
    phone: z.string().optional(),
    role: z.enum(["CONSULTANT", "CR_TEAM", "BRANCH_MANAGER"]).optional(),
    roleDefinitionId: z.string().optional(),
    staffDepartmentId: z.string().min(1, "Department is required"),
    password: z.string().min(8, "Password must be at least 8 characters"),
  })
  .refine((val) => val.role || val.roleDefinitionId, {
    message: "Pick a role or a custom role definition",
    path: ["role"],
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
  email: z.string().email().optional(),
  phone: z.string().optional(),
  role: z.enum(["CONSULTANT", "CR_TEAM", "BRANCH_MANAGER"]).optional(),
  // Set to a role id to assign a custom role; explicit null clears it (falls back to `role`).
  roleDefinitionId: z.string().nullable().optional(),
  // Moving an employee between departments of their branch.
  staffDepartmentId: z.string().optional(),
  password: z.string().min(8).optional(),
  isActive: z.boolean().optional(),
  isAvailableForRouting: z.boolean().optional(),
});

// A CR toggling their working state — going on/off break pauses lead routing.
export const setBreakSchema = z.object({
  onBreak: z.boolean(),
});

export type CreateBranchStaffInput = z.infer<typeof createBranchStaffSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type SetBreakInput = z.infer<typeof setBreakSchema>;
