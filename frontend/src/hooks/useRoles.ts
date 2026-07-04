import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as rolesApi from "../api/roles.api";
import type { CreateRolePayload } from "../api/roles.api";
import type { ModuleKey } from "../types";

export function useRoles(branchId?: string) {
  return useQuery({
    queryKey: ["roles", branchId ?? "all"],
    queryFn: () => rolesApi.fetchRoles(branchId),
  });
}

export function useCreateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateRolePayload) => rolesApi.createRole(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["roles"] }),
  });
}

export function useUpdateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ roleId, payload }: { roleId: string; payload: { name?: string; permissions?: ModuleKey[]; isActive?: boolean } }) =>
      rolesApi.updateRole(roleId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["roles"] }),
  });
}

export function useDeleteRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (roleId: string) => rolesApi.deleteRole(roleId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["roles"] }),
  });
}

export function useDirectory() {
  return useQuery({
    queryKey: ["directory"],
    queryFn: rolesApi.fetchDirectory,
  });
}
