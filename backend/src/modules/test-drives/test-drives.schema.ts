import { z } from "zod";

// A test drive is a TestDriveFeedback row (the actual conducted/scheduled drive),
// joined up to its enquiry for branch/CR/consultant scoping. Status is derived, not
// stored: completedAt set -> COMPLETED; not set and scheduledAt in the past -> OVERDUE;
// not set and scheduledAt in the future (or unscheduled) -> UPCOMING.
export const testDriveListQuerySchema = z.object({
  // Matches lead name/phone, assigned CR name, and consultant name.
  search: z.string().optional(),
  status: z.enum(["OVERDUE", "UPCOMING", "COMPLETED", "ALL"]).default("ALL"),
  // Calendar range (YYYY-MM-DD, inclusive) to narrow the list to a scheduled window.
  // A single day is just dateFrom === dateTo. Either end may be given alone (open-ended).
  // Overrides `status` for the paginated result; the bucket stat tiles stay full-set.
  dateFrom: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "dateFrom must be YYYY-MM-DD")
    .optional(),
  dateTo: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "dateTo must be YYYY-MM-DD")
    .optional(),
  // Cross-branch / cross-CR / cross-consultant filters — only honoured for roles that
  // can see others' test drives (enforced in the service; ignored for CR_TEAM/CONSULTANT).
  branchId: z.string().optional(),
  assignedCrId: z.string().optional(),
  consultantId: z.string().optional(),
  sortBy: z.enum(["scheduledAt", "createdAt", "cr", "consultant"]).default("scheduledAt"),
  order: z.enum(["asc", "desc"]).default("asc"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type TestDriveListQuery = z.infer<typeof testDriveListQuerySchema>;
