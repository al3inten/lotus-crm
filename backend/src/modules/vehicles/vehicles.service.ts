import { prisma } from "../../lib/prisma";
import { ConflictError, NotFoundError } from "../../lib/errors";
import {
  CreateVehicleModelInput,
  UpdateVehicleModelInput,
  CreateVehicleVariantInput,
  UpdateVehicleVariantInput,
  UpsertVehicleModelTargetInput,
  ListVehicleModelTargetsQuery,
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

// Enquiry.carModel/variant are plain-string snapshots (see schema.prisma comment), so
// deleting a catalog entry never orphans historical records there. VehicleVariant *is* a
// real FK dependent though (RESTRICT), so its rows must go first — the confirm dialog on
// the frontend explicitly promises "removes the model and all its variants".
export async function deleteVehicleModel(modelId: string) {
  await getVehicleModel(modelId);
  await prisma.$transaction([
    prisma.vehicleVariant.deleteMany({ where: { modelId } }),
    prisma.vehicleModel.delete({ where: { id: modelId } }),
  ]);
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

/** Booking target + stock-in-hand for every active model at a branch for one month — the
 * Model-wise MIS report's only source for those two columns (see VehicleModelTarget). */
export async function listVehicleModelTargets(query: ListVehicleModelTargetsQuery) {
  const [models, targets] = await Promise.all([
    prisma.vehicleModel.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.vehicleModelTarget.findMany({ where: { branchId: query.branchId, month: query.month } }),
  ]);

  const targetByModelId = new Map(targets.map((t) => [t.modelId, t]));
  return models.map((model) => {
    const target = targetByModelId.get(model.id);
    return {
      modelId: model.id,
      modelName: model.name,
      bookingTarget: target?.bookingTarget ?? 0,
      stock: target?.stock ?? 0,
    };
  });
}

export async function upsertVehicleModelTarget(
  modelId: string,
  input: UpsertVehicleModelTargetInput,
  updatedById: string
) {
  await getVehicleModel(modelId);
  return prisma.vehicleModelTarget.upsert({
    where: { modelId_branchId_month: { modelId, branchId: input.branchId, month: input.month } },
    create: {
      modelId,
      branchId: input.branchId,
      month: input.month,
      bookingTarget: input.bookingTarget,
      stock: input.stock,
      updatedById,
    },
    update: { bookingTarget: input.bookingTarget, stock: input.stock, updatedById },
  });
}
