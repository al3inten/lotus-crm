import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as consultantsApi from "../api/consultants.api";

export const consultantKeys = {
  all: (branchId?: string) => ["consultants", branchId ?? "all"] as const,
};

export function useConsultants(branchId?: string, enabled = true) {
  return useQuery({
    queryKey: consultantKeys.all(branchId),
    queryFn: () => consultantsApi.fetchConsultants(branchId),
    enabled,
  });
}

export function useCreateConsultant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: consultantsApi.createConsultant,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["consultants"] }),
    meta: { successMessage: "Consultant added" },
  });
}

export function useUpdateConsultant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: consultantsApi.UpdateConsultantPayload }) =>
      consultantsApi.updateConsultant(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["consultants"] }),
    meta: { successMessage: "Consultant updated" },
  });
}

export function useDeleteConsultant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: consultantsApi.deleteConsultant,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["consultants"] }),
    meta: { successMessage: "Consultant removed" },
  });
}
