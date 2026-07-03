import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import * as leadsApi from "../api/leads.api";

export const leadKeys = {
  list: (filters: leadsApi.LeadFilters) => ["leads", filters] as const,
  detail: (leadId: string) => ["leads", "detail", leadId] as const,
};

export function useLeads(filters: leadsApi.LeadFilters) {
  return useQuery({
    queryKey: leadKeys.list(filters),
    queryFn: () => leadsApi.fetchLeads(filters),
    placeholderData: keepPreviousData,
  });
}

export function useLeadHistory(leadId: string | undefined) {
  return useQuery({
    queryKey: leadKeys.detail(leadId ?? ""),
    queryFn: () => leadsApi.fetchLeadHistory(leadId!),
    enabled: !!leadId,
  });
}

export function useCreateWalkInLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: leadsApi.createWalkInLead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["leads"] }),
  });
}

export function useImportLeads() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ file, branchId }: { file: File; branchId: string }) => leadsApi.importLeadsFile(file, branchId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["leads"] }),
  });
}
