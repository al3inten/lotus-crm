import { Prisma, EnquiryStatus, LeadSource } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { MisReportQuery } from "./reports.schema";
import { cacheKey, getOrCompute } from "../../lib/simpleCache";
import { istDayStart, istDayEnd } from "../../lib/istDate";
import { TERMINAL_STATUSES } from "../../config/constants";

const REPORT_CACHE_TTL_MS = 60_000;

// A booking counts as "lost" (excluded from the pending Booking Balance) once the enquiry
// is marked LOST/CLOSED — a cancelled booking shouldn't still show as "pending retail".
const LOST_STATUSES: EnquiryStatus[] = ["LOST", "CLOSED"];

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function monthRange(monthKey: string) {
  const [y, m] = monthKey.split("-").map(Number);
  const lastDay = new Date(y, m, 0).getDate();
  return { from: istDayStart(`${monthKey}-01`), to: istDayEnd(`${monthKey}-${pad2(lastDay)}`) };
}

function shiftMonth(monthKey: string, delta: number): string {
  const [y, m] = monthKey.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}`;
}

/** Resolves the report's target month (defaults to the current one) into current/LY/LM windows. */
function getMonthBounds(query: MisReportQuery) {
  const now = new Date();
  const monthKey = query.month ?? `${now.getFullYear()}-${pad2(now.getMonth() + 1)}`;
  const lyKey = `${Number(monthKey.slice(0, 4)) - 1}-${monthKey.slice(5)}`;
  const lmKey = shiftMonth(monthKey, -1);
  return {
    monthKey,
    lyKey,
    current: monthRange(monthKey),
    ly: monthRange(lyKey),
    lm: monthRange(lmKey),
  };
}

function growthPercent(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return Number((((current - previous) / previous) * 100).toFixed(1));
}

function pct(numerator: number, denominator: number): number {
  return denominator > 0 ? Number(((numerator / denominator) * 100).toFixed(1)) : 0;
}

function branchWhere(query: MisReportQuery, branchFilter?: { branchId: string }): Prisma.EnquiryWhereInput {
  const where: Prisma.EnquiryWhereInput = {};
  if (branchFilter) where.branchId = branchFilter.branchId;
  if (query.branchId) where.branchId = query.branchId;
  return where;
}

interface PeriodCounts {
  cy: number;
  ly: number;
  lm: number;
}

function withGrowth(counts: PeriodCounts) {
  return { ...counts, growthLY: growthPercent(counts.cy, counts.ly), growthLM: growthPercent(counts.cy, counts.lm) };
}

async function groupByPeriods<TKey extends string>(
  dimension: "carModel" | "source",
  dateField: "createdAt" | "bookedAt" | "retailDoneAt",
  where: Prisma.EnquiryWhereInput,
  bounds: ReturnType<typeof getMonthBounds>
): Promise<Map<TKey, PeriodCounts>> {
  const [cy, ly, lm] = await Promise.all([
    prisma.enquiry.groupBy({
      by: [dimension],
      where: { ...where, [dateField]: { gte: bounds.current.from, lte: bounds.current.to } },
      _count: true,
    }),
    prisma.enquiry.groupBy({
      by: [dimension],
      where: { ...where, [dateField]: { gte: bounds.ly.from, lte: bounds.ly.to } },
      _count: true,
    }),
    prisma.enquiry.groupBy({
      by: [dimension],
      where: { ...where, [dateField]: { gte: bounds.lm.from, lte: bounds.lm.to } },
      _count: true,
    }),
  ]);

  const map = new Map<TKey, PeriodCounts>();
  const bump = (rows: { [k: string]: unknown; _count: number }[], key: "cy" | "ly" | "lm") => {
    for (const row of rows) {
      const k = row[dimension] as TKey;
      const entry = map.get(k) ?? { cy: 0, ly: 0, lm: 0 };
      entry[key] = row._count;
      map.set(k, entry);
    }
  };
  bump(cy as any, "cy");
  bump(ly as any, "ly");
  bump(lm as any, "lm");
  return map;
}

/**
 * Model-wise MIS report — enquiries/bookings/retails per vehicle model this month vs the
 * same month last year and last month, plus booking target/achievement, stock-in-hand
 * (both admin-entered, see VehicleModelTarget), pending booking balance and active pipeline.
 */
export async function getModelWiseReport(query: MisReportQuery, branchFilter?: { branchId: string }) {
  return getOrCompute(
    cacheKey("getModelWiseReport", { query, branchFilter }),
    () => computeModelWiseReport(query, branchFilter),
    REPORT_CACHE_TTL_MS
  );
}

async function computeModelWiseReport(query: MisReportQuery, branchFilter?: { branchId: string }) {
  const bounds = getMonthBounds(query);
  const where = branchWhere(query, branchFilter);

  const branchIdForTargets = query.branchId ?? branchFilter?.branchId;

  const [enqByModel, bookingByModel, retailByModel, bbRows, activeRows, models, targets, targetsLY] = await Promise.all([
    groupByPeriods<string>("carModel", "createdAt", where, bounds),
    groupByPeriods<string>("carModel", "bookedAt", where, bounds),
    groupByPeriods<string>("carModel", "retailDoneAt", where, bounds),
    prisma.enquiry.groupBy({
      by: ["carModel"],
      where: { ...where, bookedAt: { not: null }, retailDoneAt: null, status: { notIn: LOST_STATUSES } },
      _count: true,
    }),
    prisma.enquiry.groupBy({
      by: ["carModel"],
      where: { ...where, status: { notIn: TERMINAL_STATUSES } },
      _count: true,
    }),
    prisma.vehicleModel.findMany({ where: { isActive: true }, select: { id: true, name: true } }),
    // No branchId filter here on purpose: with "All Branches" selected, targets are still
    // set per-branch (VehicleModelTarget has no branch-less row), so omitting the filter
    // and summing below is what makes the All-Branches view show the combined figure
    // instead of 0 — filtering by an undefined branchId would match nothing.
    prisma.vehicleModelTarget.findMany({
      where: { month: bounds.monthKey, ...(branchIdForTargets ? { branchId: branchIdForTargets } : {}) },
    }),
    // Same-month-last-year targets, so "Bkg Tgt" and "Achv%" get a YoY comparison just
    // like every other column in this report (enquiries/booking/retail already have LY).
    prisma.vehicleModelTarget.findMany({
      where: { month: bounds.lyKey, ...(branchIdForTargets ? { branchId: branchIdForTargets } : {}) },
    }),
  ]);

  const bbMap = new Map(bbRows.map((r) => [r.carModel, r._count]));
  const activeMap = new Map(activeRows.map((r) => [r.carModel, r._count]));
  const modelNameById = new Map(models.map((m) => [m.id, m.name]));

  // Multiple branches can each have a target row for the same model/month — sum them so
  // "All Branches" reflects every branch's target/stock combined, not just one row.
  function sumTargetsByModelName(rows: { modelId: string; bookingTarget: number; stock: number }[]) {
    const map = new Map<string, { bookingTarget: number; stock: number }>();
    for (const t of rows) {
      const name = modelNameById.get(t.modelId) ?? t.modelId;
      const entry = map.get(name) ?? { bookingTarget: 0, stock: 0 };
      entry.bookingTarget += t.bookingTarget;
      entry.stock += t.stock;
      map.set(name, entry);
    }
    return map;
  }
  const targetByModelName = sumTargetsByModelName(targets);
  const targetByModelNameLY = sumTargetsByModelName(targetsLY);

  const modelNames = new Set<string>([
    ...enqByModel.keys(),
    ...bookingByModel.keys(),
    ...retailByModel.keys(),
    ...bbMap.keys(),
    ...activeMap.keys(),
    ...models.map((m) => m.name),
  ]);

  const rows = Array.from(modelNames).map((carModel) => {
    const enq = withGrowth(enqByModel.get(carModel) ?? { cy: 0, ly: 0, lm: 0 });
    const booking = withGrowth(bookingByModel.get(carModel) ?? { cy: 0, ly: 0, lm: 0 });
    const retail = withGrowth(retailByModel.get(carModel) ?? { cy: 0, ly: 0, lm: 0 });
    const target = targetByModelName.get(carModel);
    const bookingTarget = target?.bookingTarget ?? 0;
    const targetLY = targetByModelNameLY.get(carModel);
    const bookingTargetLY = targetLY?.bookingTarget ?? 0;

    return {
      carModel,
      enquiries: enq,
      bookingTarget,
      bookingTargetLY,
      booking,
      achievementPercent: pct(booking.cy, bookingTarget),
      achievementPercentLY: pct(booking.ly, bookingTargetLY),
      retail,
      enquiryToBooking: pct(booking.cy, enq.cy),
      enquiryToRetail: pct(retail.cy, enq.cy),
      bookingToRetail: pct(retail.cy, booking.cy),
      stock: target?.stock ?? 0,
      bookingBalance: bbMap.get(carModel) ?? 0,
      activeEnquiries: activeMap.get(carModel) ?? 0,
    };
  });

  rows.sort((a, b) => b.enquiries.cy - a.enquiries.cy);

  const total = rows.reduce(
    (acc, r) => {
      acc.enquiries.cy += r.enquiries.cy;
      acc.enquiries.ly += r.enquiries.ly;
      acc.enquiries.lm += r.enquiries.lm;
      acc.bookingTarget += r.bookingTarget;
      acc.bookingTargetLY += r.bookingTargetLY;
      acc.booking.cy += r.booking.cy;
      acc.booking.ly += r.booking.ly;
      acc.booking.lm += r.booking.lm;
      acc.retail.cy += r.retail.cy;
      acc.retail.ly += r.retail.ly;
      acc.retail.lm += r.retail.lm;
      acc.stock += r.stock;
      acc.bookingBalance += r.bookingBalance;
      acc.activeEnquiries += r.activeEnquiries;
      return acc;
    },
    {
      enquiries: { cy: 0, ly: 0, lm: 0 },
      bookingTarget: 0,
      bookingTargetLY: 0,
      booking: { cy: 0, ly: 0, lm: 0 },
      retail: { cy: 0, ly: 0, lm: 0 },
      stock: 0,
      bookingBalance: 0,
      activeEnquiries: 0,
    }
  );

  return {
    month: bounds.monthKey,
    rows,
    total: {
      carModel: "Total",
      enquiries: { ...total.enquiries, growthLY: growthPercent(total.enquiries.cy, total.enquiries.ly), growthLM: growthPercent(total.enquiries.cy, total.enquiries.lm) },
      bookingTarget: total.bookingTarget,
      bookingTargetLY: total.bookingTargetLY,
      booking: { ...total.booking, growthLY: growthPercent(total.booking.cy, total.booking.ly), growthLM: growthPercent(total.booking.cy, total.booking.lm) },
      achievementPercent: pct(total.booking.cy, total.bookingTarget),
      achievementPercentLY: pct(total.booking.ly, total.bookingTargetLY),
      retail: { ...total.retail, growthLY: growthPercent(total.retail.cy, total.retail.ly), growthLM: growthPercent(total.retail.cy, total.retail.lm) },
      enquiryToBooking: pct(total.booking.cy, total.enquiries.cy),
      enquiryToRetail: pct(total.retail.cy, total.enquiries.cy),
      bookingToRetail: pct(total.retail.cy, total.booking.cy),
      stock: total.stock,
      bookingBalance: total.bookingBalance,
      activeEnquiries: total.activeEnquiries,
    },
  };
}

/**
 * Source-wise MIS report — same shape as Model-wise but grouped by the CRM's real lead
 * `source`, plus a Test Drive column pair (completed drives this month + TD/Enq rate).
 */
export async function getSourceWiseReport(query: MisReportQuery, branchFilter?: { branchId: string }) {
  return getOrCompute(
    cacheKey("getSourceWiseReport", { query, branchFilter }),
    () => computeSourceWiseReport(query, branchFilter),
    REPORT_CACHE_TTL_MS
  );
}

async function computeSourceWiseReport(query: MisReportQuery, branchFilter?: { branchId: string }) {
  const bounds = getMonthBounds(query);
  const where = branchWhere(query, branchFilter);

  const branchSql = branchFilter?.branchId ? Prisma.sql`AND e."branchId" = ${branchFilter.branchId}` : Prisma.empty;
  const queryBranchSql = query.branchId ? Prisma.sql`AND e."branchId" = ${query.branchId}` : Prisma.empty;

  const [enqBySource, bookingBySource, retailBySource, tdRows] = await Promise.all([
    groupByPeriods<LeadSource>("source", "createdAt", where, bounds),
    groupByPeriods<LeadSource>("source", "bookedAt", where, bounds),
    groupByPeriods<LeadSource>("source", "retailDoneAt", where, bounds),
    prisma.$queryRaw<{ source: LeadSource; count: bigint }[]>(
      Prisma.sql`
        SELECT e."source" AS source, COUNT(*)::bigint AS count
        FROM test_drive_feedback t
        JOIN enquiries e ON e.id = t."enquiryId"
        WHERE t."completedAt" >= ${bounds.current.from} AND t."completedAt" <= ${bounds.current.to}
          ${branchSql} ${queryBranchSql}
        GROUP BY e."source"
      `
    ),
  ]);

  const tdMap = new Map(tdRows.map((r) => [r.source, Number(r.count)]));

  const sources = new Set<LeadSource>([...enqBySource.keys(), ...bookingBySource.keys(), ...retailBySource.keys(), ...tdMap.keys()]);

  const rows = Array.from(sources).map((source) => {
    const enq = withGrowth(enqBySource.get(source) ?? { cy: 0, ly: 0, lm: 0 });
    const booking = withGrowth(bookingBySource.get(source) ?? { cy: 0, ly: 0, lm: 0 });
    const retail = withGrowth(retailBySource.get(source) ?? { cy: 0, ly: 0, lm: 0 });
    const testDrives = tdMap.get(source) ?? 0;

    // "Change" = this month's conversion rate minus the same rate computed a year ago —
    // the sheet's CY/Change column pair for E-B/E-R/B-R, not a duplicate of the CY value.
    const enquiryToBookingLY = pct(booking.ly, enq.ly);
    const enquiryToRetailLY = pct(retail.ly, enq.ly);
    const bookingToRetailLY = pct(retail.ly, booking.ly);
    const enquiryToBooking = pct(booking.cy, enq.cy);
    const enquiryToRetail = pct(retail.cy, enq.cy);
    const bookingToRetail = pct(retail.cy, booking.cy);

    return {
      source,
      enquiries: enq,
      booking,
      retail,
      testDrives,
      testDriveRate: pct(testDrives, enq.cy),
      enquiryToBooking,
      enquiryToRetail,
      bookingToRetail,
      enquiryToBookingChange: Number((enquiryToBooking - enquiryToBookingLY).toFixed(1)),
      enquiryToRetailChange: Number((enquiryToRetail - enquiryToRetailLY).toFixed(1)),
      bookingToRetailChange: Number((bookingToRetail - bookingToRetailLY).toFixed(1)),
    };
  });

  rows.sort((a, b) => b.enquiries.cy - a.enquiries.cy);

  const total = rows.reduce(
    (acc, r) => {
      acc.enquiries.cy += r.enquiries.cy;
      acc.enquiries.ly += r.enquiries.ly;
      acc.enquiries.lm += r.enquiries.lm;
      acc.booking.cy += r.booking.cy;
      acc.booking.ly += r.booking.ly;
      acc.booking.lm += r.booking.lm;
      acc.retail.cy += r.retail.cy;
      acc.retail.ly += r.retail.ly;
      acc.retail.lm += r.retail.lm;
      acc.testDrives += r.testDrives;
      return acc;
    },
    { enquiries: { cy: 0, ly: 0, lm: 0 }, booking: { cy: 0, ly: 0, lm: 0 }, retail: { cy: 0, ly: 0, lm: 0 }, testDrives: 0 }
  );

  return {
    month: bounds.monthKey,
    rows,
    total: {
      source: "Total" as const,
      enquiries: { ...total.enquiries, growthLY: growthPercent(total.enquiries.cy, total.enquiries.ly), growthLM: growthPercent(total.enquiries.cy, total.enquiries.lm) },
      booking: { ...total.booking, growthLY: growthPercent(total.booking.cy, total.booking.ly), growthLM: growthPercent(total.booking.cy, total.booking.lm) },
      retail: { ...total.retail, growthLY: growthPercent(total.retail.cy, total.retail.ly), growthLM: growthPercent(total.retail.cy, total.retail.lm) },
      testDrives: total.testDrives,
      testDriveRate: pct(total.testDrives, total.enquiries.cy),
      enquiryToBooking: pct(total.booking.cy, total.enquiries.cy),
      enquiryToRetail: pct(total.retail.cy, total.enquiries.cy),
      bookingToRetail: pct(total.retail.cy, total.booking.cy),
      enquiryToBookingChange: Number((pct(total.booking.cy, total.enquiries.cy) - pct(total.booking.ly, total.enquiries.ly)).toFixed(1)),
      enquiryToRetailChange: Number((pct(total.retail.cy, total.enquiries.cy) - pct(total.retail.ly, total.enquiries.ly)).toFixed(1)),
      bookingToRetailChange: Number((pct(total.retail.cy, total.booking.cy) - pct(total.retail.ly, total.booking.ly)).toFixed(1)),
    },
  };
}
