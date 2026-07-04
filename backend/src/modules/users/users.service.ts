import { Role } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { hashPassword } from "../auth/auth.service";
import { ConflictError, NotFoundError } from "../../lib/errors";
import { CreateBranchStaffInput, CreateUserInput, UpdateUserInput } from "./users.schema";

function sanitize<T extends { passwordHash: string }>(user: T) {
  const { passwordHash: _passwordHash, ...rest } = user;
  return rest;
}

export async function createBranchStaff(branchId: string, input: CreateBranchStaffInput) {
  const branch = await prisma.branch.findUnique({ where: { id: branchId } });
  if (!branch) throw new NotFoundError("Branch not found");

  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw new ConflictError("A user with this email already exists");

  // A custom role definition carries both the security base role and the module permissions.
  let role = input.role;
  let roleDefinitionId: string | undefined;
  if (input.roleDefinitionId) {
    const roleDefinition = await prisma.roleDefinition.findUnique({ where: { id: input.roleDefinitionId } });
    if (!roleDefinition || !roleDefinition.isActive) throw new NotFoundError("Role definition not found or inactive");
    if (roleDefinition.branchId && roleDefinition.branchId !== branchId) {
      throw new ConflictError("This role belongs to a different branch");
    }
    role = roleDefinition.baseRole as CreateBranchStaffInput["role"];
    roleDefinitionId = roleDefinition.id;
  }
  if (!role) throw new ConflictError("A role is required");

  const passwordHash = await hashPassword(input.password);
  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      phone: input.phone,
      role,
      roleDefinitionId,
      branchId,
      passwordHash,
    },
  });
  return sanitize(user);
}

export async function createUser(input: CreateUserInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw new ConflictError("A user with this email already exists");

  const passwordHash = await hashPassword(input.password);
  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      phone: input.phone,
      role: input.role,
      branchId: input.branchId ?? null,
      passwordHash,
    },
  });
  return sanitize(user);
}

export async function listBranchUsers(branchId: string, role?: Role) {
  const users = await prisma.user.findMany({
    where: { branchId, ...(role ? { role } : {}) },
    include: { roleDefinition: { select: { id: true, name: true } } },
    orderBy: { name: "asc" },
  });
  return users.map(sanitize);
}

/** Branch-wise directory: every branch with its staff grouped for the admin overview. */
export async function getDirectory() {
  const branches = await prisma.branch.findMany({
    where: { isActive: true },
    include: {
      users: {
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          roleDefinition: { select: { id: true, name: true } },
        },
        orderBy: [{ role: "asc" }, { name: "asc" }],
      },
    },
    orderBy: { name: "asc" },
  });

  // Cross-branch users (SUPER_ADMIN/ADMIN with no branch) shown separately.
  const headOffice = await prisma.user.findMany({
    where: { branchId: null, isActive: true, email: { not: "system@lotuscrm.internal" } },
    select: { id: true, name: true, email: true, phone: true, role: true },
    orderBy: { name: "asc" },
  });

  return { branches, headOffice };
}

export async function updateUser(userId: string, input: UpdateUserInput) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError("User not found");

  if (input.email && input.email !== user.email) {
    const emailTaken = await prisma.user.findUnique({ where: { email: input.email } });
    if (emailTaken) throw new ConflictError("A user with this email already exists");
  }

  const { password, roleDefinitionId, role, ...rest } = input;
  const data: Parameters<typeof prisma.user.update>[0]["data"] = { ...rest };

  if (password) data.passwordHash = await hashPassword(password);

  if (roleDefinitionId !== undefined) {
    if (roleDefinitionId === null) {
      data.roleDefinitionId = null;
      if (role) data.role = role;
    } else {
      const roleDefinition = await prisma.roleDefinition.findUnique({ where: { id: roleDefinitionId } });
      if (!roleDefinition || !roleDefinition.isActive) throw new NotFoundError("Role definition not found or inactive");
      if (roleDefinition.branchId && user.branchId && roleDefinition.branchId !== user.branchId) {
        throw new ConflictError("This role belongs to a different branch");
      }
      data.roleDefinitionId = roleDefinitionId;
      data.role = roleDefinition.baseRole;
    }
  } else if (role) {
    data.role = role;
    data.roleDefinitionId = null;
  }

  const updated = await prisma.user.update({ where: { id: userId }, data });
  return sanitize(updated);
}

/**
 * Hard delete is only safe for users who never touched a record — everything else
 * (enquiries handled, status changes made, uploads) keeps history via required FKs.
 * Referenced users must be deactivated instead so past activity stays attributed.
 */
export async function deleteUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      _count: {
        select: {
          assignedEnquiries: true,
          consultantEnquiries: true,
          statusChanges: true,
          testDriveFeedbacks: true,
          quotationsCreated: true,
          evaluationsDone: true,
          reassignmentsBy: true,
          uploadedMedia: true,
          createdTemplates: true,
          createdCallCampaigns: true,
          createdMessageCampaigns: true,
        },
      },
    },
  });
  if (!user) throw new NotFoundError("User not found");
  if (user.role === "SUPER_ADMIN") throw new ConflictError("The super admin account cannot be deleted");

  const references = Object.values(user._count).reduce((sum, n) => sum + n, 0);
  if (references > 0) {
    throw new ConflictError(
      `This member has ${references} linked record(s) (enquiries, status changes, uploads…). Deactivate them instead so history stays intact.`
    );
  }

  await prisma.user.delete({ where: { id: userId } });
}
