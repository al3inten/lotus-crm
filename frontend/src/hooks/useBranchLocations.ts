import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as locationsApi from "../api/branchLocations.api";

export const locationKeys = {
  all: ["branch-locations"] as const,
};

export function useBranchLocations(enabled = true) {
  return useQuery({
    queryKey: locationKeys.all,
    queryFn: locationsApi.fetchLocations,
    enabled,
  });
}

export function useCreateLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: locationsApi.createLocation,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: locationKeys.all }),
    meta: { successMessage: "Location created" },
  });
}

export function useUpdateLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ locationId, payload }: { locationId: string; payload: Parameters<typeof locationsApi.updateLocation>[1] }) =>
      locationsApi.updateLocation(locationId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: locationKeys.all }),
    meta: { successMessage: "Location updated" },
  });
}

export function useDeleteLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (locationId: string) => locationsApi.deleteLocation(locationId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: locationKeys.all }),
    meta: { successMessage: "Location deleted" },
  });
}
