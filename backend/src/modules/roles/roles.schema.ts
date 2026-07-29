import { z } from "zod";
import { MODULE_KEYS } from "../../config/constants";

const moduleKeyEnum = z.enum(MODULE_KEYS);
const permissionLevelEnum = z.enum(["none", "read", "write"]);
const permissionsMapSchema = z.record(moduleKeyEnum, permissionLevelEnum);

export const createRoleSchema = z.object({
  name: z.string().min(1, "Role name is required"),
  branchId: z.string().nullable().optional(),
  permissions: permissionsMapSchema,
  canViewAllBranches: z.boolean().optional().default(false),
  restrictLeadsToOwn: z.boolean().optional().default(false),
  canViewBranchLeads: z.boolean().optional().default(false),
});

export const updateRoleSchema = z.object({
  name: z.string().min(1).optional(),
  permissions: permissionsMapSchema.optional(),
  canViewAllBranches: z.boolean().optional(),
  restrictLeadsToOwn: z.boolean().optional(),
  canViewBranchLeads: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export const listRolesQuerySchema = z.object({
  branchId: z.string().optional(),
});

export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
export type ListRolesQuery = z.infer<typeof listRolesQuerySchema>;
