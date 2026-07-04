import { z } from "zod";
import { MODULE_KEYS } from "../../config/constants";

const moduleKeyEnum = z.enum(MODULE_KEYS);

export const createRoleSchema = z.object({
  name: z.string().min(1, "Role name is required"),
  branchId: z.string().nullable().optional(),
  baseRole: z.enum(["ADMIN", "BRANCH_MANAGER", "CR_TEAM", "CONSULTANT"]),
  permissions: z.array(moduleKeyEnum).min(1, "Enable at least one module"),
});

export const updateRoleSchema = z.object({
  name: z.string().min(1).optional(),
  permissions: z.array(moduleKeyEnum).min(1).optional(),
  isActive: z.boolean().optional(),
});

export const listRolesQuerySchema = z.object({
  branchId: z.string().optional(),
});

export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
export type ListRolesQuery = z.infer<typeof listRolesQuerySchema>;
