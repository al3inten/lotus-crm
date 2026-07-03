import { axiosClient } from "./axiosClient";
import type { User, Role } from "../types";

export interface CreateBranchStaffPayload {
  name: string;
  email: string;
  phone?: string;
  role: "CONSULTANT" | "CR_TEAM";
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

export async function updateUser(
  userId: string,
  payload: Partial<Pick<User, "name" | "phone" | "isActive" | "isAvailableForRouting">>
): Promise<User> {
  const { data } = await axiosClient.patch<User>(`/users/${userId}`, payload);
  return data;
}
