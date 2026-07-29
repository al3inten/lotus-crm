import { Prisma, Role, EnquiryStatus, EnquiryCategory, LeadSource } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { TERMINAL_STATUSES } from "../../config/constants";
import { istDayBounds, istDayEnd, istDayKey, istDayStart } from "../../lib/istDate";
import { FollowUpListQuery, FollowUpCalendarQuery } from "./follow-ups.schema";

export interface FollowUpContext {
  userId: string;
  role: Role;
  restrictLeadsToOwn: boolean;
  canViewAllBranches: boolean;
  branchFilter?: { branchId: string };
}

function timeframeFilter(timeframe: FollowUpListQuery["timeframe"]): Prisma.DateTimeFilter | undefined {
  const { startOfToday, endOfToday, endOfWeek } = istDayBounds();
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

export async function getUpcomingFollowUps(query: FollowUpListQuery, ctx: FollowUpContext) {
  const canSeeOthers = !ctx.restrictLeadsToOwn;
  const crossBranch = ctx.role === "SUPER_ADMIN" || ctx.canViewAllBranches;

  // Base scope: active enquiries that actually have a next-follow-up scheduled.
  const where: Prisma.EnquiryWhereInput = {
    status: { notIn: TERMINAL_STATUSES },
    followUpDueAt: { not: null },
  };

  if (canSeeOthers) {
    // Branch managers are pinned to their branch via branchFilter; admins are unscoped
    // but may narrow to a branch. CR / consultant filters apply to anyone who can see others.
    if (ctx.branchFilter) where.branchId = ctx.branchFilter.branchId;
    if (crossBranch && query.branchId) where.branchId = query.branchId;
    if (query.assignedCrId) where.assignedCrId = query.assignedCrId;
  } else {
    // CR / consultant: hard-locked to their own follow-ups, ignoring any cr/branch filters.
    where.assignedCrId = ctx.userId;
  }

  if (query.status) where.status = query.status as EnquiryStatus;
  if (query.enquiryCategory) where.enquiryCategory = query.enquiryCategory as EnquiryCategory;
  if (query.source) where.source = query.source as LeadSource;
  if (query.search) {
    where.lead = {
      is: {
        OR: [
          { name: { contains: query.search, mode: "insensitive" } },
          { phoneNormalized: { contains: query.search } },
        ],
      },
    };
  }

  // Bucket stats are computed over the scoped set BEFORE the timeframe filter so the
  // category tiles always show the full picture regardless of which tab is active.
  const { startOfToday, endOfToday, endOfWeek } = istDayBounds();
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
    listWhere.followUpDueAt = { gte: istDayStart(query.dueDate), lte: istDayEnd(query.dueDate) };
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

/**
 * Per-day follow-up counts over a date range for the calendar heat view, plus a
 * per-CR breakdown (own row for restricted roles, everyone in scope otherwise).
 */
export async function getFollowUpCalendar(query: FollowUpCalendarQuery, ctx: FollowUpContext) {
  const canSeeOthers = !ctx.restrictLeadsToOwn;
  const crossBranch = ctx.role === "SUPER_ADMIN" || ctx.canViewAllBranches;

  const rangeStart = istDayStart(query.start);
  const rangeEnd = istDayEnd(query.end);

  const where: Prisma.EnquiryWhereInput = {
    status: { notIn: TERMINAL_STATUSES },
    followUpDueAt: { gte: rangeStart, lte: rangeEnd },
  };

  if (canSeeOthers) {
    if (ctx.branchFilter) where.branchId = ctx.branchFilter.branchId;
    if (crossBranch && query.branchId) where.branchId = query.branchId;
    if (query.assignedCrId) where.assignedCrId = query.assignedCrId;
  } else {
    where.assignedCrId = ctx.userId;
  }

  const rows = await prisma.enquiry.findMany({
    where,
    select: {
      followUpDueAt: true,
      assignedCrId: true,
      assignedCr: { select: { id: true, name: true } },
    },
  });

  // Total per day + per-CR totals (with their own per-day breakdown).
  const counts: Record<string, number> = {};
  const crMap = new Map<string, { id: string; name: string; count: number; countsByDate: Record<string, number> }>();

  for (const row of rows) {
    if (!row.followUpDueAt) continue;
    const key = istDayKey(row.followUpDueAt);
    counts[key] = (counts[key] ?? 0) + 1;

    if (canSeeOthers) {
      const id = row.assignedCr?.id ?? "unassigned";
      const name = row.assignedCr?.name ?? "Unassigned";
      let entry = crMap.get(id);
      if (!entry) {
        entry = { id, name, count: 0, countsByDate: {} };
        crMap.set(id, entry);
      }
      entry.count += 1;
      entry.countsByDate[key] = (entry.countsByDate[key] ?? 0) + 1;
    }
  }

  const byCr = Array.from(crMap.values()).sort((a, b) => b.count - a.count);

  return {
    counts,
    byCr,
    total: rows.length,
    canSeeOthers,
    crossBranch,
  };
}
