import { prisma } from "../../lib/prisma";
import { ConflictError, NotFoundError } from "../../lib/errors";
import { CreateLocationInput, UpdateLocationInput } from "./branchLocations.schema";

export async function createLocation(input: CreateLocationInput) {
  return prisma.location.create({ data: input });
}

export async function listLocations() {
  return prisma.location.findMany({ orderBy: { name: "asc" } });
}

export async function getLocation(locationId: string) {
  const location = await prisma.location.findUnique({ where: { id: locationId } });
  if (!location) throw new NotFoundError("Location not found");
  return location;
}

export async function updateLocation(locationId: string, input: UpdateLocationInput) {
  await getLocation(locationId);
  return prisma.location.update({ where: { id: locationId }, data: input });
}

/** Hard delete only for a location with no branches — branches reference it. */
export async function deleteLocation(locationId: string) {
  const location = await prisma.location.findUnique({
    where: { id: locationId },
    include: { _count: { select: { branches: true } } },
  });
  if (!location) throw new NotFoundError("Location not found");

  if (location._count.branches > 0) {
    throw new ConflictError(
      `This location has ${location._count.branches} branch(es) linked. Move or delete those branches first.`
    );
  }

  await prisma.location.delete({ where: { id: locationId } });
}
