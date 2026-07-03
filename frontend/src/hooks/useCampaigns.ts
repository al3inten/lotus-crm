import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as campaignsApi from "../api/campaigns.api";
import type { CreateMessageCampaignPayload, SegmentFilters } from "../api/campaigns.api";

export function useMessageCampaigns() {
  return useQuery({
    queryKey: ["message-campaigns"],
    queryFn: campaignsApi.fetchMessageCampaigns,
    refetchInterval: 10_000,
  });
}

export function useCreateMessageCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateMessageCampaignPayload) => campaignsApi.createMessageCampaign(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["message-campaigns"] }),
  });
}

export function useSegmentPreview(filters: SegmentFilters, enabled: boolean) {
  return useQuery({
    queryKey: ["segment-preview", filters],
    queryFn: () => campaignsApi.previewSegment(filters),
    enabled,
  });
}

export function useRunMessageCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (campaignId: string) => campaignsApi.runMessageCampaign(campaignId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["message-campaigns"] }),
  });
}
