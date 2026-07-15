import { z } from "zod";

// A "follow-up" here is an active enquiry with a scheduled next-follow-up date
// (Enquiry.followUpDueAt). The page surfaces those due dates so CRs (own) and
// managers/admins (their scope) can work the queue.
export const followUpListQuerySchema = z.object({
  search: z.string().optional(),
  // Time bucket the follow-up falls into, relative to now.
  timeframe: z.enum(["overdue", "today", "week", "later", "all"]).default("all"),
  // Exact calendar day (YYYY-MM-DD) to narrow the list to. Overrides `timeframe`
  // for the paginated result; the bucket stat tiles stay full-set.
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "dueDate must be YYYY-MM-DD")
    .optional(),
  status: z.string().optional(),
  enquiryCategory: z.enum(["HOT", "WARM", "COLD"]).optional(),
  source: z.string().optional(),
  // Cross-branch / cross-CR filters — only honoured for roles that can see others'
  // follow-ups (enforced in the service; ignored for CR_TEAM / CONSULTANT).
  branchId: z.string().optional(),
  assignedCrId: z.string().optional(),
  sortBy: z.enum(["dueDate", "createdAt", "cr", "status"]).default("dueDate"),
  order: z.enum(["asc", "desc"]).default("asc"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type FollowUpListQuery = z.infer<typeof followUpListQuerySchema>;

// Calendar aggregation: per-day follow-up counts over a date range, plus a
// per-CR breakdown for roles that can see beyond their own queue.
export const followUpCalendarQuerySchema = z.object({
  start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "start must be YYYY-MM-DD"),
  end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "end must be YYYY-MM-DD"),
  branchId: z.string().optional(),
  assignedCrId: z.string().optional(),
});

export type FollowUpCalendarQuery = z.infer<typeof followUpCalendarQuerySchema>;
