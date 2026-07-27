import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "../api/staffDepartments.api";
import type { CreateStaffDepartmentPayload } from "../api/staffDepartments.api";

/** Departments are per-branch, so the branch id is part of the cache key. */
export function useStaffDepartments(branchId?: string, enabled = true) {
  return useQuery({
    queryKey: ["staff-departments", branchId ?? "all"],
    queryFn: () => api.fetchStaffDepartments(branchId),
    enabled,
  });
}

export function useCreateStaffDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateStaffDepartmentPayload) => api.createStaffDepartment(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["staff-departments"] }),
    meta: { successMessage: "Department created" },
  });
}

export function useUpdateStaffDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ departmentId, payload }: { departmentId: string; payload: { name?: string; isActive?: boolean } }) =>
      api.updateStaffDepartment(departmentId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["staff-departments"] }),
    meta: { successMessage: "Department updated" },
  });
}

export function useDeleteStaffDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (departmentId: string) => api.deleteStaffDepartment(departmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-departments"] });
      queryClient.invalidateQueries({ queryKey: ["directory"] });
    },
    meta: { successMessage: "Department deleted" },
  });
}
