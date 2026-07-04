import { axiosClient } from "./axiosClient";
import type { RoleDefinition, ModuleKey, Role, User } from "../types";

export interface CreateRolePayload {
  name: string;
  branchId?: string | null;
  baseRole: Exclude<Role, "SUPER_ADMIN">;
  permissions: ModuleKey[];
}

export async function fetchRoles(branchId?: string): Promise<RoleDefinition[]> {
  const { data } = await axiosClient.get<RoleDefinition[]>("/roles", { params: branchId ? { branchId } : {} });
  return data;
}

export async function createRole(payload: CreateRolePayload): Promise<RoleDefinition> {
  const { data } = await axiosClient.post<RoleDefinition>("/roles", payload);
  return data;
}

export async function updateRole(
  roleId: string,
  payload: { name?: string; permissions?: ModuleKey[]; isActive?: boolean }
): Promise<RoleDefinition> {
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
