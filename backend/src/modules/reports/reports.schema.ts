import { z } from "zod";

export const reportQuerySchema = z.object({
  branchId: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

export const trendQuerySchema = reportQuerySchema.extend({
  granularity: z.enum(["week", "month", "year"]).default("month"),
});

export type ReportQuery = z.infer<typeof reportQuerySchema>;
export type TrendQuery = z.infer<typeof trendQuerySchema>;
