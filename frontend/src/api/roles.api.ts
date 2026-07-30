import { axiosClient } from "./axiosClient";
import type { RoleDefinition, ModulePermissions, User } from "../types";

export interface CreateRolePayload {
  name: string;
  branchId?: string | null;
  permissions: ModulePermissions;
  canViewAllBranches: boolean;
  restrictLeadsToOwn: boolean;
  canReassignCustomerCr: boolean;
}

export interface UpdateRolePayload {
  name?: string;
  permissions?: ModulePermissions;
  canViewAllBranches?: boolean;
  restrictLeadsToOwn?: boolean;
  canReassignCustomerCr?: boolean;
  isActive?: boolean;
}

export async function fetchRoles(branchId?: string): Promise<RoleDefinition[]> {
  const { data } = await axiosClient.get<RoleDefinition[]>("/roles", { params: branchId ? { branchId } : {} });
  return data;
}

export async function createRole(payload: CreateRolePayload): Promise<RoleDefinition> {
  const { data } = await axiosClient.post<RoleDefinition>("/roles", payload);
  return data;
}

export async function updateRole(roleId: string, payload: UpdateRolePayload): Promise<RoleDefinition> {
  const { data } = await axiosClient.patch<RoleDefinition>(`/roles/${roleId}`, payload);
  return data;
}

export async function deleteRole(roleId: string): Promise<void> {
  await axiosClient.delete(`/roles/${roleId}`);
}

export interface DirectoryBranch {
  id: string;
  name: string;
  code: string;
  city: string;
  users: (Pick<User, "id" | "name" | "email" | "phone" | "role"> & {
    roleDefinition?: { id: string; name: string } | null;
  })[];
}

export interface Directory {
  branches: DirectoryBranch[];
  headOffice: Pick<User, "id" | "name" | "email" | "phone" | "role">[];
}

export async function fetchDirectory(): Promise<Directory> {
  const { data } = await axiosClient.get<Directory>("/users/directory");
  return data;
}
