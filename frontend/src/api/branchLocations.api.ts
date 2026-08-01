import { axiosClient } from "./axiosClient";
import type { BranchLocation } from "../types";

export interface CreateLocationPayload {
  name: string;
  state?: string;
  code?: string;
}

export async function fetchLocations(): Promise<BranchLocation[]> {
  const { data } = await axiosClient.get<BranchLocation[]>("/branch-locations");
  return data;
}

export async function createLocation(payload: CreateLocationPayload): Promise<BranchLocation> {
  const { data } = await axiosClient.post<BranchLocation>("/branch-locations", payload);
  return data;
}

export async function updateLocation(
  locationId: string,
  payload: Partial<CreateLocationPayload> & { isActive?: boolean }
): Promise<BranchLocation> {
  const { data } = await axiosClient.patch<BranchLocation>(`/branch-locations/${locationId}`, payload);
  return data;
}

export async function deleteLocation(locationId: string): Promise<void> {
  await axiosClient.delete(`/branch-locations/${locationId}`);
}
