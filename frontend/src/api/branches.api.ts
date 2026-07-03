import { axiosClient } from "./axiosClient";
import type { Branch } from "../types";

export interface CreateBranchPayload {
  name: string;
  code: string;
  city: string;
  address?: string;
  autoAssignEnabled?: boolean;
}

export async function fetchBranches(): Promise<Branch[]> {
  const { data } = await axiosClient.get<Branch[]>("/branches");
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
