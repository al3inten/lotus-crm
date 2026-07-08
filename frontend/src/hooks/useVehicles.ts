import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as vehiclesApi from "../api/vehicles.api";

export const vehicleKeys = {
  all: ["vehicle-models"] as const,
};

export function useVehicleModels() {
  return useQuery({
    queryKey: vehicleKeys.all,
    queryFn: vehiclesApi.fetchVehicleModels,
  });
}

export function useCreateVehicleModel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: vehiclesApi.createVehicleModel,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: vehicleKeys.all }),
  });
}

export function useUpdateVehicleModel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ modelId, payload }: { modelId: string; payload: vehiclesApi.UpdateVehicleModelPayload }) =>
      vehiclesApi.updateVehicleModel(modelId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: vehicleKeys.all }),
  });
}

export function useDeleteVehicleModel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (modelId: string) => vehiclesApi.deleteVehicleModel(modelId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: vehicleKeys.all }),
  });
}

export function useCreateVehicleVariant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ modelId, payload }: { modelId: string; payload: vehiclesApi.CreateVehicleVariantPayload }) =>
      vehiclesApi.createVehicleVariant(modelId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: vehicleKeys.all }),
  });
}

export function useUpdateVehicleVariant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ variantId, payload }: { variantId: string; payload: vehiclesApi.UpdateVehicleVariantPayload }) =>
      vehiclesApi.updateVehicleVariant(variantId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: vehicleKeys.all }),
  });
}

export function useDeleteVehicleVariant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variantId: string) => vehiclesApi.deleteVehicleVariant(variantId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: vehicleKeys.all }),
  });
}
