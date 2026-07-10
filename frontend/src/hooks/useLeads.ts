import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import * as leadsApi from "../api/leads.api";

export const leadKeys = {
  list: (filters: leadsApi.LeadFilters) => ["leads", filters] as const,
  detail: (leadId: string) => ["leads", "detail", leadId] as const,
  lookup: (phone: string) => ["leads", "lookup", phone] as const,
  reminders: ["leads", "reminders"] as const,
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

export function useLeadLookup(phone: string) {
  // Only search when the phone number is likely complete (at least 10 digits)
  const isLikelyValid = phone.replace(/\D/g, "").length >= 10;
  
  return useQuery({
    queryKey: leadKeys.lookup(phone),
    queryFn: () => leadsApi.lookupLeadByPhone(phone),
    enabled: isLikelyValid,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false,
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

export function useDrafts() {
  return useQuery({ queryKey: ["leads", "drafts"], queryFn: leadsApi.fetchDrafts });
}

export function useSaveDraft() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ branchId, data }: { branchId?: string; data: Record<string, unknown> }) =>
      leadsApi.saveDraft(branchId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["leads", "drafts"] }),
  });
}

export function useUpdateDraft() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => leadsApi.updateDraft(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["leads", "drafts"] }),
  });
}

export function useDeleteDraft() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => leadsApi.deleteDraft(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["leads", "drafts"] }),
  });
}

export function useReminders() {
  return useQuery({
    queryKey: leadKeys.reminders,
    queryFn: leadsApi.fetchReminders,
    refetchInterval: 60000,
  });
}
