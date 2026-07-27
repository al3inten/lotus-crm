import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as settingsApi from "../api/settings.api";

export function useSettings() {
  return useQuery({
    queryKey: ["settings"],
    queryFn: settingsApi.getSystemSettings,
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: settingsApi.updateSystemSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
    meta: { successMessage: "Settings updated" },
  });
}
