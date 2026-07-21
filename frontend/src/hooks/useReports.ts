import { useQuery } from "@tanstack/react-query";
import * as reportsApi from "../api/reports.api";

export function useSummaryReport(filters: reportsApi.ReportFilters, enabled = true) {
  return useQuery({
    queryKey: ["reports", "summary", filters],
    queryFn: () => reportsApi.fetchSummary(filters),
    enabled,
  });
}

export function useCrPerformanceReport(filters: reportsApi.ReportFilters) {
  return useQuery({
    queryKey: ["reports", "cr-performance", filters],
    queryFn: () => reportsApi.fetchCrPerformance(filters),
  });
}

export function useBranchRollupReport(filters: reportsApi.ReportFilters) {
  return useQuery({
    queryKey: ["reports", "branch-rollup", filters],
    queryFn: () => reportsApi.fetchBranchRollup(filters),
  });
}

export function useTrendReport(
  filters: reportsApi.ReportFilters & { granularity: "week" | "month" | "year" },
  enabled = true
) {
  return useQuery({
    queryKey: ["reports", "trend", filters],
    queryFn: () => reportsApi.fetchTrend(filters),
    enabled,
  });
}

export function useYoyReport(filters: reportsApi.ReportFilters, enabled = true) {
  return useQuery({
    queryKey: ["reports", "yoy", filters],
    queryFn: () => reportsApi.fetchYoy(filters),
    enabled,
  });
}

export function useFunnelReport(filters: reportsApi.ReportFilters) {
  return useQuery({
    queryKey: ["reports", "funnel", filters],
    queryFn: () => reportsApi.fetchFunnel(filters),
  });
}

export function useTimeInStageReport(filters: reportsApi.ReportFilters) {
  return useQuery({
    queryKey: ["reports", "time-in-stage", filters],
    queryFn: () => reportsApi.fetchTimeInStage(filters),
  });
}

export function useCallAnalysisReport(filters: reportsApi.ReportFilters) {
  return useQuery({
    queryKey: ["reports", "call-analysis", filters],
    queryFn: () => reportsApi.fetchCallAnalysis(filters),
  });
}

export function useSourcePerformanceReport(filters: reportsApi.ReportFilters, enabled = true) {
  return useQuery({
    queryKey: ["reports", "source-performance", filters],
    queryFn: () => reportsApi.fetchSourcePerformance(filters),
    enabled,
  });
}

export function useLostReasonsReport(filters: reportsApi.ReportFilters) {
  return useQuery({
    queryKey: ["reports", "lost-reasons", filters],
    queryFn: () => reportsApi.fetchLostReasons(filters),
  });
}

export function useVehiclePerformanceReport(filters: reportsApi.ReportFilters) {
  return useQuery({
    queryKey: ["reports", "vehicle-performance", filters],
    queryFn: () => reportsApi.fetchVehiclePerformance(filters),
  });
}

export function useBreakdownReport(
  filters: reportsApi.ReportFilters & { dimension: reportsApi.BreakdownDimension },
  enabled = true
) {
  return useQuery({
    queryKey: ["reports", "breakdown", filters],
    queryFn: () => reportsApi.fetchBreakdown(filters),
    enabled,
    placeholderData: (prev) => prev, // keep the old chart visible while a new dimension loads
  });
}

export function useBreakdown2DReport(
  filters: reportsApi.ReportFilters & { dimension: reportsApi.BreakdownDimension; splitBy: reportsApi.BreakdownDimension },
  enabled = true
) {
  return useQuery({
    queryKey: ["reports", "breakdown2d", filters],
    queryFn: () => reportsApi.fetchBreakdown2D(filters),
    enabled,
    placeholderData: (prev) => prev,
  });
}
