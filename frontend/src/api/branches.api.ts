import { axiosClient } from "./axiosClient";
import type { Branch } from "../types";

export interface CreateBranchPayload {
  name: string;
  code: string;
  city: string;
  locationId: string;
  address?: string;
  autoAssignEnabled?: boolean;
  autoCallEnabled?: boolean;
}

export async function fetchBranches(locationId?: string): Promise<Branch[]> {
  const { data } = await axiosClient.get<Branch[]>("/branches", { params: locationId ? { locationId } : undefined });
  return data;
}

export async function createBranch(payload: CreateBranchPayload): Promise<Branch> {
  const { data } = await axiosClient.post<Branch>("/branches", payload);
  return data;
}

export async function updateBranch(branchId: string, payload: Partial<CreateBranchPayload> & { isActive?: boolean }): Promise<Branch> {
  const { data } = await axiosClient.patch<Branch>(`/branches/${branchId}`, payload);
  return data;
}

export async function toggleAutoAssign(branchId: string, autoAssignEnabled: boolean): Promise<Branch> {
  const { data } = await axiosClient.patch<Branch>(`/branches/${branchId}/auto-assign`, { autoAssignEnabled });
  return data;
}

export async function toggleAutoCall(branchId: string, autoCallEnabled: boolean): Promise<Branch> {
  const { data } = await axiosClient.patch<Branch>(`/branches/${branchId}/auto-call`, { autoCallEnabled });
  return data;
}

export async function deleteBranch(branchId: string): Promise<void> {
  await axiosClient.delete(`/branches/${branchId}`);
}
