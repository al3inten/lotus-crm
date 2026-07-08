import { prisma } from "../../lib/prisma";
import { ConflictError, NotFoundError } from "../../lib/errors";
import {
  CreateVehicleModelInput,
  UpdateVehicleModelInput,
  CreateVehicleVariantInput,
  UpdateVehicleVariantInput,
} from "./vehicles.schema";

export async function createVehicleModel(input: CreateVehicleModelInput) {
  const existing = await prisma.vehicleModel.findUnique({ where: { name: input.name } });
  if (existing) throw new ConflictError("A model with this name already exists");
  return prisma.vehicleModel.create({ data: input });
}

export async function listVehicleModels() {
  return prisma.vehicleModel.findMany({
    include: { variants: { orderBy: { name: "asc" } } },
    orderBy: { name: "asc" },
  });
}

export async function getVehicleModel(modelId: string) {
  const model = await prisma.vehicleModel.findUnique({
    where: { id: modelId },
    include: { variants: { orderBy: { name: "asc" } } },
  });
  if (!model) throw new NotFoundError("Model not found");
  return model;
}

export async function updateVehicleModel(modelId: string, input: UpdateVehicleModelInput) {
  await getVehicleModel(modelId);
  return prisma.vehicleModel.update({ where: { id: modelId }, data: input });
}

// No FK dependents to guard against — Enquiry.carModel/variant are plain-string snapshots,
// so deleting a catalog entry never orphans historical records (see schema.prisma comment).
export async function deleteVehicleModel(modelId: string) {
  await getVehicleModel(modelId);
  await prisma.vehicleModel.delete({ where: { id: modelId } });
}

export async function createVehicleVariant(modelId: string, input: CreateVehicleVariantInput) {
  await getVehicleModel(modelId);
  const existing = await prisma.vehicleVariant.findFirst({
    where: { modelId, name: input.name, fuelType: input.fuelType },
  });
  if (existing) throw new ConflictError("This variant already exists for this model");
  return prisma.vehicleVariant.create({ data: { ...input, modelId } });
}

export async function updateVehicleVariant(variantId: string, input: UpdateVehicleVariantInput) {
  const variant = await prisma.vehicleVariant.findUnique({ where: { id: variantId } });
  if (!variant) throw new NotFoundError("Variant not found");
  return prisma.vehicleVariant.update({ where: { id: variantId }, data: input });
}

export async function deleteVehicleVariant(variantId: string) {
  const variant = await prisma.vehicleVariant.findUnique({ where: { id: variantId } });
  if (!variant) throw new NotFoundError("Variant not found");
  await prisma.vehicleVariant.delete({ where: { id: variantId } });
}
