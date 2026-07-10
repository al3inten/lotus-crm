import { Prisma, EnquiryStatus } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { ReportQuery } from "./reports.schema";

const CONVERTED_STATUSES: EnquiryStatus[] = ["RETAIL_DONE"];

// Pipeline stages in funnel order. BOOKING_CANCEL / RETAIL_CANCEL / ENQUIRY_CLOSED are
// terminal states, not funnel milestones, so they're excluded from stage-reach counting.
const FUNNEL_STAGES: EnquiryStatus[] = ["NEW", "UNDER_FOLLOW_UP", "APPOINTMENT_FIXED", "TEST_DRIVE", "BOOKED", "RETAIL_DONE"];

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

function growthPercent(current: number, previous: number): number | null {
  if (previous === 0) return null; // no base period — growth % is undefined, not infinite
  return Number((((current - previous) / previous) * 100).toFixed(1));
}

/**
 * Compares the selected period against the same period shifted one year back.
 * Defaults to year-to-date vs the same year-to-date window last year.
 */
export async function getYearOverYear(query: ReportQuery, branchFilter?: { branchId: string }) {
  const now = new Date();
  const currentFrom = query.dateFrom ? new Date(query.dateFrom) : new Date(now.getFullYear(), 0, 1);
  const currentTo = query.dateTo ? new Date(query.dateTo) : now;

  const previousFrom = new Date(currentFrom);
  previousFrom.setFullYear(previousFrom.getFullYear() - 1);
  const previousTo = new Date(currentTo);
  previousTo.setFullYear(previousTo.getFullYear() - 1);

  const branchWhere: Prisma.EnquiryWhereInput = {};
  if (branchFilter) branchWhere.branchId = branchFilter.branchId;
  if (query.branchId) branchWhere.branchId = query.branchId;

  async function periodStats(from: Date, to: Date) {
    const where: Prisma.EnquiryWhereInput = { ...branchWhere, createdAt: { gte: from, lte: to } };
    const [total, converted, lost] = await Promise.all([
      prisma.enquiry.count({ where }),
      prisma.enquiry.count({ where: { ...where, status: { in: CONVERTED_STATUSES } } }),
      prisma.enquiry.count({ where: { ...where, status: "CLOSED" } }),
    ]);
    return {
      total,
      converted,
      lost,
      conversionRate: total > 0 ? Number(((converted / total) * 100).toFixed(1)) : 0,
    };
  }

  const [current, previous] = await Promise.all([
    periodStats(currentFrom, currentTo),
    periodStats(previousFrom, previousTo),
  ]);

  return {
    currentPeriod: { from: currentFrom, to: currentTo, ...current },
    previousPeriod: { from: previousFrom, to: previousTo, ...previous },
    growth: {
      total: growthPercent(current.total, previous.total),
      converted: growthPercent(current.converted, previous.converted),
      lost: growthPercent(current.lost, previous.lost),
      conversionRate:
        previous.conversionRate > 0
          ? Number((current.conversionRate - previous.conversionRate).toFixed(1))
          : null,
    },
  };
}

/**
 * For each pipeline stage, counts how many enquiries in the filtered set ever REACHED
 * that stage — from the status-history audit trail, not just the current status — so
 * the funnel shows true drop-off, not a snapshot of where enquiries happen to sit today.
 */
export async function getFunnel(query: ReportQuery, branchFilter?: { branchId: string }) {
  const where = buildWhere(query, branchFilter);
  const totalEnquiries = await prisma.enquiry.count({ where });

  // Raw SQL because Prisma's groupBy counts rows, not distinct enquiries — a stage could
  // otherwise be double-counted if an enquiry's status history ever revisits it.
  const distinctReached = await prisma.$queryRaw<{ toStatus: EnquiryStatus; count: bigint }[]>(
    Prisma.sql`
      SELECT h."toStatus", COUNT(DISTINCT h."enquiryId")::bigint AS count
      FROM enquiry_status_history h
      JOIN enquiries e ON e.id = h."enquiryId"
      WHERE h."toStatus"::text = ANY(${FUNNEL_STAGES})
        ${branchFilter?.branchId ? Prisma.sql`AND e."branchId" = ${branchFilter.branchId}` : Prisma.empty}
        ${query.branchId ? Prisma.sql`AND e."branchId" = ${query.branchId}` : Prisma.empty}
        ${query.dateFrom ? Prisma.sql`AND e."createdAt" >= ${new Date(query.dateFrom)}` : Prisma.empty}
        ${query.dateTo ? Prisma.sql`AND e."createdAt" <= ${new Date(query.dateTo)}` : Prisma.empty}
      GROUP BY h."toStatus"
    `
  );

  const reachedMap = new Map(distinctReached.map((r) => [r.toStatus, Number(r.count)]));

  return FUNNEL_STAGES.map((stage) => {
    const count = reachedMap.get(stage) ?? 0;
    return {
      stage,
      reached: count,
      percentOfTotal: totalEnquiries > 0 ? Number(((count / totalEnquiries) * 100).toFixed(1)) : 0,
    };
  });
}

/**
 * Average time an enquiry spends in each stage, computed from consecutive
 * status-history rows via a window function.
 */
export async function getTimeInStage(query: ReportQuery, branchFilter?: { branchId: string }) {
  const rows = await prisma.$queryRaw<{ stage: EnquiryStatus; avgHours: number | null; transitions: bigint }[]>(
    Prisma.sql`
      WITH stage_durations AS (
        SELECT
          h."toStatus" AS stage,
          EXTRACT(EPOCH FROM (
            LEAD(h."createdAt") OVER (PARTITION BY h."enquiryId" ORDER BY h."createdAt") - h."createdAt"
          )) / 3600 AS hours_in_stage
        FROM enquiry_status_history h
        JOIN enquiries e ON e.id = h."enquiryId"
        WHERE 1=1
          ${branchFilter?.branchId ? Prisma.sql`AND e."branchId" = ${branchFilter.branchId}` : Prisma.empty}
          ${query.branchId ? Prisma.sql`AND e."branchId" = ${query.branchId}` : Prisma.empty}
          ${query.dateFrom ? Prisma.sql`AND e."createdAt" >= ${new Date(query.dateFrom)}` : Prisma.empty}
          ${query.dateTo ? Prisma.sql`AND e."createdAt" <= ${new Date(query.dateTo)}` : Prisma.empty}
      )
      SELECT stage, AVG(hours_in_stage)::float AS "avgHours", COUNT(hours_in_stage)::bigint AS transitions
      FROM stage_durations
      WHERE hours_in_stage IS NOT NULL
      GROUP BY stage
      ORDER BY "avgHours" DESC NULLS LAST
    `
  );

  return rows.map((row) => ({
    stage: row.stage,
    avgHours: row.avgHours != null ? Number(row.avgHours.toFixed(1)) : null,
    completedTransitions: Number(row.transitions),
  }));
}

/** Call activity from the Phase 3 voice agent's CallLog data. */
export async function getCallAnalysis(query: ReportQuery) {
  const where: Prisma.CallLogWhereInput = {};
  if (query.dateFrom || query.dateTo) {
    where.createdAt = {
      ...(query.dateFrom ? { gte: new Date(query.dateFrom) } : {}),
      ...(query.dateTo ? { lte: new Date(query.dateTo) } : {}),
    };
  }

  const [byStatus, durationAgg] = await Promise.all([
    prisma.callLog.groupBy({ by: ["status"], where, _count: true }),
    prisma.callLog.aggregate({ where: { ...where, durationSeconds: { not: null } }, _avg: { durationSeconds: true } }),
  ]);

  const counts = Object.fromEntries(byStatus.map((r) => [r.status, r._count]));
  const completed = counts["COMPLETED"] ?? 0;
  const noAnswer = counts["NO_ANSWER"] ?? 0;
  const failed = counts["FAILED"] ?? 0;
  const totalFinished = completed + noAnswer + failed;

  return {
    totalCalls: Object.values(counts).reduce((sum, c) => sum + (c as number), 0),
    completed,
    noAnswer,
    failed,
    answerRate: totalFinished > 0 ? Number(((completed / totalFinished) * 100).toFixed(1)) : 0,
    avgDurationSeconds: durationAgg._avg.durationSeconds != null ? Math.round(durationAgg._avg.durationSeconds) : null,
  };
}

/** Which lead source produces the most leads AND the best conversion rate. */
export async function getSourcePerformance(query: ReportQuery, branchFilter?: { branchId: string }) {
  const where = buildWhere(query, branchFilter);

  const [totals, converted] = await Promise.all([
    prisma.enquiry.groupBy({ by: ["source"], where, _count: true }),
    prisma.enquiry.groupBy({ by: ["source"], where: { ...where, status: { in: CONVERTED_STATUSES } }, _count: true }),
  ]);

  const convertedMap = new Map(converted.map((r) => [r.source, r._count]));

  return totals
    .map((row) => {
      const conv = convertedMap.get(row.source) ?? 0;
      return {
        source: row.source,
        total: row._count,
        converted: conv,
        conversionRate: row._count > 0 ? Number(((conv / row._count) * 100).toFixed(1)) : 0,
      };
    })
    .sort((a, b) => b.total - a.total);
}

/** Why deals are being lost, from the lossReason captured at LOST transition. */
export async function getLostReasons(query: ReportQuery, branchFilter?: { branchId: string }) {
  const where = buildWhere(query, branchFilter);

  const rows = await prisma.enquiry.groupBy({
    by: ["lossReason"],
    where: { ...where, status: "CLOSED", lossReason: { not: null } },
    _count: true,
  });

  const total = rows.reduce((sum, r) => sum + r._count, 0);

  return rows
    .map((row) => ({
      reason: row.lossReason!,
      count: row._count,
      percent: total > 0 ? Number(((row._count / total) * 100).toFixed(1)) : 0,
    }))
    .sort((a, b) => b.count - a.count);
}

/** Flat CSV of enquiries matching the filters — for sharing outside the CRM. */
export async function exportEnquiriesCsv(query: ReportQuery, branchFilter?: { branchId: string }): Promise<string> {
  const where = buildWhere(query, branchFilter);

  const enquiries = await prisma.enquiry.findMany({
    where,
    include: {
      lead: { select: { name: true, phoneRaw: true, email: true } },
      branch: { select: { name: true } },
      assignedCr: { select: { name: true } },
      consultant: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 10_000, // hard cap — exports beyond this should be narrowed by date range
  });

  const escape = (value: unknown): string => {
    const str = value == null ? "" : String(value);
    return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
  };

  const header = [
    "Created",
    "Lead Name",
    "Phone",
    "Email",
    "Car Model",
    "Source",
    "Enquiry Type",
    "Status",
    "Loss Reason",
    "Branch",
    "Assigned CR",
    "Consultant",
    "Location",
  ];

  const lines = enquiries.map((e) =>
    [
      e.createdAt.toISOString(),
      e.lead.name,
      e.lead.phoneRaw,
      e.lead.email ?? "",
      e.carModel,
      e.source,
      e.enquiryType,
      e.status,
      e.lossReason ?? "",
      e.branch.name,
      e.assignedCr?.name ?? "",
      e.consultant?.name ?? "",
      e.location ?? "",
    ]
      .map(escape)
      .join(",")
  );

  return [header.join(","), ...lines].join("\n");
}
