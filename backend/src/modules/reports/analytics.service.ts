import { Prisma, EnquiryStatus, LossReason } from "@prisma/client";
import ExcelJS from "exceljs";
import { prisma } from "../../lib/prisma";
import { ReportQuery, BreakdownQuery, BreakdownDimension } from "./reports.schema";
import { cacheKey, getOrCompute } from "../../lib/simpleCache";
import { istDayStart, istDayEnd } from "../../lib/istDate";
import { TERMINAL_STATUSES } from "../../config/constants";

// Heavy report aggregations (funnel, time-in-stage, vehicle performance) are read-only and
// tolerate a short staleness window, so they're cached per distinct filter combination for
// 60s to avoid recomputing the same GROUP BY / window-function query on every dashboard
// refresh or repeated request.
const REPORT_CACHE_TTL_MS = 60_000;

const CONVERTED_STATUSES: EnquiryStatus[] = ["RETAIL_DONE"];

// Pipeline stages in funnel order. UNDER_FOLLOW_UP is a sub-state (not a milestone) and
// CLOSED is a terminal off-ramp, so both are excluded from stage-reach counting.
const FUNNEL_STAGES: EnquiryStatus[] = [
  "NEW",
  "APPOINTMENT_FIXED",
  "TEST_DRIVE",
  "BOOKED",
  "RETAIL_DONE",
  "RTO_DONE",
  "DELIVERED",
];

function buildWhere(query: ReportQuery, branchFilter?: { branchId: string }): Prisma.EnquiryWhereInput {
  const where: Prisma.EnquiryWhereInput = {};
  if (branchFilter) where.branchId = branchFilter.branchId;
  if (query.branchId) where.branchId = query.branchId;
  if (query.dateFrom || query.dateTo) {
    where.createdAt = {
      ...(query.dateFrom ? { gte: istDayStart(query.dateFrom) } : {}),
      ...(query.dateTo ? { lte: istDayEnd(query.dateTo) } : {}),
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
  const currentFrom = query.dateFrom ? istDayStart(query.dateFrom) : new Date(now.getFullYear(), 0, 1);
  const currentTo = query.dateTo ? istDayEnd(query.dateTo) : now;

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
  return getOrCompute(cacheKey("getFunnel", { query, branchFilter }), () => computeFunnel(query, branchFilter), REPORT_CACHE_TTL_MS);
}

async function computeFunnel(query: ReportQuery, branchFilter?: { branchId: string }) {
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
        ${query.dateFrom ? Prisma.sql`AND e."createdAt" >= ${istDayStart(query.dateFrom)}` : Prisma.empty}
        ${query.dateTo ? Prisma.sql`AND e."createdAt" <= ${istDayEnd(query.dateTo)}` : Prisma.empty}
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
  return getOrCompute(
    cacheKey("getTimeInStage", { query, branchFilter }),
    () => computeTimeInStage(query, branchFilter),
    REPORT_CACHE_TTL_MS
  );
}

async function computeTimeInStage(query: ReportQuery, branchFilter?: { branchId: string }) {
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
          ${query.dateFrom ? Prisma.sql`AND e."createdAt" >= ${istDayStart(query.dateFrom)}` : Prisma.empty}
          ${query.dateTo ? Prisma.sql`AND e."createdAt" <= ${istDayEnd(query.dateTo)}` : Prisma.empty}
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
      ...(query.dateFrom ? { gte: istDayStart(query.dateFrom) } : {}),
      ...(query.dateTo ? { lte: istDayEnd(query.dateTo) } : {}),
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

const REFERRAL_LEAD_ROW_CAP = 500;

/** Referral-sourced leads (sourceCategory = REFERRAL) — a simple count plus the list of
 * who referred whom, for the Reports "Referrals" tab. */
export async function getReferralLeads(query: ReportQuery, branchFilter?: { branchId: string }) {
  const where: Prisma.EnquiryWhereInput = { ...buildWhere(query, branchFilter), sourceCategory: "REFERRAL" };

  const [total, converted, lost, enquiries] = await Promise.all([
    prisma.enquiry.count({ where }),
    // Computed over the full where-clause, not just the capped `rows` below — a dealership
    // with more referral leads than the row cap would otherwise show a converted/lost count
    // (and conversion rate) that silently excludes everything past the cap.
    prisma.enquiry.count({ where: { ...where, status: "RETAIL_DONE" } }),
    prisma.enquiry.count({ where: { ...where, status: "CLOSED" } }),
    prisma.enquiry.findMany({
      where,
      include: {
        lead: { select: { name: true, phoneRaw: true } },
        branch: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: REFERRAL_LEAD_ROW_CAP,
    }),
  ]);

  return {
    total,
    converted,
    lost,
    rows: enquiries.map((e) => ({
      id: e.id,
      leadId: e.leadId,
      name: e.lead.name,
      phone: e.lead.phoneRaw,
      referrerName: e.referrerName,
      referrerPhone: e.referrerPhone,
      carModel: e.carModel,
      status: e.status,
      branch: e.branch.name,
      createdAt: e.createdAt.toISOString(),
    })),
  };
}

const TOP_REFERRAL_ROWS = 15;

/** Who's actually driving referral business, and which cars those referrals are for —
 * two leaderboards for the Reports "Referrals" tab, ranked by volume. Referrers are
 * identified by mobile number, not name — the same person can be typed as "Kishore" one
 * time and "kishore k" the next, so name alone would double-count them; the number doesn't
 * lie. Rows from before referrerPhone existed fall back to name so old data isn't dropped. */
export async function getReferralPerformance(query: ReportQuery, branchFilter?: { branchId: string }) {
  const where: Prisma.EnquiryWhereInput = {
    ...buildWhere(query, branchFilter),
    sourceCategory: "REFERRAL",
    referrerName: { not: null },
  };

  const [referrals, byModel, convertedByModel] = await Promise.all([
    prisma.enquiry.findMany({
      where,
      select: { referrerName: true, referrerPhone: true, status: true },
    }),
    prisma.enquiry.groupBy({
      by: ["carModel"],
      where: { ...buildWhere(query, branchFilter), sourceCategory: "REFERRAL" },
      _count: true,
      orderBy: { _count: { carModel: "desc" } },
    }),
    prisma.enquiry.groupBy({
      by: ["carModel"],
      where: { ...buildWhere(query, branchFilter), sourceCategory: "REFERRAL", status: { in: [...CONVERTED_STATUSES] } },
      _count: true,
    }),
  ]);

  const converted = new Set<string>(CONVERTED_STATUSES);
  const referrerStats = new Map<string, { referrerName: string; referrerPhone: string | null; count: number; converted: number }>();
  for (const r of referrals) {
    const phone = r.referrerPhone?.trim() || null;
    const key = phone ?? `name:${r.referrerName!.trim().toLowerCase()}`;
    const existing = referrerStats.get(key);
    if (existing) {
      existing.count += 1;
      if (converted.has(r.status)) existing.converted += 1;
    } else {
      referrerStats.set(key, {
        referrerName: r.referrerName!,
        referrerPhone: phone,
        count: 1,
        converted: converted.has(r.status) ? 1 : 0,
      });
    }
  }
  const topReferrers = [...referrerStats.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, TOP_REFERRAL_ROWS);

  const convertedModelMap = new Map(convertedByModel.map((r) => [r.carModel, r._count]));
  const topModels = byModel.slice(0, TOP_REFERRAL_ROWS).map((r) => ({
    carModel: r.carModel,
    count: r._count,
    converted: convertedModelMap.get(r.carModel) ?? 0,
  }));

  return { topReferrers, topModels };
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

// Maps each allow-listed Chart Builder dimension to the real Enquiry scalar column it
// groups on. Two dimensions resolve to a foreign key (assignedCr → assignedCrId,
// branch → branchId) whose ids we swap for display names after grouping.
const DIMENSION_FIELD: Record<BreakdownDimension, keyof Prisma.EnquiryGroupByOutputType> = {
  source: "source",
  enquiryType: "enquiryType",
  status: "status",
  department: "department",
  subsource: "subsource",
  sourceCategory: "sourceCategory",
  enquiryCategory: "enquiryCategory",
  lossReason: "lossReason",
  carModel: "carModel",
  variant: "variant",
  financeRequired: "financeRequired",
  callOutcome: "callOutcome",
  response: "response",
  nextAction: "nextAction",
  assignedCr: "assignedCrId",
  branch: "branchId",
};

// High-cardinality free-text dimensions are capped so the chart stays readable; the
// rest (enums, booleans, FK ids) have naturally bounded cardinality.
const BREAKDOWN_ROW_CAP = 20;
// A stacked bar reads fine with a handful of series; beyond that the rest collapse into
// "Other" rather than turning every row into an unreadable rainbow.
const SPLIT_SERIES_CAP = 6;

/** Resolves raw group-by keys to display labels for a dimension — shared by the 1D and
 * 2D breakdowns so id→name lookups (assignedCr, branch) and boolean labels stay in sync. */
async function buildLabelResolver(
  dimension: BreakdownDimension,
  keys: (string | null)[]
): Promise<(key: string | null) => string> {
  if (dimension === "assignedCr") {
    const ids = keys.filter((k): k is string => !!k);
    const users = await prisma.user.findMany({ where: { id: { in: ids } }, select: { id: true, name: true } });
    const nameMap = new Map(users.map((u) => [u.id, u.name]));
    return (key) => (key ? nameMap.get(key) ?? "Unknown" : "Unassigned");
  }
  if (dimension === "branch") {
    const ids = keys.filter((k): k is string => !!k);
    const branchRows = await prisma.branch.findMany({ where: { id: { in: ids } }, select: { id: true, name: true } });
    const nameMap = new Map(branchRows.map((b) => [b.id, b.name]));
    return (key) => (key ? nameMap.get(key) ?? "Unknown" : "—");
  }
  if (dimension === "financeRequired") {
    return (key) => (key === "true" ? "Finance required" : key === "false" ? "No finance" : "Not specified");
  }
  return (key) => key ?? "—";
}

/**
 * Generic "group enquiries by any dimension" powering the Reports Chart Builder.
 * Returns every measure (total / converted / lost / conversionRate) per group in one
 * shot so the client can switch the displayed measure without refetching. Only the
 * grouping dimension changes the query.
 */
export async function getBreakdown(query: BreakdownQuery, branchFilter?: { branchId: string }) {
  const where = buildWhere(query, branchFilter);
  const field = DIMENSION_FIELD[query.dimension];

  type GroupRow = Record<string, unknown> & { _count: number };
  const groupBy = (extra: Prisma.EnquiryWhereInput) =>
    prisma.enquiry.groupBy({
      by: [field as Prisma.EnquiryScalarFieldEnum],
      where: { ...where, ...extra },
      _count: true,
    }) as unknown as Promise<GroupRow[]>;

  const [totals, converted, lost] = await Promise.all([
    groupBy({}),
    groupBy({ status: { in: CONVERTED_STATUSES } }),
    groupBy({ status: "CLOSED" }),
  ]);

  const rawKey = (row: GroupRow) => {
    const value = row[field as string];
    return value == null ? null : String(value);
  };
  const convertedMap = new Map<string | null, number>();
  for (const row of converted) convertedMap.set(rawKey(row), row._count);
  const lostMap = new Map<string | null, number>();
  for (const row of lost) lostMap.set(rawKey(row), row._count);

  // For FK dimensions, resolve ids → display names.
  const labelFor = await buildLabelResolver(query.dimension, totals.map(rawKey));

  const rows = totals.map((row) => {
    const key = rawKey(row);
    const total = row._count;
    const conv = convertedMap.get(key) ?? 0;
    return {
      key: key ?? "__null__",
      label: labelFor(key),
      total,
      converted: conv,
      lost: lostMap.get(key) ?? 0,
      conversionRate: total > 0 ? Number(((conv / total) * 100).toFixed(1)) : 0,
    };
  });

  rows.sort((a, b) => b.total - a.total);
  return rows.slice(0, BREAKDOWN_ROW_CAP);
}

/**
 * Two-dimension breakdown for the Chart Builder's "Split by" stacked view — e.g. Lead
 * Source × Status, so a manager can see not just "how many from Meta Ads" but "how many
 * from Meta Ads are still stuck at New vs. actually Booked". Counts only (no
 * converted/lost/rate matrices per cell — that's a lot of near-empty combinations for
 * marginal value); the primary dimension keeps its own total for sorting/labeling.
 */
export async function getBreakdown2D(
  query: BreakdownQuery & { splitBy: BreakdownDimension },
  branchFilter?: { branchId: string }
) {
  const where = buildWhere(query, branchFilter);
  const field1 = DIMENSION_FIELD[query.dimension];
  const field2 = DIMENSION_FIELD[query.splitBy];

  type GroupRow = Record<string, unknown> & { _count: number };
  const raw = (await prisma.enquiry.groupBy({
    by: [field1, field2] as Prisma.EnquiryScalarFieldEnum[],
    where,
    _count: true,
  })) as unknown as GroupRow[];

  const key1Of = (row: GroupRow) => {
    const v = row[field1 as string];
    return v == null ? null : String(v);
  };
  const key2Of = (row: GroupRow) => {
    const v = row[field2 as string];
    return v == null ? null : String(v);
  };

  // Rank split values by overall volume so the legend/stack order highlights what
  // actually matters; everything past the cap folds into "Other".
  const splitTotals = new Map<string | null, number>();
  for (const row of raw) {
    const k2 = key2Of(row);
    splitTotals.set(k2, (splitTotals.get(k2) ?? 0) + row._count);
  }
  const topSplitKeys = [...splitTotals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, SPLIT_SERIES_CAP)
    .map(([k]) => k);
  const hasOverflow = splitTotals.size > topSplitKeys.length;
  const OTHER_KEY = "__other__";

  const [labelFor1, labelFor2] = await Promise.all([
    buildLabelResolver(query.dimension, raw.map(key1Of)),
    buildLabelResolver(query.splitBy, topSplitKeys),
  ]);

  const primaryTotals = new Map<string | null, number>();
  const primaryBySplit = new Map<string | null, Record<string, number>>();
  for (const row of raw) {
    const k1 = key1Of(row);
    const k2raw = key2Of(row);
    const k2 = topSplitKeys.includes(k2raw) ? k2raw : OTHER_KEY;
    primaryTotals.set(k1, (primaryTotals.get(k1) ?? 0) + row._count);
    const bucket = primaryBySplit.get(k1) ?? {};
    const bucketKey = k2 ?? "__null__";
    bucket[bucketKey] = (bucket[bucketKey] ?? 0) + row._count;
    primaryBySplit.set(k1, bucket);
  }

  const rows = [...primaryTotals.entries()]
    .map(([key, total]) => ({
      key: key ?? "__null__",
      label: labelFor1(key),
      total,
      bySplit: primaryBySplit.get(key) ?? {},
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, BREAKDOWN_ROW_CAP);

  const series = [
    ...topSplitKeys.map((k) => ({ key: k ?? "__null__", label: labelFor2(k) })),
    ...(hasOverflow ? [{ key: OTHER_KEY, label: "Other" }] : []),
  ];

  return { dimension: query.dimension, splitBy: query.splitBy, series, rows };
}

const VEHICLE_ROW_CAP = 30;
// A booking has happened once the enquiry reaches Booked or any later stage.
const BOOKED_OR_LATER: EnquiryStatus[] = ["BOOKED", "RETAIL_DONE", "RTO_DONE", "DELIVERED"];
// A car is sold once retail is done — RTO and Delivery are post-sale steps, so they count
// too. (Distinct from CONVERTED_STATUSES, which the older funnel/summary reports pin to
// RETAIL_DONE alone; changing that would move every historical conversion-rate number.)
const SOLD_STATUSES: EnquiryStatus[] = ["RETAIL_DONE", "RTO_DONE", "DELIVERED"];

/**
 * "Who is actually selling" — per showroom consultant (the salesperson on the floor):
 * how many enquiries they handled, how many they closed, their conversion rate, and the
 * model they sell most. Complements getCrPerformance, which covers the CR/telecalling
 * side (lead follow-up) rather than the showroom sale itself.
 */
export async function getConsultantPerformance(query: ReportQuery, branchFilter?: { branchId: string }) {
  return getOrCompute(
    cacheKey("getConsultantPerformance", { query, branchFilter }),
    () => computeConsultantPerformance(query, branchFilter),
    REPORT_CACHE_TTL_MS
  );
}

async function computeConsultantPerformance(query: ReportQuery, branchFilter?: { branchId: string }) {
  const where = { ...buildWhere(query, branchFilter), consultantId: { not: null } };

  const [handled, sold, soldByModel, consultants] = await Promise.all([
    prisma.enquiry.groupBy({ by: ["consultantId"], where, _count: true }),
    prisma.enquiry.groupBy({ by: ["consultantId"], where: { ...where, status: { in: SOLD_STATUSES } }, _count: true }),
    prisma.enquiry.groupBy({
      by: ["consultantId", "carModel"],
      where: { ...where, status: { in: SOLD_STATUSES } },
      _count: true,
    }),
    prisma.consultantDirectory.findMany({ select: { id: true, name: true, branchId: true } }),
  ]);

  const soldMap = new Map(sold.map((r) => [r.consultantId, r._count]));
  const nameMap = new Map(consultants.map((c) => [c.id, c]));

  // Most-sold model per consultant, plus the full per-model split for the expandable detail.
  const modelsByConsultant = new Map<string, { carModel: string; sold: number }[]>();
  for (const row of soldByModel) {
    if (!row.consultantId) continue;
    const list = modelsByConsultant.get(row.consultantId) ?? [];
    list.push({ carModel: row.carModel, sold: row._count });
    modelsByConsultant.set(row.consultantId, list);
  }
  for (const list of modelsByConsultant.values()) list.sort((a, b) => b.sold - a.sold);

  const totalSold = sold.reduce((s, r) => s + r._count, 0);

  return handled
    .filter((row) => row.consultantId)
    .map((row) => {
      const id = row.consultantId!;
      const soldCount = soldMap.get(id) ?? 0;
      const models = modelsByConsultant.get(id) ?? [];
      return {
        consultantId: id,
        consultantName: nameMap.get(id)?.name ?? "Unknown",
        branchId: nameMap.get(id)?.branchId ?? null,
        handled: row._count,
        sold: soldCount,
        conversionRate: row._count > 0 ? Number(((soldCount / row._count) * 100).toFixed(1)) : 0,
        // Share of the showroom's total sales this consultant is responsible for.
        shareOfSales: totalSold > 0 ? Number(((soldCount / totalSold) * 100).toFixed(1)) : 0,
        topModel: models[0]?.carModel ?? null,
        models,
      };
    })
    .sort((a, b) => b.sold - a.sold);
}

/**
 * Per-vehicle-model "model mix" report — the dealership-standard view of which cars
 * actually convert vs. which just attract enquiries. Joins test drive and quotation
 * activity onto each model so a CR/manager can see, e.g., "Creta gets driven a lot but
 * rarely quoted" or "Venue has the best test-drive → booking conversion".
 */
export async function getVehiclePerformance(query: ReportQuery, branchFilter?: { branchId: string }) {
  return getOrCompute(
    cacheKey("getVehiclePerformance", { query, branchFilter }),
    () => computeVehiclePerformance(query, branchFilter),
    REPORT_CACHE_TTL_MS
  );
}

async function computeVehiclePerformance(query: ReportQuery, branchFilter?: { branchId: string }) {
  const where = buildWhere(query, branchFilter);

  // Same filter fragments as buildWhere, expressed as raw SQL — see getFunnel/getTimeInStage
  // above for the precedent. Test drives and quotations are aggregated per carModel in the DB
  // (via GROUP BY + FILTER) instead of pulling every row into memory and reducing in JS.
  const branchSql = branchFilter?.branchId ? Prisma.sql`AND e."branchId" = ${branchFilter.branchId}` : Prisma.empty;
  const queryBranchSql = query.branchId ? Prisma.sql`AND e."branchId" = ${query.branchId}` : Prisma.empty;
  const dateFromSql = query.dateFrom ? Prisma.sql`AND e."createdAt" >= ${istDayStart(query.dateFrom)}` : Prisma.empty;
  const dateToSql = query.dateTo ? Prisma.sql`AND e."createdAt" <= ${istDayEnd(query.dateTo)}` : Prisma.empty;

  const [totals, booked, converted, testDriveRows, quoteRows] = await Promise.all([
    prisma.enquiry.groupBy({ by: ["carModel"], where, _count: true }),
    prisma.enquiry.groupBy({ by: ["carModel"], where: { ...where, status: { in: BOOKED_OR_LATER } }, _count: true }),
    prisma.enquiry.groupBy({ by: ["carModel"], where: { ...where, status: { in: CONVERTED_STATUSES } }, _count: true }),
    prisma.$queryRaw<
      { carModel: string; count: bigint; completed: bigint; avgRating: number | null; ratingCount: bigint }[]
    >(
      Prisma.sql`
        SELECT
          e."carModel" AS "carModel",
          COUNT(*)::bigint AS count,
          COUNT(*) FILTER (WHERE t."completedAt" IS NOT NULL)::bigint AS completed,
          AVG(t.rating) FILTER (WHERE t.rating IS NOT NULL)::float AS "avgRating",
          COUNT(t.rating) FILTER (WHERE t.rating IS NOT NULL)::bigint AS "ratingCount"
        FROM test_drive_feedback t
        JOIN enquiries e ON e.id = t."enquiryId"
        WHERE 1=1 ${branchSql} ${queryBranchSql} ${dateFromSql} ${dateToSql}
        GROUP BY e."carModel"
      `
    ),
    prisma.$queryRaw<
      { carModel: string; count: bigint; discountPctSum: number | null; discountCount: bigint }[]
    >(
      Prisma.sql`
        SELECT
          e."carModel" AS "carModel",
          COUNT(*)::bigint AS count,
          SUM(CASE WHEN q."onRoadPrice" > 0 AND q.discount > 0 THEN (q.discount / q."onRoadPrice") * 100 ELSE 0 END)::float AS "discountPctSum",
          COUNT(*) FILTER (WHERE q."onRoadPrice" > 0 AND q.discount > 0)::bigint AS "discountCount"
        FROM quotations q
        JOIN enquiries e ON e.id = q."enquiryId"
        WHERE 1=1 ${branchSql} ${queryBranchSql} ${dateFromSql} ${dateToSql}
        GROUP BY e."carModel"
      `
    ),
  ]);

  const bookedMap = new Map(booked.map((r) => [r.carModel, r._count]));
  const convertedMap = new Map(converted.map((r) => [r.carModel, r._count]));

  const testDriveStats = new Map(
    testDriveRows.map((td) => [
      td.carModel,
      {
        count: Number(td.count),
        completed: Number(td.completed),
        ratingSum: (td.avgRating ?? 0) * Number(td.ratingCount),
        ratingCount: Number(td.ratingCount),
      },
    ])
  );

  const quoteStats = new Map(
    quoteRows.map((q) => [
      q.carModel,
      {
        count: Number(q.count),
        discountPctSum: q.discountPctSum ?? 0,
        discountCount: Number(q.discountCount),
      },
    ])
  );

  // Denominator for "this model was X% of everything we sold" — the share-of-sales view a
  // manager actually asks for ("which model sells most, and how much of the mix is it").
  const totalBooked = totals.reduce((sum, row) => sum + (bookedMap.get(row.carModel) ?? 0), 0);

  const rows = totals.map((row) => {
    const model = row.carModel;
    const total = row._count;
    const bookedCount = bookedMap.get(model) ?? 0;
    const td = testDriveStats.get(model);
    const q = quoteStats.get(model);

    return {
      carModel: model,
      enquiries: total,
      booked: bookedCount,
      shareOfSales: totalBooked > 0 ? Number(((bookedCount / totalBooked) * 100).toFixed(1)) : 0,
      delivered: convertedMap.get(model) ?? 0,
      conversionRate: total > 0 ? Number(((bookedCount / total) * 100).toFixed(1)) : 0,
      testDrives: td?.count ?? 0,
      testDriveCompletionRate: td && td.count > 0 ? Number(((td.completed / td.count) * 100).toFixed(1)) : 0,
      avgTestDriveRating: td && td.ratingCount > 0 ? Number((td.ratingSum / td.ratingCount).toFixed(1)) : null,
      testDriveToBookingRate: td && td.count > 0 ? Number(((bookedCount / td.count) * 100).toFixed(1)) : 0,
      quotations: q?.count ?? 0,
      avgDiscountPercent: q && q.discountCount > 0 ? Number((q.discountPctSum / q.discountCount).toFixed(1)) : null,
    };
  });

  rows.sort((a, b) => b.enquiries - a.enquiries);
  return rows.slice(0, VEHICLE_ROW_CAP);
}

/** Flat CSV of enquiries matching the filters — for sharing outside the CRM. */
const EXPORT_COLUMNS = [
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

// Narrows to one status/loss-reason/source/CR/model "case" (e.g. the Retail row of the
// status breakdown, or one Lost Reasons bar) — deliberately applied only here, not in
// buildWhere, so none of the aggregate report queries can ever pick these params up.
function buildExportWhere(query: ReportQuery, branchFilter?: { branchId: string }) {
  const where = buildWhere(query, branchFilter);
  if (query.status) where.status = query.status as EnquiryStatus;
  if (query.lossReason) where.lossReason = query.lossReason as LossReason;
  if (query.source) where.source = query.source as Prisma.EnquiryWhereInput["source"];
  if (query.assignedCrId) where.assignedCrId = query.assignedCrId;
  if (query.consultantId) where.consultantId = query.consultantId;
  if (query.carModel) where.carModel = query.carModel;
  if (query.enquiryType) where.enquiryType = query.enquiryType as Prisma.EnquiryWhereInput["enquiryType"];
  if (query.phone) {
    where.lead = { phoneRaw: { contains: query.phone } };
  }
  if (query.sourceCategory) where.sourceCategory = query.sourceCategory as Prisma.EnquiryWhereInput["sourceCategory"];
  // Phone is the true identity key for a referrer (see getReferralPerformance); name is
  // only used as a fallback for rows predating referrerPhone.
  if (query.referrerPhone) where.referrerPhone = query.referrerPhone;
  else if (query.referrerName) where.referrerName = query.referrerName;
  // Same "overdue" definition as getSummary/getCrPerformance — still open, follow-up past
  // due, independent of the page's createdAt date range (an old lead with an overdue
  // follow-up is still overdue today even if it falls outside the selected range).
  if (query.overdue) {
    delete where.createdAt;
    where.status = { notIn: [...TERMINAL_STATUSES] };
    where.followUpDueAt = { lt: new Date() };
  }
  return where;
}

/** Small paginated JSON preview of exactly what the Excel export would contain — shown to
 * the user to confirm before they commit to downloading the file. */
export async function previewCustomers(
  query: ReportQuery,
  branchFilter: { branchId: string } | undefined,
  page: number,
  pageSize: number
) {
  const where = buildExportWhere(query, branchFilter);

  const [total, enquiries] = await Promise.all([
    prisma.enquiry.count({ where }),
    prisma.enquiry.findMany({
      where,
      include: {
        lead: { select: { name: true, phoneRaw: true, email: true } },
        branch: { select: { name: true } },
        assignedCr: { select: { name: true } },
        consultant: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  const rows = enquiries.map((e) => ({
    createdAt: e.createdAt.toISOString(),
    name: e.lead.name,
    phone: e.lead.phoneRaw,
    email: e.lead.email,
    carModel: e.carModel,
    source: e.source,
    enquiryType: e.enquiryType,
    status: e.status,
    lossReason: e.lossReason,
    branch: e.branch.name,
    assignedCr: e.assignedCr?.name ?? null,
    consultant: e.consultant?.name ?? null,
    location: e.location,
  }));

  return { rows, total, page, pageSize };
}

async function fetchExportRows(query: ReportQuery, branchFilter?: { branchId: string }) {
  const where = buildExportWhere(query, branchFilter);

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

  return enquiries.map((e) => [
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
  ]);
}

export async function exportEnquiriesCsv(query: ReportQuery, branchFilter?: { branchId: string }): Promise<string> {
  const rows = await fetchExportRows(query, branchFilter);

  const escape = (value: unknown): string => {
    const str = value == null ? "" : String(value);
    return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
  };

  const lines = rows.map((row) => row.map(escape).join(","));
  return [EXPORT_COLUMNS.join(","), ...lines].join("\n");
}

export async function exportEnquiriesXlsx(query: ReportQuery, branchFilter?: { branchId: string }): Promise<Buffer> {
  const rows = await fetchExportRows(query, branchFilter);

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Customer Details");
  sheet.columns = EXPORT_COLUMNS.map((header) => ({ header, key: header, width: 20 }));
  sheet.getRow(1).font = { bold: true };
  for (const row of rows) sheet.addRow(row);

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
