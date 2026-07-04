import { axiosClient } from "./axiosClient";
import type { User, Role } from "../types";

export interface CreateBranchStaffPayload {
  name: string;
  email: string;
  phone?: string;
  role?: "CONSULTANT" | "CR_TEAM" | "BRANCH_MANAGER";
  roleDefinitionId?: string;
  password: string;
}

export async function fetchBranchStaff(branchId: string, role?: Role): Promise<User[]> {
  const { data } = await axiosClient.get<User[]>(`/users/branches/${branchId}/staff`, {
    params: role ? { role } : undefined,
  });
  return data;
}

export async function createBranchStaff(branchId: string, payload: CreateBranchStaffPayload): Promise<User> {
  const { data } = await axiosClient.post<User>(`/users/branches/${branchId}/staff`, payload);
  return data;
}

export interface UpdateUserPayload {
  name?: string;
  email?: string;
  phone?: string;
  role?: "CONSULTANT" | "CR_TEAM" | "BRANCH_MANAGER";
  roleDefinitionId?: string | null;
  password?: string;
  isActive?: boolean;
  isAvailableForRouting?: boolean;
}

export async function updateUser(userId: string, payload: UpdateUserPayload): Promise<User> {
  const { data } = await axiosClient.patch<User>(`/users/${userId}`, payload);
  return data;
}

export async function deleteUser(userId: string): Promise<void> {
  await axiosClient.delete(`/users/${userId}`);
}
