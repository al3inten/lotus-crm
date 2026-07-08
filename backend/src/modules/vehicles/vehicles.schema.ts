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
