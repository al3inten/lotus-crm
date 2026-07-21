import { Request, Response } from "express";
import * as reportsService from "./reports.service";
import * as analyticsService from "./analytics.service";
import { ReportQuery, TrendQuery, BreakdownQuery } from "./reports.schema";

export async function summaryHandler(req: Request, res: Response) {
  const result = await reportsService.getSummary(req.query as unknown as ReportQuery, req.branchFilter);
  res.json(result);
}

export async function crPerformanceHandler(req: Request, res: Response) {
  const result = await reportsService.getCrPerformance(req.query as unknown as ReportQuery, req.branchFilter);
  res.json(result);
}

export async function branchRollupHandler(req: Request, res: Response) {
  const result = await reportsService.getBranchRollup(req.query as unknown as ReportQuery, req.branchFilter);
  res.json(result);
}

export async function trendHandler(req: Request, res: Response) {
  const result = await reportsService.getTrend(req.query as unknown as TrendQuery, req.branchFilter);
  res.json(result);
}

export async function yoyHandler(req: Request, res: Response) {
  const result = await analyticsService.getYearOverYear(req.query as unknown as ReportQuery, req.branchFilter);
  res.json(result);
}

export async function funnelHandler(req: Request, res: Response) {
  const result = await analyticsService.getFunnel(req.query as unknown as ReportQuery, req.branchFilter);
  res.json(result);
}

export async function timeInStageHandler(req: Request, res: Response) {
  const result = await analyticsService.getTimeInStage(req.query as unknown as ReportQuery, req.branchFilter);
  res.json(result);
}

export async function callAnalysisHandler(req: Request, res: Response) {
  const result = await analyticsService.getCallAnalysis(req.query as unknown as ReportQuery);
  res.json(result);
}

export async function sourcePerformanceHandler(req: Request, res: Response) {
  const result = await analyticsService.getSourcePerformance(req.query as unknown as ReportQuery, req.branchFilter);
  res.json(result);
}

export async function lostReasonsHandler(req: Request, res: Response) {
  const result = await analyticsService.getLostReasons(req.query as unknown as ReportQuery, req.branchFilter);
  res.json(result);
}

export async function vehiclePerformanceHandler(req: Request, res: Response) {
  const result = await analyticsService.getVehiclePerformance(req.query as unknown as ReportQuery, req.branchFilter);
  res.json(result);
}

export async function breakdownHandler(req: Request, res: Response) {
  const query = req.query as unknown as BreakdownQuery;
  if (query.splitBy) {
    const result = await analyticsService.getBreakdown2D(
      query as BreakdownQuery & { splitBy: NonNullable<BreakdownQuery["splitBy"]> },
      req.branchFilter
    );
    res.json(result);
    return;
  }
  const result = await analyticsService.getBreakdown(query, req.branchFilter);
  res.json(result);
}

export async function exportCsvHandler(req: Request, res: Response) {
  const csv = await analyticsService.exportEnquiriesCsv(req.query as unknown as ReportQuery, req.branchFilter);
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="lotus-crm-enquiries-${new Date().toISOString().slice(0, 10)}.csv"`);
  res.send(csv);
}
