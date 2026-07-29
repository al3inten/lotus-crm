import { axiosClient } from "./axiosClient";

export interface ReportFilters {
  branchId?: string;
  dateFrom?: string;
  dateTo?: string;
  // Only honored by the export endpoints — narrows a download to one status/loss-reason
  // "case" (e.g. just the Retail row) rather than everything matching the page's filters.
  status?: string;
  lossReason?: string;
  source?: string;
  assignedCrId?: string;
  consultantId?: string;
  carModel?: string;
  enquiryType?: string;
  // Narrows a download/preview to leads matching this mobile number (partial match).
  phone?: string;
  sourceCategory?: string;
  referrerPhone?: string;
  referrerName?: string;
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
  followUpsPending: number;
  followUpsOverdue: number;
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

export interface ConsultantPerformanceRow {
  consultantId: string;
  consultantName: string;
  branchId: string | null;
  handled: number;
  sold: number;
  conversionRate: number;
  shareOfSales: number;
  topModel: string | null;
  models: { carModel: string; sold: number }[];
}

export async function fetchConsultantPerformance(filters: ReportFilters): Promise<ConsultantPerformanceRow[]> {
  const { data } = await axiosClient.get<ConsultantPerformanceRow[]>("/reports/consultant-performance", { params: filters });
  return data;
}

export interface VehiclePerformanceRow {
  carModel: string;
  enquiries: number;
  booked: number;
  shareOfSales: number;
  delivered: number;
  conversionRate: number;
  testDrives: number;
  testDriveCompletionRate: number;
  avgTestDriveRating: number | null;
  testDriveToBookingRate: number;
  quotations: number;
  avgDiscountPercent: number | null;
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

export interface ReferralLeadRow {
  id: string;
  leadId: string;
  name: string;
  phone: string;
  referrerName: string | null;
  referrerPhone: string | null;
  carModel: string;
  status: string;
  branch: string;
  createdAt: string;
}

export interface ReferralLeadsResult {
  total: number;
  /** Converted/lost counts over the full filtered set — not just `rows`, which is capped. */
  converted: number;
  lost: number;
  rows: ReferralLeadRow[];
}

export async function fetchReferralLeads(filters: ReportFilters): Promise<ReferralLeadsResult> {
  const { data } = await axiosClient.get<ReferralLeadsResult>("/reports/referral-leads", { params: filters });
  return data;
}

export interface TopReferrerRow {
  referrerName: string;
  referrerPhone: string | null;
  count: number;
  converted: number;
}

export interface TopReferredModelRow {
  carModel: string;
  count: number;
  converted: number;
}

export interface ReferralPerformanceResult {
  topReferrers: TopReferrerRow[];
  topModels: TopReferredModelRow[];
}

export async function fetchReferralPerformance(filters: ReportFilters): Promise<ReferralPerformanceResult> {
  const { data } = await axiosClient.get<ReferralPerformanceResult>("/reports/referral-performance", { params: filters });
  return data;
}

export async function fetchVehiclePerformance(filters: ReportFilters): Promise<VehiclePerformanceRow[]> {
  const { data } = await axiosClient.get<VehiclePerformanceRow[]>("/reports/vehicle-performance", { params: filters });
  return data;
}

// Dimensions the Chart Builder can group enquiries by — must stay in sync with
// BREAKDOWN_DIMENSIONS in the backend reports.schema.ts allow-list.
export type BreakdownDimension =
  | "source"
  | "enquiryType"
  | "status"
  | "department"
  | "subsource"
  | "sourceCategory"
  | "enquiryCategory"
  | "lossReason"
  | "carModel"
  | "variant"
  | "financeRequired"
  | "callOutcome"
  | "response"
  | "nextAction"
  | "assignedCr"
  | "branch";

export type BreakdownMeasure = "total" | "converted" | "conversionRate" | "lost";

export interface BreakdownRow {
  key: string;
  label: string;
  total: number;
  converted: number;
  lost: number;
  conversionRate: number;
}

export async function fetchBreakdown(
  filters: ReportFilters & { dimension: BreakdownDimension }
): Promise<BreakdownRow[]> {
  const { data } = await axiosClient.get<BreakdownRow[]>("/reports/breakdown", { params: filters });
  return data;
}

export interface Breakdown2DSeries {
  key: string;
  label: string;
}

export interface Breakdown2DRow {
  key: string;
  label: string;
  total: number;
  /** Count per split-series key (see `series`), keyed by `Breakdown2DSeries.key`. */
  bySplit: Record<string, number>;
}

export interface Breakdown2DResult {
  dimension: BreakdownDimension;
  splitBy: BreakdownDimension;
  series: Breakdown2DSeries[];
  rows: Breakdown2DRow[];
}

export async function fetchBreakdown2D(
  filters: ReportFilters & { dimension: BreakdownDimension; splitBy: BreakdownDimension }
): Promise<Breakdown2DResult> {
  const { data } = await axiosClient.get<Breakdown2DResult>("/reports/breakdown", { params: filters });
  return data;
}

export async function downloadEnquiriesCsv(filters: ReportFilters): Promise<Blob> {
  const { data } = await axiosClient.get("/reports/export", { params: filters, responseType: "blob" });
  return data as Blob;
}

export async function downloadEnquiriesXlsx(filters: ReportFilters): Promise<Blob> {
  const { data } = await axiosClient.get("/reports/export.xlsx", { params: filters, responseType: "blob" });
  return data as Blob;
}

export interface CustomerPreviewRow {
  createdAt: string;
  name: string;
  phone: string;
  email: string | null;
  carModel: string;
  source: string;
  enquiryType: string;
  status: string;
  lossReason: string | null;
  branch: string;
  assignedCr: string | null;
  consultant: string | null;
  location: string | null;
}

export interface CustomerPreviewResult {
  rows: CustomerPreviewRow[];
  total: number;
  page: number;
  pageSize: number;
}

export async function fetchCustomerPreview(filters: ReportFilters, page: number, pageSize = 20): Promise<CustomerPreviewResult> {
  const { data } = await axiosClient.get<CustomerPreviewResult>("/reports/customers", { params: { ...filters, page, pageSize } });
  return data;
}
