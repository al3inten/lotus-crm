import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as vehicleTargetsApi from "../api/vehicleTargets.api";

export function useVehicleModelTargets(branchId: string, month: string) {
  return useQuery({
    queryKey: ["vehicle-model-targets", branchId, month],
    queryFn: () => vehicleTargetsApi.fetchVehicleModelTargets(branchId, month),
    enabled: !!branchId && !!month,
  });
}

export function useUpsertVehicleModelTarget(branchId: string, month: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ modelId, bookingTarget, stock }: { modelId: string; bookingTarget: number; stock: number }) =>
      vehicleTargetsApi.upsertVehicleModelTarget(modelId, { branchId, month, bookingTarget, stock }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["vehicle-model-targets", branchId, month] }),
    meta: { successMessage: "Target saved" },
  });
}
