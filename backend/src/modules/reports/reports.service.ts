import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { TERMINAL_STATUSES } from "../../config/constants";
import { ReportQuery, TrendQuery } from "./reports.schema";

const CONVERTED_STATUSES = ["RETAIL_DONE"] as const;

function buildWhere(query: ReportQuery, branchFilter?: { branchId: string }): Prisma.EnquiryWhereInput {
  const where: Prisma.EnquiryWhereInput = {};
  if (branchFilter) where.branchId = branchFilter.branchId;
  if (query.branchId) where.branchId = query.branchId;
  if (query.dateFrom || query.dateTo) {
    where.createdAt = {
      ...(query.dateFrom ? { gte: new Date(query.dateFrom) } : {}),
      ...(query.dateTo ? { lte: new Date(query.dateTo) } : {}),
    };
  }
  return where;
}

export async function getSummary(query: ReportQuery, branchFilter?: { branchId: string }) {
  const where = buildWhere(query, branchFilter);

  const [total, byStatus] = await Promise.all([
    prisma.enquiry.count({ where }),
    prisma.enquiry.groupBy({ by: ["status"], where, _count: true }),
  ]);

  const statusCounts = Object.fromEntries(byStatus.map((row) => [row.status, row._count]));
  const converted = CONVERTED_STATUSES.reduce((sum, status) => sum + (statusCounts[status] ?? 0), 0);
  const followUpPending = statusCounts["UNDER_FOLLOW_UP"] ?? 0;
  const lost = statusCounts["CLOSED"] ?? 0;

  return {
    totalEnquiries: total,
    newEnquiries: statusCounts["NEW"] ?? 0,
    converted,
    followUpPending,
    lost,
    statusBreakdown: statusCounts,
  };
}

export async function getCrPerformance(query: ReportQuery, branchFilter?: { branchId: string }) {
  const where = buildWhere(query, branchFilter);

  const now = new Date();

  const [assignedCounts, convertedCounts, pendingCounts, overdueCounts] = await Promise.all([
    prisma.enquiry.groupBy({ by: ["assignedCrId"], where: { ...where, assignedCrId: { not: null } }, _count: true }),
    prisma.enquiry.groupBy({
      by: ["assignedCrId"],
      where: { ...where, assignedCrId: { not: null }, status: { in: [...CONVERTED_STATUSES] } },
      _count: true,
    }),
    prisma.enquiry.groupBy({
      by: ["assignedCrId"],
      where: { ...where, assignedCrId: { not: null }, status: { notIn: [...TERMINAL_STATUSES] }, followUpDueAt: { not: null } },
      _count: true,
    }),
    prisma.enquiry.groupBy({
      by: ["assignedCrId"],
      where: { ...where, assignedCrId: { not: null }, status: { notIn: [...TERMINAL_STATUSES] }, followUpDueAt: { lt: now } },
      _count: true,
    }),
  ]);

  const convertedMap = new Map(convertedCounts.map((row) => [row.assignedCrId, row._count]));
  const pendingMap = new Map(pendingCounts.map((row) => [row.assignedCrId, row._count]));
  const overdueMap = new Map(overdueCounts.map((row) => [row.assignedCrId, row._count]));
  const crIds = assignedCounts.map((row) => row.assignedCrId).filter((id): id is string => !!id);

  const crUsers = await prisma.user.findMany({
    where: { id: { in: crIds } },
    select: { id: true, name: true, branchId: true },
  });
  const userMap = new Map(crUsers.map((u) => [u.id, u]));

  return assignedCounts
    .filter((row) => row.assignedCrId)
    .map((row) => {
      const assigned = row._count;
      const converted = convertedMap.get(row.assignedCrId) ?? 0;
      const pending = pendingMap.get(row.assignedCrId) ?? 0;
      const overdue = overdueMap.get(row.assignedCrId) ?? 0;
      const user = userMap.get(row.assignedCrId!);
      return {
        crId: row.assignedCrId,
        crName: user?.name ?? "Unknown",
        branchId: user?.branchId ?? null,
        assigned,
        converted,
        followUpsPending: pending,
        followUpsOverdue: overdue,
        conversionRate: assigned > 0 ? Number(((converted / assigned) * 100).toFixed(1)) : 0,
      };
    })
    .sort((a, b) => b.conversionRate - a.conversionRate);
}

export async function getBranchRollup(query: ReportQuery, branchFilter?: { branchId: string }) {
  const where = buildWhere(query, branchFilter);

  const rows = await prisma.enquiry.groupBy({ by: ["branchId", "status"], where, _count: true });
  const branchIds = [...new Set(rows.map((r) => r.branchId))];
  const branches = await prisma.branch.findMany({ where: { id: { in: branchIds } }, select: { id: true, name: true } });
  const branchMap = new Map(branches.map((b) => [b.id, b.name]));

  const grouped = new Map<string, { branchId: string; branchName: string; statusCounts: Record<string, number>; total: number }>();
  for (const row of rows) {
    const key = row.branchId;
    if (!grouped.has(key)) {
      grouped.set(key, { branchId: key, branchName: branchMap.get(key) ?? "Unknown", statusCounts: {}, total: 0 });
    }
    const entry = grouped.get(key)!;
    entry.statusCounts[row.status] = row._count;
    entry.total += row._count;
  }

  return [...grouped.values()];
}

export async function getTrend(query: TrendQuery, branchFilter?: { branchId: string }) {
  const branchId = branchFilter?.branchId ?? query.branchId ?? null;
  const dateFrom = query.dateFrom ? new Date(query.dateFrom) : null;
  const dateTo = query.dateTo ? new Date(query.dateTo) : null;

  const rows = await prisma.$queryRaw<{ bucket: Date; total: bigint; converted: bigint; lost: bigint }[]>(
    Prisma.sql`
      SELECT
        date_trunc(${query.granularity}, "createdAt") AS bucket,
        COUNT(*)::bigint AS total,
        COUNT(*) FILTER (WHERE status = 'RETAIL_DONE')::bigint AS converted,
        COUNT(*) FILTER (WHERE status = 'CLOSED')::bigint AS lost
      FROM enquiries
      WHERE 1=1
        ${branchId ? Prisma.sql`AND "branchId" = ${branchId}` : Prisma.empty}
        ${dateFrom ? Prisma.sql`AND "createdAt" >= ${dateFrom}` : Prisma.empty}
        ${dateTo ? Prisma.sql`AND "createdAt" <= ${dateTo}` : Prisma.empty}
      GROUP BY bucket
      ORDER BY bucket ASC
    `
  );

  return rows.map((row) => ({
    bucket: row.bucket,
    total: Number(row.total),
    converted: Number(row.converted),
    lost: Number(row.lost),
  }));
}
