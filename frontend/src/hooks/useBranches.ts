import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as branchesApi from "../api/branches.api";

export const branchKeys = {
  all: ["branches"] as const,
};

export function useBranches(locationId?: string, enabled = true) {
  return useQuery({
    queryKey: [...branchKeys.all, locationId ?? null],
    queryFn: () => branchesApi.fetchBranches(locationId),
    enabled,
  });
}

export function useCreateBranch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: branchesApi.createBranch,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: branchKeys.all }),
    meta: { successMessage: "Branch created" },
  });
}

export function useUpdateBranch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ branchId, payload }: { branchId: string; payload: Parameters<typeof branchesApi.updateBranch>[1] }) =>
      branchesApi.updateBranch(branchId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: branchKeys.all }),
    meta: { successMessage: "Branch updated" },
  });
}

export function useToggleAutoAssign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ branchId, autoAssignEnabled }: { branchId: string; autoAssignEnabled: boolean }) =>
      branchesApi.toggleAutoAssign(branchId, autoAssignEnabled),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: branchKeys.all }),
    meta: { successMessage: "Auto-assign updated" },
  });
}

export function useToggleAutoCall() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ branchId, autoCallEnabled }: { branchId: string; autoCallEnabled: boolean }) =>
      branchesApi.toggleAutoCall(branchId, autoCallEnabled),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: branchKeys.all }),
    meta: { successMessage: "Auto-call updated" },
  });
}

export function useDeleteBranch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (branchId: string) => branchesApi.deleteBranch(branchId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: branchKeys.all });
      queryClient.invalidateQueries({ queryKey: ["directory"] });
    },
    meta: { successMessage: "Branch deleted" },
  });
}
