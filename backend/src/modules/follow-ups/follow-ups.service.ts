import { Prisma, Role, EnquiryStatus, EnquiryCategory, LeadSource } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { FollowUpListQuery, FollowUpCalendarQuery } from "./follow-ups.schema";

// Follow-ups on won/lost enquiries are done — never surface them in the queue.
const TERMINAL_STATUSES: EnquiryStatus[] = ["RETAIL_DONE", "CLOSED"];

// Roles restricted to only their OWN assigned follow-ups. Everyone else sees their
// branch scope (branch manager) or all branches (admin / super admin).
const OWN_ONLY_ROLES: Role[] = ["CR_TEAM", "CONSULTANT"];

export interface FollowUpContext {
  userId: string;
  role: Role;
  branchFilter?: { branchId: string };
}

// Day boundaries in server local time, reused for both bucket filtering and stats.
function dayBounds() {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);
  const endOfWeek = new Date(startOfToday);
  endOfWeek.setDate(endOfWeek.getDate() + 7);
  endOfWeek.setHours(23, 59, 59, 999);
  return { startOfToday, endOfToday, endOfWeek };
}

function timeframeFilter(timeframe: FollowUpListQuery["timeframe"]): Prisma.DateTimeFilter | undefined {
  const { startOfToday, endOfToday, endOfWeek } = dayBounds();
  switch (timeframe) {
    case "overdue":
      return { lt: startOfToday };
    case "today":
      return { gte: startOfToday, lte: endOfToday };
    case "week":
      // Everything due from the start of today through the next 7 days.
      return { gte: startOfToday, lte: endOfWeek };
    case "later":
      return { gt: endOfWeek };
    default:
      return undefined;
  }
}

interface ScopedFilters {
  status?: string;
  enquiryCategory?: string;
  source?: string;
  branchId?: string;
  assignedCrId?: string;
  search?: string;
}

// Shared scoping: restricts to active enquiries with a scheduled follow-up, applies
// role-based visibility (own / branch / all), and layers on the common facet filters.
// Used by both the paginated list and the calendar per-day counts so they agree on
// what counts as "in scope."
function buildScopedWhere(filters: ScopedFilters, ctx: FollowUpContext) {
  const canSeeOthers = !OWN_ONLY_ROLES.includes(ctx.role);
  const crossBranch = ctx.role === "SUPER_ADMIN" || ctx.role === "ADMIN";

  const where: Prisma.EnquiryWhereInput = {
    status: { notIn: TERMINAL_STATUSES },
    followUpDueAt: { not: null },
  };

  if (canSeeOthers) {
    // Branch managers are pinned to their branch via branchFilter; admins are unscoped
    // but may narrow to a branch. CR / consultant filters apply to anyone who can see others.
    if (ctx.branchFilter) where.branchId = ctx.branchFilter.branchId;
    if (crossBranch && filters.branchId) where.branchId = filters.branchId;
    if (filters.assignedCrId) where.assignedCrId = filters.assignedCrId;
  } else {
    // CR / consultant: hard-locked to their own follow-ups, ignoring any cr/branch filters.
    where.assignedCrId = ctx.userId;
  }

  if (filters.status) where.status = filters.status as EnquiryStatus;
  if (filters.enquiryCategory) where.enquiryCategory = filters.enquiryCategory as EnquiryCategory;
  if (filters.source) where.source = filters.source as LeadSource;
  if (filters.search) {
    where.lead = {
      is: {
        OR: [
          { name: { contains: filters.search, mode: "insensitive" } },
          { phoneNormalized: { contains: filters.search } },
        ],
      },
    };
  }

  return { where, canSeeOthers, crossBranch };
}

export async function getUpcomingFollowUps(query: FollowUpListQuery, ctx: FollowUpContext) {
  const { where, canSeeOthers, crossBranch } = buildScopedWhere(query, ctx);

  // Bucket stats are computed over the scoped set BEFORE the timeframe filter so the
  // category tiles always show the full picture regardless of which tab is active.
  const { startOfToday, endOfToday, endOfWeek } = dayBounds();
  const [overdue, today, thisWeek, later, total] = await Promise.all([
    prisma.enquiry.count({ where: { ...where, followUpDueAt: { lt: startOfToday } } }),
    prisma.enquiry.count({ where: { ...where, followUpDueAt: { gte: startOfToday, lte: endOfToday } } }),
    prisma.enquiry.count({ where: { ...where, followUpDueAt: { gt: endOfToday, lte: endOfWeek } } }),
    prisma.enquiry.count({ where: { ...where, followUpDueAt: { gt: endOfWeek } } }),
    prisma.enquiry.count({ where }),
  ]);

  // Apply the active timeframe tab to the paginated result only. An explicit calendar
  // day (dueDate) wins over the timeframe bucket when both are present.
  const listWhere: Prisma.EnquiryWhereInput = { ...where };
  if (query.dueDate) {
    const [y, m, d] = query.dueDate.split("-").map(Number);
    listWhere.followUpDueAt = {
      gte: new Date(y, m - 1, d, 0, 0, 0, 0),
      lte: new Date(y, m - 1, d, 23, 59, 59, 999),
    };
  } else {
    const tf = timeframeFilter(query.timeframe);
    if (tf) listWhere.followUpDueAt = tf;
  }

  const orderBy: Prisma.EnquiryOrderByWithRelationInput =
    query.sortBy === "createdAt"
      ? { createdAt: query.order }
      : query.sortBy === "cr"
        ? { assignedCr: { name: query.order } }
        : query.sortBy === "status"
          ? { status: query.order }
          : { followUpDueAt: query.order };

  const [rows, count] = await Promise.all([
    prisma.enquiry.findMany({
      where: listWhere,
      orderBy,
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      include: {
        lead: { select: { id: true, name: true, phoneRaw: true } },
        branch: { select: { id: true, name: true } },
        assignedCr: { select: { id: true, name: true } },
        followUps: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { type: true, remark: true, createdAt: true },
        },
      },
    }),
    prisma.enquiry.count({ where: listWhere }),
  ]);

  const items = rows.map((e) => {
    const lastFollowUp = e.followUps[0] ?? null;
    return {
      enquiryId: e.id,
      leadId: e.leadId,
      leadName: e.lead.name,
      phoneRaw: e.lead.phoneRaw,
      carModel: e.carModel,
      source: e.source,
      status: e.status,
      enquiryCategory: e.enquiryCategory,
      followUpDueAt: e.followUpDueAt,
      branch: e.branch,
      assignedCr: e.assignedCr,
      lastFollowUp: lastFollowUp
        ? { type: lastFollowUp.type, remark: lastFollowUp.remark, createdAt: lastFollowUp.createdAt }
        : null,
    };
  });

  // CR facet (for the admin/manager "categorise by rep" dropdown). Only meaningful when
  // the user can see more than their own; computed over the scoped set, not the page.
  let crs: { id: string; name: string; count: number }[] = [];
  if (canSeeOthers) {
    const grouped = await prisma.enquiry.groupBy({
      by: ["assignedCrId"],
      where,
      _count: true,
    });
    const crIds = grouped.map((g) => g.assignedCrId).filter((id): id is string => !!id);
    const users = crIds.length
      ? await prisma.user.findMany({ where: { id: { in: crIds } }, select: { id: true, name: true } })
      : [];
    const nameById = new Map(users.map((u) => [u.id, u.name]));
    crs = grouped
      .filter((g) => g.assignedCrId)
      .map((g) => ({ id: g.assignedCrId as string, name: nameById.get(g.assignedCrId as string) ?? "Unknown", count: g._count }))
      .sort((a, b) => b.count - a.count);
  }

  return {
    items,
    total: count,
    page: query.page,
    pageSize: query.pageSize,
    stats: { overdue, today, thisWeek, later, total },
    crs,
    canSeeOthers,
    crossBranch,
  };
}

// Per-day counts for the calendar view. Fetches just the due dates in range and buckets
// them in JS (rather than a DB-level date_trunc) so the query stays portable and simple —
// the range is at most a few weeks/a month, so the row count is small.
export async function getFollowUpCalendarCounts(query: FollowUpCalendarQuery, ctx: FollowUpContext) {
  const { where } = buildScopedWhere(query, ctx);

  const [ys, ms, ds] = query.start.split("-").map(Number);
  const [ye, me, de] = query.end.split("-").map(Number);
  const rangeStart = new Date(ys, ms - 1, ds, 0, 0, 0, 0);
  const rangeEnd = new Date(ye, me - 1, de, 23, 59, 59, 999);

  const rows = await prisma.enquiry.findMany({
    where: { ...where, followUpDueAt: { gte: rangeStart, lte: rangeEnd } },
    select: { followUpDueAt: true },
  });

  const counts: Record<string, number> = {};
  for (const row of rows) {
    if (!row.followUpDueAt) continue;
    const d = row.followUpDueAt;
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    counts[iso] = (counts[iso] ?? 0) + 1;
  }
  return counts;
}
