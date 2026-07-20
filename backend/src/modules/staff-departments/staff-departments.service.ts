import { prisma } from "../../lib/prisma";
import { ConflictError, NotFoundError, ValidationError } from "../../lib/errors";
import { CreateStaffDepartmentInput, UpdateStaffDepartmentInput } from "./staff-departments.schema";

/** Departments are strictly per-branch — no global fallback (unlike RoleDefinition). */
export async function listStaffDepartments(branchId?: string) {
  return prisma.staffDepartment.findMany({
    where: branchId ? { branchId } : {},
    include: {
      branch: { select: { id: true, name: true } },
      _count: { select: { users: true } },
    },
    orderBy: [{ branchId: "asc" }, { name: "asc" }],
  });
}

export async function createStaffDepartment(input: CreateStaffDepartmentInput) {
  const branch = await prisma.branch.findUnique({ where: { id: input.branchId } });
  if (!branch) throw new NotFoundError("Branch not found");

  const existing = await prisma.staffDepartment.findFirst({
    where: { branchId: input.branchId, name: input.name },
  });
  if (existing) throw new ConflictError("A department with this name already exists for this branch");

  return prisma.staffDepartment.create({
    data: { name: input.name, branchId: input.branchId },
  });
}

export async function updateStaffDepartment(departmentId: string, input: UpdateStaffDepartmentInput) {
  const department = await prisma.staffDepartment.findUnique({ where: { id: departmentId } });
  if (!department) throw new NotFoundError("Department not found");

  // Renaming must not collide with another department in the same branch.
  if (input.name && input.name !== department.name) {
    const clash = await prisma.staffDepartment.findFirst({
      where: { branchId: department.branchId, name: input.name, id: { not: departmentId } },
    });
    if (clash) throw new ConflictError("A department with this name already exists for this branch");
  }

  return prisma.staffDepartment.update({ where: { id: departmentId }, data: input });
}

export async function deleteStaffDepartment(departmentId: string) {
  const department = await prisma.staffDepartment.findUnique({
    where: { id: departmentId },
    include: { _count: { select: { users: true } } },
  });
  if (!department) throw new NotFoundError("Department not found");
  if (department._count.users > 0) {
    throw new ValidationError(
      `${department._count.users} employee(s) still belong to this department — reassign them first, or deactivate the department instead`
    );
  }
  await prisma.staffDepartment.delete({ where: { id: departmentId } });
}
