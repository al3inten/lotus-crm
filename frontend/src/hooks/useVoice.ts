import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as voiceApi from "../api/voice.api";
import type { CreateCallCampaignPayload } from "../api/voice.api";

export function useCallCampaigns() {
  return useQuery({
    queryKey: ["call-campaigns"],
    queryFn: voiceApi.fetchCallCampaigns,
    refetchInterval: 10_000,
  });
}

export function useCreateCallCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCallCampaignPayload) => voiceApi.createCallCampaign(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["call-campaigns"] }),
  });
}

export function useStartCallCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (campaignId: string) => voiceApi.startCallCampaign(campaignId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["call-campaigns"] }),
  });
}

export function usePauseCallCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (campaignId: string) => voiceApi.pauseCallCampaign(campaignId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["call-campaigns"] }),
  });
}

export function useCallLogsForLead(leadId: string | undefined) {
  return useQuery({
    queryKey: ["call-logs", "lead", leadId],
    queryFn: () => voiceApi.fetchCallLogsForLead(leadId!),
    enabled: !!leadId,
  });
}
