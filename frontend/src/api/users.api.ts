import { axiosClient } from "./axiosClient";
import type { User, Role, TeamActivityMember } from "../types";

export interface CreateBranchStaffPayload {
  name: string;
  email: string;
  phone?: string;
  roleDefinitionId: string;
  isCr?: boolean;
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
  roleDefinitionId?: string | null;
  isCr?: boolean;
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

// ---------- Profile photo, presence & break ----------

export async function uploadAvatar(userId: string, file: File): Promise<User> {
  const form = new FormData();
  form.append("file", file);
  const { data } = await axiosClient.post<User>(`/users/${userId}/avatar`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function sendHeartbeat(): Promise<void> {
  await axiosClient.post("/users/me/heartbeat");
}

export async function setBreak(onBreak: boolean): Promise<User> {
  const { data } = await axiosClient.patch<User>("/users/me/break", { onBreak });
  return data;
}

export async function fetchTeamActivity(): Promise<TeamActivityMember[]> {
  const { data } = await axiosClient.get<TeamActivityMember[]>("/users/activity");
  return data;
}
