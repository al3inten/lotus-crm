import { axiosClient } from "./axiosClient";
import type { VehicleModel, VehicleVariant, TransmissionType, FuelType } from "../types";

export interface CreateVehicleModelPayload {
  name: string;
}

export interface UpdateVehicleModelPayload {
  name?: string;
  isActive?: boolean;
}

export interface CreateVehicleVariantPayload {
  name: string;
  transmissionType: TransmissionType;
  fuelType: FuelType;
}

export interface UpdateVehicleVariantPayload {
  name?: string;
  transmissionType?: TransmissionType;
  fuelType?: FuelType;
  isActive?: boolean;
}

export async function fetchVehicleModels(): Promise<VehicleModel[]> {
  const { data } = await axiosClient.get<VehicleModel[]>("/vehicle-models");
  return data;
}

export async function createVehicleModel(payload: CreateVehicleModelPayload): Promise<VehicleModel> {
  const { data } = await axiosClient.post<VehicleModel>("/vehicle-models", payload);
  return data;
}

export async function updateVehicleModel(modelId: string, payload: UpdateVehicleModelPayload): Promise<VehicleModel> {
  const { data } = await axiosClient.patch<VehicleModel>(`/vehicle-models/${modelId}`, payload);
  return data;
}

export async function deleteVehicleModel(modelId: string): Promise<void> {
  await axiosClient.delete(`/vehicle-models/${modelId}`);
}

export async function createVehicleVariant(
  modelId: string,
  payload: CreateVehicleVariantPayload
): Promise<VehicleVariant> {
  const { data } = await axiosClient.post<VehicleVariant>(`/vehicle-models/${modelId}/variants`, payload);
  return data;
}

export async function updateVehicleVariant(
  variantId: string,
  payload: UpdateVehicleVariantPayload
): Promise<VehicleVariant> {
  const { data } = await axiosClient.patch<VehicleVariant>(`/vehicle-models/variants/${variantId}`, payload);
  return data;
}

export async function deleteVehicleVariant(variantId: string): Promise<void> {
  await axiosClient.delete(`/vehicle-models/variants/${variantId}`);
}
