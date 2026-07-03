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

  const passwordHash = await hashPassword(input.password);
  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      phone: input.phone,
      role: input.role,
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
    orderBy: { name: "asc" },
  });
  return users.map(sanitize);
}

export async function updateUser(userId: string, input: UpdateUserInput) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError("User not found");

  const updated = await prisma.user.update({ where: { id: userId }, data: input });
  return sanitize(updated);
}
