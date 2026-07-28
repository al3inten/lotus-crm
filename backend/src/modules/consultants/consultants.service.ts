import { prisma } from "../../lib/prisma";
import { ConflictError, NotFoundError, ValidationError } from "../../lib/errors";
import { CreateConsultantInput, UpdateConsultantInput } from "./consultants.schema";

/** Consultants are strictly per-branch — no global fallback. */
export async function listConsultants(branchId?: string) {
  return prisma.consultantDirectory.findMany({
    where: branchId ? { branchId } : {},
    include: {
      branch: { select: { id: true, name: true } },
      _count: { select: { enquiries: true } },
    },
    orderBy: [{ branchId: "asc" }, { name: "asc" }],
  });
}

export async function createConsultant(input: CreateConsultantInput) {
  const branch = await prisma.branch.findUnique({ where: { id: input.branchId } });
  if (!branch) throw new NotFoundError("Branch not found");

  const existing = await prisma.consultantDirectory.findFirst({
    where: { branchId: input.branchId, name: input.name },
  });
  if (existing) throw new ConflictError("A consultant with this name already exists for this branch");

  return prisma.consultantDirectory.create({
    data: { name: input.name, mobile: input.mobile, branchId: input.branchId },
  });
}

export async function updateConsultant(consultantId: string, input: UpdateConsultantInput) {
  const consultant = await prisma.consultantDirectory.findUnique({ where: { id: consultantId } });
  if (!consultant) throw new NotFoundError("Consultant not found");

  if (input.name && input.name !== consultant.name) {
    const clash = await prisma.consultantDirectory.findFirst({
      where: { branchId: consultant.branchId, name: input.name, id: { not: consultantId } },
    });
    if (clash) throw new ConflictError("A consultant with this name already exists for this branch");
  }

  return prisma.consultantDirectory.update({ where: { id: consultantId }, data: input });
}

export async function deleteConsultant(consultantId: string) {
  const consultant = await prisma.consultantDirectory.findUnique({
    where: { id: consultantId },
    include: { _count: { select: { enquiries: true } } },
  });
  if (!consultant) throw new NotFoundError("Consultant not found");
  if (consultant._count.enquiries > 0) {
    throw new ValidationError(
      `${consultant._count.enquiries} enquiries still reference this consultant — deactivate instead of deleting so history stays intact.`
    );
  }
  await prisma.consultantDirectory.delete({ where: { id: consultantId } });
}
