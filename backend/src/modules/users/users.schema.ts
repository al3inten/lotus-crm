import { z } from "zod";

// Used by the Branches UI to add an employee under a branch. Every branch-staff user
// is STAFF and must be given a roleDefinitionId (the fully-custom role that carries
// their section permissions) — there's no more baseRole preset tier to fall back on.
export const createBranchStaffSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  roleDefinitionId: z.string().min(1, "A role is required"),
  // Independent of role: additionally lets this user act as a CR (CR-assignment
  // dropdown + exempt from lead-ownership restriction for leads assigned to them).
  isCr: z.boolean().optional().default(false),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

// Reserved for SUPER_ADMIN to create other head-office/staff accounts.
export const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  role: z.enum(["SUPER_ADMIN", "STAFF"]),
  roleDefinitionId: z.string().optional(),
  branchId: z.string().nullable().optional(),
  isCr: z.boolean().optional().default(false),
  password: z.string().min(8),
});

export const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  // Set to a role id to assign a custom role; explicit null clears it (falls back to
  // an all-"none" permission set until a role is assigned again).
  roleDefinitionId: z.string().nullable().optional(),
  isCr: z.boolean().optional(),
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
