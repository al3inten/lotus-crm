import { z } from "zod";

export const createVehicleModelSchema = z.object({
  name: z.string().min(1),
});

export const updateVehicleModelSchema = z.object({
  name: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
});

export const createVehicleVariantSchema = z.object({
  name: z.string().min(1),
  transmissionType: z.enum(["MANUAL", "AUTOMATIC"]),
  fuelType: z.enum(["PETROL", "DIESEL", "CNG_PETROL", "ELECTRIC"]),
});

export const updateVehicleVariantSchema = z.object({
  name: z.string().min(1).optional(),
  transmissionType: z.enum(["MANUAL", "AUTOMATIC"]).optional(),
  fuelType: z.enum(["PETROL", "DIESEL", "CNG_PETROL", "ELECTRIC"]).optional(),
  isActive: z.boolean().optional(),
});

export type CreateVehicleModelInput = z.infer<typeof createVehicleModelSchema>;
export type UpdateVehicleModelInput = z.infer<typeof updateVehicleModelSchema>;
export type CreateVehicleVariantInput = z.infer<typeof createVehicleVariantSchema>;
export type UpdateVehicleVariantInput = z.infer<typeof updateVehicleVariantSchema>;

const monthPattern = /^\d{4}-\d{2}$/;

export const upsertVehicleModelTargetSchema = z.object({
  branchId: z.string().min(1),
  month: z.string().regex(monthPattern, "month must be YYYY-MM"),
  bookingTarget: z.number().int().min(0),
  stock: z.number().int().min(0),
});

export const listVehicleModelTargetsQuerySchema = z.object({
  branchId: z.string().min(1),
  month: z.string().regex(monthPattern, "month must be YYYY-MM"),
});

export type UpsertVehicleModelTargetInput = z.infer<typeof upsertVehicleModelTargetSchema>;
export type ListVehicleModelTargetsQuery = z.infer<typeof listVehicleModelTargetsQuerySchema>;
