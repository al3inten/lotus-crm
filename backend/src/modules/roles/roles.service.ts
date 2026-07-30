import { prisma } from "../../lib/prisma";
import { ConflictError, NotFoundError, ValidationError } from "../../lib/errors";
import { CreateRoleInput, UpdateRoleInput } from "./roles.schema";

/** Roles visible to a branch = its own roles + global (branchId null) roles. */
export async function listRoles(branchId?: string) {
  return prisma.roleDefinition.findMany({
    where: branchId ? { OR: [{ branchId }, { branchId: null }] } : {},
    include: {
      branch: { select: { id: true, name: true } },
      _count: { select: { users: true } },
    },
    orderBy: [{ branchId: "asc" }, { name: "asc" }],
  });
}

export async function createRole(input: CreateRoleInput) {
  if (input.branchId) {
    const branch = await prisma.branch.findUnique({ where: { id: input.branchId } });
    if (!branch) throw new NotFoundError("Branch not found");
  }

  const existing = await prisma.roleDefinition.findFirst({
    where: { branchId: input.branchId ?? null, name: input.name },
  });
  if (existing) throw new ConflictError("A role with this name already exists for this branch");

  return prisma.roleDefinition.create({
    data: {
      name: input.name,
      branchId: input.branchId ?? null,
      permissions: input.permissions,
      canViewAllBranches: input.canViewAllBranches,
      restrictLeadsToOwn: input.restrictLeadsToOwn,
      canReassignCustomerCr: input.canReassignCustomerCr,
      canViewBranchLeads: input.canViewBranchLeads,
    },
  });
}

export async function updateRole(roleId: string, input: UpdateRoleInput) {
  const role = await prisma.roleDefinition.findUnique({ where: { id: roleId } });
  if (!role) throw new NotFoundError("Role not found");
  if (role.isSystemDefault && input.name !== undefined && input.name !== role.name) {
    throw new ValidationError("The built-in CR role's name can't be changed");
  }
  return prisma.roleDefinition.update({ where: { id: roleId }, data: input });
}

export async function deleteRole(roleId: string) {
  const role = await prisma.roleDefinition.findUnique({
    where: { id: roleId },
    include: { _count: { select: { users: true } } },
  });
  if (!role) throw new NotFoundError("Role not found");
  if (role.isSystemDefault) {
    throw new ValidationError("The built-in CR role can't be deleted");
  }
  if (role._count.users > 0) {
    throw new ValidationError(
      `${role._count.users} staff member(s) still hold this role — reassign them first, or deactivate the role instead`
    );
  }
  await prisma.roleDefinition.delete({ where: { id: roleId } });
}
