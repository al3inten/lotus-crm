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

export function useSyncGoogleSheet() {
  return useMutation({
    mutationFn: ({ sheetUrl, sheetName, branchId }: { sheetUrl: string; sheetName?: string; branchId: string }) =>
      integrationsApi.syncGoogleSheet(sheetUrl, sheetName, branchId),
  });
}
