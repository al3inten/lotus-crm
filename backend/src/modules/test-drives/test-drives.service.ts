import { Prisma, Role } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { istDayEnd, istDayStart } from "../../lib/istDate";
import { TestDriveListQuery } from "./test-drives.schema";

export interface TestDriveContext {
  userId: string;
  role: Role;
  restrictLeadsToOwn: boolean;
  canViewAllBranches: boolean;
  branchFilter?: { branchId: string };
}

type TestDriveStatus = "OVERDUE" | "UPCOMING" | "COMPLETED";

function deriveStatus(scheduledAt: Date | null, completedAt: Date | null, now: Date): TestDriveStatus {
  if (completedAt) return "COMPLETED";
  if (scheduledAt && scheduledAt < now) return "OVERDUE";
  return "UPCOMING";
}

function buildEnquiryScope(query: TestDriveListQuery, ctx: TestDriveContext, canSeeOthers: boolean, crossBranch: boolean) {
  const enquiryWhere: Prisma.EnquiryWhereInput = {};

  if (canSeeOthers) {
    // Branch managers are pinned to their branch via branchFilter; admins are unscoped
    // but may narrow to a branch. CR / consultant filters apply to anyone who can see others.
    if (ctx.branchFilter) enquiryWhere.branchId = ctx.branchFilter.branchId;
    if (crossBranch && query.branchId) enquiryWhere.branchId = query.branchId;
    if (query.assignedCrId) enquiryWhere.assignedCrId = query.assignedCrId;
    if (query.consultantId) enquiryWhere.consultantId = query.consultantId;
  } else {
    // Consultants no longer log in (they're directory entries, not Users), so the
    // only "own-only" restriction left here is a CR restricted to their own leads.
    enquiryWhere.assignedCrId = ctx.userId;
  }

  if (query.search) {
    enquiryWhere.lead = {
      is: {
        OR: [
          { name: { contains: query.search, mode: "insensitive" } },
          { phoneNormalized: { contains: query.search } },
        ],
      },
    };
  }

  return enquiryWhere;
}

export async function getTestDrives(query: TestDriveListQuery, ctx: TestDriveContext) {
  const canSeeOthers = !ctx.restrictLeadsToOwn;
  const crossBranch = ctx.role === "SUPER_ADMIN" || ctx.canViewAllBranches;

  const enquiryWhere = buildEnquiryScope(query, ctx, canSeeOthers, crossBranch);
  const where: Prisma.TestDriveFeedbackWhereInput = { enquiry: { is: enquiryWhere } };

  const now = new Date();
  const overdueWhere: Prisma.TestDriveFeedbackWhereInput = { ...where, completedAt: null, scheduledAt: { lt: now } };
  const upcomingWhere: Prisma.TestDriveFeedbackWhereInput = {
    ...where,
    completedAt: null,
    OR: [{ scheduledAt: null }, { scheduledAt: { gte: now } }],
  };
  const completedWhere: Prisma.TestDriveFeedbackWhereInput = { ...where, completedAt: { not: null } };

  // Bucket stats are computed over the scoped set BEFORE the status filter, so the
  // tiles always show the full picture regardless of which tab is active.
  const [overdue, upcoming, completed, total] = await Promise.all([
    prisma.testDriveFeedback.count({ where: overdueWhere }),
    prisma.testDriveFeedback.count({ where: upcomingWhere }),
    prisma.testDriveFeedback.count({ where: completedWhere }),
    prisma.testDriveFeedback.count({ where }),
  ]);

  // An explicit calendar range wins over the status bucket for the paginated result
  // (the stat tiles above stay computed over the full scoped set either way). The range
  // is matched against whichever date the row is actually shown/sorted by: completedAt
  // for a finished drive, scheduledAt otherwise — matching scheduledAt alone would miss
  // completed drives whose displayed date is completedAt.
  let listWhere: Prisma.TestDriveFeedbackWhereInput;
  if (query.dateFrom || query.dateTo) {
    const range: Prisma.DateTimeFilter = {};
    if (query.dateFrom) range.gte = istDayStart(query.dateFrom);
    if (query.dateTo) range.lte = istDayEnd(query.dateTo);
    listWhere = {
      ...where,
      OR: [{ completedAt: range }, { AND: [{ completedAt: null }, { scheduledAt: range }] }],
    };
  } else if (query.status === "OVERDUE") {
    listWhere = overdueWhere;
  } else if (query.status === "UPCOMING") {
    listWhere = upcomingWhere;
  } else if (query.status === "COMPLETED") {
    listWhere = completedWhere;
  } else {
    listWhere = where;
  }

  const orderBy: Prisma.TestDriveFeedbackOrderByWithRelationInput =
    query.sortBy === "createdAt"
      ? { createdAt: query.order }
      : query.sortBy === "cr"
        ? { enquiry: { assignedCr: { name: query.order } } }
        : query.sortBy === "consultant"
          ? { enquiry: { consultant: { name: query.order } } }
          : { scheduledAt: query.order };

  const [rows, count] = await Promise.all([
    prisma.testDriveFeedback.findMany({
      where: listWhere,
      orderBy,
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      include: {
        enquiry: {
          select: {
            id: true,
            carModel: true,
            lead: { select: { id: true, name: true, phoneRaw: true } },
            branch: { select: { id: true, name: true } },
            assignedCr: { select: { id: true, name: true } },
            consultant: { select: { id: true, name: true } },
          },
        },
      },
    }),
    prisma.testDriveFeedback.count({ where: listWhere }),
  ]);

  const items = rows.map((td) => ({
    id: td.id,
    enquiryId: td.enquiry.id,
    leadId: td.enquiry.lead.id,
    leadName: td.enquiry.lead.name,
    phoneRaw: td.enquiry.lead.phoneRaw,
    carModel: td.carModel ?? td.enquiry.carModel,
    variant: td.variant,
    scheduledAt: td.scheduledAt,
    completedAt: td.completedAt,
    rating: td.rating,
    address: td.address,
    comments: td.comments,
    createdAt: td.createdAt,
    status: deriveStatus(td.scheduledAt, td.completedAt, now),
    branch: td.enquiry.branch,
    assignedCr: td.enquiry.assignedCr,
    consultant: td.enquiry.consultant,
  }));

  // CR / consultant facets for the "categorise by rep" dropdowns — shown to every role,
  // scoped to whatever test drives they can already see (own-only roles just get
  // themselves plus whichever counterpart worked the same leads). TestDriveFeedback has
  // no CR/consultant column of its own — both live on the related enquiry — so this is
  // aggregated in JS off a single fetch rather than a Prisma groupBy (which can't group
  // by a relation field).
  const scopedRows = await prisma.testDriveFeedback.findMany({
    where,
    select: {
      enquiry: {
        select: {
          assignedCr: { select: { id: true, name: true } },
          consultant: { select: { id: true, name: true } },
        },
      },
    },
  });

  const crMap = new Map<string, { id: string; name: string; count: number }>();
  const consultantMap = new Map<string, { id: string; name: string; count: number }>();
  for (const row of scopedRows) {
    const cr = row.enquiry.assignedCr;
    if (cr) crMap.set(cr.id, { id: cr.id, name: cr.name, count: (crMap.get(cr.id)?.count ?? 0) + 1 });
    const consultant = row.enquiry.consultant;
    if (consultant)
      consultantMap.set(consultant.id, {
        id: consultant.id,
        name: consultant.name,
        count: (consultantMap.get(consultant.id)?.count ?? 0) + 1,
      });
  }
  const crs = Array.from(crMap.values()).sort((a, b) => b.count - a.count);
  const consultants = Array.from(consultantMap.values()).sort((a, b) => b.count - a.count);

  return {
    items,
    total: count,
    page: query.page,
    pageSize: query.pageSize,
    stats: { overdue, upcoming, completed, total },
    crs,
    consultants,
    canSeeOthers,
    crossBranch,
  };
}
