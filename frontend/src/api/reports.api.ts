import { axiosClient } from "./axiosClient";

export interface ReportFilters {
  branchId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface SummaryReport {
  totalEnquiries: number;
  newEnquiries: number;
  converted: number;
  followUpPending: number;
  lost: number;
  statusBreakdown: Record<string, number>;
}

export interface CrPerformanceRow {
  crId: string;
  crName: string;
  branchId: string | null;
  assigned: number;
  converted: number;
  conversionRate: number;
}

export interface BranchRollupRow {
  branchId: string;
  branchName: string;
  statusCounts: Record<string, number>;
  total: number;
}

export interface TrendPoint {
  bucket: string;
  total: number;
  converted: number;
  lost: number;
}

export async function fetchSummary(filters: ReportFilters): Promise<SummaryReport> {
  const { data } = await axiosClient.get<SummaryReport>("/reports/summary", { params: filters });
  return data;
}

export async function fetchCrPerformance(filters: ReportFilters): Promise<CrPerformanceRow[]> {
  const { data } = await axiosClient.get<CrPerformanceRow[]>("/reports/cr-performance", { params: filters });
  return data;
}

export async function fetchBranchRollup(filters: ReportFilters): Promise<BranchRollupRow[]> {
  const { data } = await axiosClient.get<BranchRollupRow[]>("/reports/branch-rollup", { params: filters });
  return data;
}

export async function fetchTrend(
  filters: ReportFilters & { granularity: "week" | "month" | "year" }
): Promise<TrendPoint[]> {
  const { data } = await axiosClient.get<TrendPoint[]>("/reports/trend", { params: filters });
  return data;
}

export interface PeriodStats {
  from: string;
  to: string;
  total: number;
  converted: number;
  lost: number;
  conversionRate: number;
}

export interface YoyReport {
  currentPeriod: PeriodStats;
  previousPeriod: PeriodStats;
  growth: {
    total: number | null;
    converted: number | null;
    lost: number | null;
    conversionRate: number | null;
  };
}

export interface FunnelStage {
  stage: string;
  reached: number;
  percentOfTotal: number;
}

export interface TimeInStageRow {
  stage: string;
  avgHours: number | null;
  completedTransitions: number;
}

export interface CallAnalysis {
  totalCalls: number;
  completed: number;
  noAnswer: number;
  failed: number;
  answerRate: number;
  avgDurationSeconds: number | null;
}

export interface SourcePerformanceRow {
  source: string;
  total: number;
  converted: number;
  conversionRate: number;
}

export interface LostReasonRow {
  reason: string;
  count: number;
  percent: number;
}

export async function fetchYoy(filters: ReportFilters): Promise<YoyReport> {
  const { data } = await axiosClient.get<YoyReport>("/reports/yoy", { params: filters });
  return data;
}

export async function fetchFunnel(filters: ReportFilters): Promise<FunnelStage[]> {
  const { data } = await axiosClient.get<FunnelStage[]>("/reports/funnel", { params: filters });
  return data;
}

export async function fetchTimeInStage(filters: ReportFilters): Promise<TimeInStageRow[]> {
  const { data } = await axiosClient.get<TimeInStageRow[]>("/reports/time-in-stage", { params: filters });
  return data;
}

export async function fetchCallAnalysis(filters: ReportFilters): Promise<CallAnalysis> {
  const { data } = await axiosClient.get<CallAnalysis>("/reports/call-analysis", { params: filters });
  return data;
}

export async function fetchSourcePerformance(filters: ReportFilters): Promise<SourcePerformanceRow[]> {
  const { data } = await axiosClient.get<SourcePerformanceRow[]>("/reports/source-performance", { params: filters });
  return data;
}

export async function fetchLostReasons(filters: ReportFilters): Promise<LostReasonRow[]> {
  const { data } = await axiosClient.get<LostReasonRow[]>("/reports/lost-reasons", { params: filters });
  return data;
}

export async function downloadEnquiriesCsv(filters: ReportFilters): Promise<Blob> {
  const { data } = await axiosClient.get("/reports/export", { params: filters, responseType: "blob" });
  return data as Blob;
}
