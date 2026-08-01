import { axiosClient } from "./axiosClient";

export interface VehicleModelTargetRow {
  modelId: string;
  modelName: string;
  bookingTarget: number;
  stock: number;
}

export interface UpsertVehicleModelTargetPayload {
  branchId: string;
  month: string; // "YYYY-MM"
  bookingTarget: number;
  stock: number;
}

export async function fetchVehicleModelTargets(branchId: string, month: string): Promise<VehicleModelTargetRow[]> {
  const { data } = await axiosClient.get<VehicleModelTargetRow[]>("/vehicle-models/targets", {
    params: { branchId, month },
  });
  return data;
}

export async function upsertVehicleModelTarget(
  modelId: string,
  payload: UpsertVehicleModelTargetPayload
): Promise<VehicleModelTargetRow> {
  const { data } = await axiosClient.put(`/vehicle-models/${modelId}/targets`, payload);
  return data;
}
