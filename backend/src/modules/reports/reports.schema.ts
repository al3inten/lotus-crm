import { z } from "zod";

export const reportQuerySchema = z.object({
  branchId: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  // Only honored by the export endpoints (see exportEnquiriesCsv/Xlsx) — lets a specific
  // status/loss-reason/source/CR row elsewhere on the Reports page be downloaded as its own
  // customer list without touching any of the aggregate report queries, which never send these.
  status: z.string().optional(),
  lossReason: z.string().optional(),
  source: z.string().optional(),
  assignedCrId: z.string().optional(),
  consultantId: z.string().optional(),
  carModel: z.string().optional(),
  enquiryType: z.string().optional(),
  phone: z.string().optional(),
  sourceCategory: z.string().optional(),
  // Narrows to one referrer's leads (Top Referrers row download) — phone is preferred
  // (it's the true identity key), name is the fallback for pre-referrerPhone rows.
  referrerPhone: z.string().optional(),
  referrerName: z.string().optional(),
  // Narrows an export/preview to open enquiries whose follow-up is past due (see
  // getSummary's `overdue` count) — a cross-cutting subset, not a real EnquiryStatus, so it
  // can't be expressed via `status`.
  overdue: z.enum(["true"]).optional(),
});

export const customerPreviewQuerySchema = reportQuerySchema.extend({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
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

export const breakdownQuerySchema = reportQuerySchema
  .extend({
    dimension: z.enum(BREAKDOWN_DIMENSIONS),
    // Optional second grouping dimension — when set, the Chart Builder renders a
    // stacked bar (dimension × splitBy) instead of a single-series breakdown.
    splitBy: z.enum(BREAKDOWN_DIMENSIONS).optional(),
  })
  .refine((data) => !data.splitBy || data.splitBy !== data.dimension, {
    message: "Split by must be different from Group by",
    path: ["splitBy"],
  });

export type ReportQuery = z.infer<typeof reportQuerySchema>;
export type TrendQuery = z.infer<typeof trendQuerySchema>;
export type BreakdownQuery = z.infer<typeof breakdownQuerySchema>;
export type BreakdownDimension = (typeof BREAKDOWN_DIMENSIONS)[number];
