import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as usersApi from "../api/users.api";
import type { Role } from "../types";

export const userKeys = {
  branchStaff: (branchId: string, role?: Role) => ["branch-staff", branchId, role] as const,
};

export function useBranchStaff(branchId: string | undefined, role?: Role) {
  return useQuery({
    queryKey: userKeys.branchStaff(branchId ?? "", role),
    queryFn: () => usersApi.fetchBranchStaff(branchId!, role),
    enabled: !!branchId,
  });
}

export function useCreateBranchStaff(branchId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: usersApi.CreateBranchStaffPayload) => usersApi.createBranchStaff(branchId!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branch-staff", branchId] });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, payload }: { userId: string; payload: usersApi.UpdateUserPayload }) =>
      usersApi.updateUser(userId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branch-staff"] });
      queryClient.invalidateQueries({ queryKey: ["directory"] });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => usersApi.deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branch-staff"] });
      queryClient.invalidateQueries({ queryKey: ["directory"] });
    },
  });
}
