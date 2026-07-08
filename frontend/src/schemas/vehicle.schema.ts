import { z } from "zod";
import { TRANSMISSION_TYPES, FUEL_TYPES } from "../types";

export const vehicleModelFormSchema = z.object({
  name: z.string().min(1, "Model name is required"),
});
export type VehicleModelFormValues = z.infer<typeof vehicleModelFormSchema>;

export const vehicleVariantFormSchema = z.object({
  name: z.string().min(1, "Variant name is required"),
  transmissionType: z.enum(TRANSMISSION_TYPES),
  fuelType: z.enum(FUEL_TYPES),
});
export type VehicleVariantFormValues = z.infer<typeof vehicleVariantFormSchema>;
