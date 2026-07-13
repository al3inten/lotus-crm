import { z } from "zod";

export const reportQuerySchema = z.object({
  branchId: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

export const trendQuerySchema = reportQuerySchema.extend({
  granularity: z.enum(["week", "month", "year"]).default("month"),
});

// Fields the Chart Builder is allowed to group enquiries by. Kept as an explicit
// allow-list (never a raw column name from the client) so the dynamic groupBy can
// only ever touch these safe, indexed/enum dimensions.
export const BREAKDOWN_DIMENSIONS = [
  "source",
  "enquiryType",
  "status",
  "department",
  "subsource",
  "sourceCategory",
  "enquiryCategory",
  "lossReason",
  "carModel",
  "variant",
  "financeRequired",
  "callOutcome",
  "response",
  "nextAction",
  "assignedCr",
  "branch",
] as const;

export const breakdownQuerySchema = reportQuerySchema.extend({
  dimension: z.enum(BREAKDOWN_DIMENSIONS),
});

export type ReportQuery = z.infer<typeof reportQuerySchema>;
export type TrendQuery = z.infer<typeof trendQuerySchema>;
export type BreakdownQuery = z.infer<typeof breakdownQuerySchema>;
export type BreakdownDimension = (typeof BREAKDOWN_DIMENSIONS)[number];
