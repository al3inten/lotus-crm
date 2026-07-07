import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as integrationsApi from "../api/integrations.api";
import type { IntegrationKey } from "../api/integrations.api";

export function useIntegrations() {
  return useQuery({
    queryKey: ["integrations"],
    queryFn: integrationsApi.fetchIntegrations,
  });
}

export function useSaveIntegration() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ key, credentials }: { key: IntegrationKey; credentials: Record<string, unknown> }) =>
      integrationsApi.saveIntegrationCredentials(key, credentials),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["integrations"] }),
  });
}

export function useDeleteIntegration() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (key: IntegrationKey) => integrationsApi.deleteIntegration(key),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["integrations"] }),
  });
}

export function useTestIntegration() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (key: IntegrationKey) => integrationsApi.testIntegrationConnection(key),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["integrations"] }),
  });
}

export function useToggleIntegration() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ key, enabled }: { key: IntegrationKey; enabled: boolean }) =>
      integrationsApi.toggleIntegration(key, enabled),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["integrations"] }),
  });
}

export function useSyncGoogleSheet() {
  return useMutation({
    mutationFn: ({ sheetUrl, sheetName, branchId }: { sheetUrl: string; sheetName?: string; branchId: string }) =>
      integrationsApi.syncGoogleSheet(sheetUrl, sheetName, branchId),
  });
}

export function useMetaAdsStatus() {
  return useQuery({
    queryKey: ["meta-ads-status"],
    queryFn: integrationsApi.fetchMetaAdsStatus,
  });
}

export function useStartMetaOAuth() {
  return useMutation({
    mutationFn: integrationsApi.startMetaOAuth,
  });
}

export function useDisconnectMetaAds() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: integrationsApi.disconnectMetaAds,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["integrations"] });
      queryClient.invalidateQueries({ queryKey: ["meta-ads-status"] });
    },
  });
}

export function useSyncMetaAdsPage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (pageId: string) => integrationsApi.syncMetaAdsPage(pageId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["meta-ads-status"] }),
  });
}

export function useSyncAllMetaAdsPages() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: integrationsApi.syncAllMetaAdsPages,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["meta-ads-status"] }),
  });
}
