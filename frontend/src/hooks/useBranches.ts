import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as branchesApi from "../api/branches.api";

export const branchKeys = {
  all: ["branches"] as const,
};

export function useBranches() {
  return useQuery({
    queryKey: branchKeys.all,
    queryFn: branchesApi.fetchBranches,
  });
}

export function useCreateBranch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: branchesApi.createBranch,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: branchKeys.all }),
  });
}

export function useUpdateBranch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ branchId, payload }: { branchId: string; payload: Parameters<typeof branchesApi.updateBranch>[1] }) =>
      branchesApi.updateBranch(branchId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: branchKeys.all }),
  });
}

export function useToggleAutoAssign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ branchId, autoAssignEnabled }: { branchId: string; autoAssignEnabled: boolean }) =>
      branchesApi.toggleAutoAssign(branchId, autoAssignEnabled),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: branchKeys.all }),
  });
}
