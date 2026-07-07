import { prisma } from "../../lib/prisma";
import { ConflictError, NotFoundError } from "../../lib/errors";
import { CreateBranchInput, UpdateBranchInput } from "./branches.schema";

export async function createBranch(input: CreateBranchInput) {
  const existing = await prisma.branch.findUnique({ where: { code: input.code } });
  if (existing) throw new ConflictError("A branch with this code already exists");
  return prisma.branch.create({ data: input });
}

export async function listBranches(branchFilter?: { branchId: string }) {
  return prisma.branch.findMany({
    where: branchFilter ? { id: branchFilter.branchId } : {},
    orderBy: { name: "asc" },
  });
}

export async function getBranch(branchId: string) {
  const branch = await prisma.branch.findUnique({ where: { id: branchId } });
  if (!branch) throw new NotFoundError("Branch not found");
  return branch;
}

export async function updateBranch(branchId: string, input: UpdateBranchInput) {
  await getBranch(branchId);
  return prisma.branch.update({ where: { id: branchId }, data: input });
}

export async function setAutoAssign(branchId: string, autoAssignEnabled: boolean) {
  await getBranch(branchId);
  return prisma.branch.update({ where: { id: branchId }, data: { autoAssignEnabled } });
}

export async function setAutoCall(branchId: string, autoCallEnabled: boolean) {
  await getBranch(branchId);
  return prisma.branch.update({ where: { id: branchId }, data: { autoCallEnabled } });
}

/**
 * Hard delete only for a branch with no history — staff, enquiries, and roles all
 * reference it. A branch with records must be deactivated instead.
 */
export async function deleteBranch(branchId: string) {
  const branch = await prisma.branch.findUnique({
    where: { id: branchId },
    include: { _count: { select: { users: true, enquiries: true, roleDefinitions: true } } },
  });
  if (!branch) throw new NotFoundError("Branch not found");

  const { users, enquiries, roleDefinitions } = branch._count;
  if (users > 0 || enquiries > 0 || roleDefinitions > 0) {
    throw new ConflictError(
      `This branch has ${users} staff, ${enquiries} enquiries and ${roleDefinitions} role(s) linked. Deactivate it instead so history stays intact.`
    );
  }

  await prisma.branch.delete({ where: { id: branchId } });
}
