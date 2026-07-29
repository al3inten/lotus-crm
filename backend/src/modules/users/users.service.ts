import { Readable } from "stream";
import { Role } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { hashPassword } from "../auth/auth.service";
import { ConflictError, NotFoundError, ValidationError } from "../../lib/errors";
import { configureCloudinary } from "../integrations/integrations.service";
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

  // Every branch-staff user is STAFF and must carry a fully-custom RoleDefinition —
  // there's no more baseRole preset tier (SUPER_ADMIN is never created this way).
  const roleDefinition = await prisma.roleDefinition.findUnique({ where: { id: input.roleDefinitionId } });
  if (!roleDefinition || !roleDefinition.isActive) throw new NotFoundError("Role definition not found or inactive");
  if (roleDefinition.branchId && roleDefinition.branchId !== branchId) {
    throw new ConflictError("This role belongs to a different branch");
  }

  const passwordHash = await hashPassword(input.password);
  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      phone: input.phone,
      role: "STAFF",
      roleDefinitionId: roleDefinition.id,
      isCr: input.isCr ?? false,
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
      roleDefinitionId: input.roleDefinitionId,
      isCr: input.isCr ?? false,
      branchId: input.branchId ?? null,
      passwordHash,
    },
  });
  return sanitize(user);
}

export async function listBranchUsers(branchId: string, role?: Role) {
  const users = await prisma.user.findMany({
    where: { branchId, ...(role ? { role } : {}) },
    include: {
      roleDefinition: { select: { id: true, name: true, restrictLeadsToOwn: true } },
    },
    orderBy: { name: "asc" },
  });
  // A user counts as CR-eligible (shows up in "assign a CR" dropdowns) either because
  // their own isCr toggle is on, or because the role they already hold is itself a CR
  // role (restrictLeadsToOwn) — no need to separately flip isCr in that case.
  return users.map((u) => ({
    ...sanitize(u),
    isCrEligible: u.isCr || (u.roleDefinition?.restrictLeadsToOwn ?? false),
  }));
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
          isCr: true,
          roleDefinition: { select: { id: true, name: true } },
        },
        orderBy: [{ role: "asc" }, { name: "asc" }],
      },
    },
    orderBy: { name: "asc" },
  });

  // Cross-branch users (SUPER_ADMIN, or STAFF with no branch) shown separately.
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

  const { password, roleDefinitionId, ...rest } = input;
  const data: Parameters<typeof prisma.user.update>[0]["data"] = { ...rest };

  if (password) data.passwordHash = await hashPassword(password);

  if (roleDefinitionId !== undefined) {
    if (roleDefinitionId === null) {
      data.roleDefinitionId = null;
    } else {
      const roleDefinition = await prisma.roleDefinition.findUnique({ where: { id: roleDefinitionId } });
      if (!roleDefinition || !roleDefinition.isActive) throw new NotFoundError("Role definition not found or inactive");
      if (roleDefinition.branchId && user.branchId && roleDefinition.branchId !== user.branchId) {
        throw new ConflictError("This role belongs to a different branch");
      }
      data.roleDefinitionId = roleDefinitionId;
    }
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
          statusChanges: true,
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

// ---------- PROFILE PHOTO ----------

function uploadImageBuffer(cloudinary: Awaited<ReturnType<typeof configureCloudinary>>, buffer: Buffer) {
  return new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { resource_type: "image", folder: "lotus-crm/avatars" },
      (error, result) => {
        if (error || !result) return reject(error ?? new Error("Cloudinary upload failed"));
        resolve({ secure_url: result.secure_url, public_id: result.public_id });
      }
    );
    Readable.from(buffer).pipe(stream);
  });
}

/** Upload/replace a user's profile photo. Removes the previous Cloudinary asset. */
export async function updateAvatar(userId: string, fileBuffer: Buffer) {
  if (!fileBuffer?.length) throw new ValidationError("No image uploaded");
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError("User not found");

  const cloudinary = await configureCloudinary();
  const uploaded = await uploadImageBuffer(cloudinary, fileBuffer);

  if (user.avatarPublicId) {
    await cloudinary.uploader.destroy(user.avatarPublicId, { resource_type: "image" }).catch(() => {
      // Best-effort cleanup of the old photo.
    });
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { avatarUrl: uploaded.secure_url, avatarPublicId: uploaded.public_id },
  });
  return sanitize(updated);
}

// ---------- PRESENCE & BREAK ----------

/** Lightweight "I'm still here" ping — drives the online/away indicator. */
export async function recordHeartbeat(userId: string) {
  await prisma.user.update({ where: { id: userId }, data: { lastActiveAt: new Date() } });
}

/** Toggle a user's break. On break => not available for lead routing. */
export async function setBreak(userId: string, onBreak: boolean) {
  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      onBreak,
      breakStartedAt: onBreak ? new Date() : null,
      // Going on break pauses auto-assignment; coming back resumes it.
      isAvailableForRouting: !onBreak,
      lastActiveAt: new Date(),
    },
  });
  return sanitize(updated);
}

/**
 * Team activity for the dashboard monitor — floor staff the requester oversees,
 * with presence + break state. Managers see their branch; admins see everyone.
 */
export async function getTeamActivity(ctx: { role: Role; branchId?: string | null; canViewAllBranches: boolean }) {
  const isCrossBranch = ctx.role === "SUPER_ADMIN" || ctx.canViewAllBranches;
  const users = await prisma.user.findMany({
    where: {
      isActive: true,
      role: "STAFF",
      ...(isCrossBranch ? {} : { branchId: ctx.branchId ?? "__none__" }),
    },
    select: {
      id: true,
      name: true,
      role: true,
      avatarUrl: true,
      lastActiveAt: true,
      onBreak: true,
      breakStartedAt: true,
      isAvailableForRouting: true,
      branch: { select: { id: true, name: true } },
    },
    orderBy: [{ onBreak: "asc" }, { lastActiveAt: "desc" }, { name: "asc" }],
  });
  return users;
}
