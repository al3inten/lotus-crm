import { axiosClient } from "./axiosClient";
import type { StaffDepartment } from "../types";

export interface CreateStaffDepartmentPayload {
  name: string;
  branchId: string;
}

export async function fetchStaffDepartments(branchId?: string): Promise<StaffDepartment[]> {
  const { data } = await axiosClient.get<StaffDepartment[]>("/staff-departments", {
    params: branchId ? { branchId } : {},
  });
  return data;
}

export async function createStaffDepartment(payload: CreateStaffDepartmentPayload): Promise<StaffDepartment> {
  const { data } = await axiosClient.post<StaffDepartment>("/staff-departments", payload);
  return data;
}

export async function updateStaffDepartment(
  departmentId: string,
  payload: { name?: string; isActive?: boolean }
): Promise<StaffDepartment> {
  const { data } = await axiosClient.patch<StaffDepartment>(`/staff-departments/${departmentId}`, payload);
  return data;
}

export async function deleteStaffDepartment(departmentId: string): Promise<void> {
  await axiosClient.delete(`/staff-departments/${departmentId}`);
}
