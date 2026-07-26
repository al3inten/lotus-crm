import { EnquiryStatus, LeadSource, EnquiryCategory, Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { ConflictError, NotFoundError } from "../../lib/errors";
import { notifyRepeatEnquiry } from "../notifications/repeatEnquiry.service";
import { normalizePhone } from "./phone.util";
import { getNextCrForBranch } from "../enquiries/routing.service";
import { DIGITAL_SOURCES, TRANSACTION_OPTIONS } from "../../config/constants";
import { CreateEnquiryInput, LeadListQuery, CustomerListQuery } from "./leads.schema";
import { triggerAutoCallForEnquiry } from "../voice/voice.service";

// A lead with an enquiry in any of these states is mid-journey; new contacts from any
// source attach to that journey instead of opening a parallel one.
const TERMINAL_STATUSES: EnquiryStatus[] = ["RETAIL_DONE", "CLOSED"];

/**
 * Phone number is the identity key. Every inbound contact records a LeadTouch.
 * - No active enquiry (first contact, or all past journeys ended in a terminal status):
 *   a new Enquiry is created — a genuinely new buying journey.
 * - Active enquiry exists: NO new enquiry. The touch attaches to the active journey,
 *   so the same person walking in today and submitting a Meta form tomorrow stays ONE
 *   enquiry with full contact history — never a duplicate row.
 *
 * `allowAttach` is for unattended ingestion (Meta/WhatsApp webhooks, CSV import, social
 * inbox), where there's no operator to make a call and dropping the contact would lose
 * it. Operator-facing intake leaves it off, so a known phone number hard-fails until the
 * operator ticks "Force new enquiry" rather than silently folding into another enquiry.
 */
export async function createOrAttachEnquiry(
  input: CreateEnquiryInput,
  createdById: string,
  { allowAttach = false }: { allowAttach?: boolean } = {}
) {
  const phoneNormalized = normalizePhone(input.phone);

  const result = await prisma.$transaction(async (tx) => {
    const branch = await tx.branch.findUnique({ where: { id: input.branchId } });
    if (!branch) throw new NotFoundError("Branch not found");

    const existingLead = await tx.lead.findUnique({ where: { phoneNormalized } });

    // A repeat contact never overwrites a profile field the CRM already knows, but it must
    // still fill in the blanks: pincode, area, DOB and the rest live only on the Lead (no
    // Enquiry column holds them), so leaving `update` empty silently threw away everything
    // the CR typed into Customer Details for a returning customer — and left the next
    // intake with nothing to pre-fill.
    const profileGapFill = existingLead
      ? {
          email: existingLead.email ?? input.email,
          alternateMobile: existingLead.alternateMobile ?? input.alternateMobile,
          dob: existingLead.dob ?? (input.dob ? new Date(input.dob) : undefined),
          profession: existingLead.profession ?? input.profession,
          pincode: existingLead.pincode ?? input.pincode,
          area: existingLead.area ?? input.area,
          address: existingLead.address ?? input.address,
        }
      : {};

    const lead = await tx.lead.upsert({
      where: { phoneNormalized },
      update: profileGapFill,
      create: {
        name: input.name,
        phoneRaw: input.phone,
        phoneNormalized,
        email: input.email,
        alternateMobile: input.alternateMobile,
        dob: input.dob ? new Date(input.dob) : undefined,
        profession: input.profession,
        pincode: input.pincode,
        area: input.area,
        address: input.address,
      },
    });

    const priorEnquiryCount = await tx.enquiry.count({ where: { leadId: lead.id } });
    const isRepeatLead = priorEnquiryCount > 0;

    const activeEnquiry = await tx.enquiry.findFirst({
      where: { leadId: lead.id, status: { notIn: TERMINAL_STATUSES } },
      orderBy: { createdAt: "desc" },
    });

    // A known phone number never silently opens a second enquiry, and it never silently
    // folds into an existing one either: the save is blocked outright until the operator
    // confirms via `forceNew`, so a genuine repeat buyer is still possible but never
    // accidental.
    if (activeEnquiry && !input.forceNew && allowAttach) {
      await tx.leadTouch.create({
        data: {
          leadId: lead.id,
          enquiryId: activeEnquiry.id,
          source: input.source,
          note: `Repeat contact while enquiry active — interested in ${input.carModel}`,
        },
      });

      await tx.enquiryStatusHistory.create({
        data: {
          enquiryId: activeEnquiry.id,
          fromStatus: activeEnquiry.status,
          toStatus: activeEnquiry.status,
          changedById: createdById,
          note: `New ${input.source.replaceAll("_", " ")} contact from this lead (car: ${input.carModel}) — attached to this enquiry`,
        },
      });

      return {
        lead,
        enquiry: activeEnquiry,
        isRepeatLead: true,
        priorEnquiryCount,
        attachedToExisting: true,
      };
    }

    if (isRepeatLead && !input.forceNew) {
      throw new ConflictError(
        activeEnquiry
          ? `This customer already exists (${lead.name}) with an active enquiry in the ` +
            `${activeEnquiry.status.replaceAll("_", " ")} stage. Tick "Force new enquiry" to start another one.`
          : `This customer already exists (${lead.name}) with ${priorEnquiryCount} previous ` +
            `enquiry(s), all closed. Tick "Force new enquiry" to start a new one.`
      );
    }

    let assignedCrId: string | null = null;
    if (input.assignedCrId) {
      assignedCrId = input.assignedCrId;
    } else if (DIGITAL_SOURCES.includes(input.source) && branch.autoAssignEnabled) {
      assignedCrId = await getNextCrForBranch(tx, input.branchId);
    }
    // Manual sources (WALK_IN/MANUAL_OTHER/REFERRAL) without an explicit assignedCrId
    // stay unassigned for a human to claim — this is intentional, not an oversight.

    const enquiry = await tx.enquiry.create({
      data: {
        leadId: lead.id,
        branchId: input.branchId,
        carModel: input.carModel,
        source: input.source,
        enquiryType: input.enquiryType,
        location: input.location,
        assignedCrId,
        consultantId: input.consultantId || undefined,
        status: "NEW",
        department: input.department,
        sourceCategory: input.sourceCategory,
        subsource: input.subsource,
        variant: input.variant,
        enquiryCategory: input.enquiryCategory,
        financeRequired: input.financeRequired,
        financeRemarks: input.financeRemarks,
        appointmentScheduled: input.appointmentScheduled,
        appointmentAt: input.appointmentAt ? new Date(input.appointmentAt) : undefined,
        testDriveInterested: input.testDriveInterested,
        testDriveCount: input.testDriveCount,
        exchangeCarModel: input.exchangeCarModel,
        exchangeCarYear: input.exchangeCarYear,
        exchangeCarKms: input.exchangeCarKms,
        exchangeCarOwners: input.exchangeCarOwners,
        exchangeCarRegNumber: input.exchangeCarRegNumber,
        calledDate: input.calledDate ? new Date(input.calledDate) : undefined,
        remarks: input.remarks,
      },
    });

    await tx.leadTouch.create({
      data: { leadId: lead.id, enquiryId: enquiry.id, source: input.source },
    });

    await tx.enquiryStatusHistory.create({
      data: {
        enquiryId: enquiry.id,
        fromStatus: null,
        toStatus: "NEW",
        changedById: createdById,
      },
    });

    return { lead, enquiry, isRepeatLead, priorEnquiryCount, attachedToExisting: false };
  }, TRANSACTION_OPTIONS);

  // A repeat contact on a live enquiry always alerts its CR and the branch manager(s),
  // rather than relying on staff remembering to press "Notify CR & manager". Fired after
  // the transaction commits so a notification failure can't roll back the enquiry.
  if (result.attachedToExisting) {
    void notifyRepeatEnquiry(result.enquiry.id, createdById);
  }

  // Voice AI auto-dial: only for genuinely new enquiries from digital sources — never for
  // touches attached to an already-active enquiry (that lead has already been contacted).
  // Fired after the transaction commits since it makes an outbound HTTP call to Callmatic.
  if (!result.attachedToExisting && DIGITAL_SOURCES.includes(input.source)) {
    void triggerAutoCallForEnquiry(result.enquiry.id);
  }

  return result;
}

export async function listEnquiries(query: LeadListQuery, branchFilter?: { branchId: string }) {
  const where: Prisma.EnquiryWhereInput = {};

  if (branchFilter) where.branchId = branchFilter.branchId;
  if (query.branchId) where.branchId = query.branchId;
  if (query.status) where.status = query.status as EnquiryStatus;
  if (query.source) where.source = query.source as LeadSource;
  if (query.enquiryCategory) where.enquiryCategory = query.enquiryCategory as EnquiryCategory;
  if (query.assignedCrId) where.assignedCrId = query.assignedCrId;

  if (query.dateFrom || query.dateTo) {
    where.createdAt = {
      ...(query.dateFrom ? { gte: new Date(query.dateFrom) } : {}),
      ...(query.dateTo ? { lte: new Date(query.dateTo) } : {}),
    };
  }

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

  // One row per PERSON, paginated by lead (not by enquiry) so the same phone number
  // never shows as duplicate rows. Prisma's `distinct` dedupes in memory AFTER skip/take,
  // which breaks page boundaries — so paginate via groupBy (DB-level) first, then fetch
  // each page-lead's latest enquiry.
  const [pageGroups, allGroups] = await Promise.all([
    prisma.enquiry.groupBy({
      by: ["leadId"],
      where,
      _max: { createdAt: true },
      orderBy: { _max: { createdAt: "desc" } },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.enquiry.groupBy({ by: ["leadId"], where }),
  ]);

  const pageLeadIds = pageGroups.map((g) => g.leadId);
  const enquiriesForPage = await prisma.enquiry.findMany({
    where: { ...where, leadId: { in: pageLeadIds } },
    include: {
      lead: { include: { _count: { select: { enquiries: true, touches: true } } } },
      // The list UI only renders branch id + name — selecting just those (instead of the
      // whole row) keeps the payload small across a full page of enquiries.
      branch: { select: { id: true, name: true } },
      assignedCr: { select: { id: true, name: true } },
      consultant: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Keep only each lead's latest matching enquiry, in the groupBy's newest-first order.
  const latestByLead = new Map<string, (typeof enquiriesForPage)[number]>();
  for (const enquiry of enquiriesForPage) {
    if (!latestByLead.has(enquiry.leadId)) latestByLead.set(enquiry.leadId, enquiry);
  }
  const items = pageLeadIds
    .map((leadId) => latestByLead.get(leadId))
    .filter((e): e is NonNullable<typeof e> => !!e);

  return { items, total: allGroups.length, page: query.page, pageSize: query.pageSize };
}

/**
 * Customer directory — one row per PERSON (Lead, unique by phone), with a tier
 * auto-derived from purchases (RETAIL_DONE = bought a car). No stored tier column:
 * it's always computed so it can never drift from reality.
 *   Diamond = repeat buyer (2+) · Gold = owns a car (1) · Prospect = not yet bought.
 * Returns `stats` (tier counts for the search/branch filter, ignoring pagination
 * and the tier filter) so the UI can show KPI tiles and filter pills.
 */
export async function listCustomers(query: CustomerListQuery, branchFilter?: { branchId: string }) {
  const leadWhere: Prisma.LeadWhereInput = {};
  if (query.search) {
    leadWhere.OR = [
      { name: { contains: query.search, mode: "insensitive" } },
      { phoneNormalized: { contains: query.search } },
    ];
  }
  const branchId = branchFilter?.branchId ?? query.branchId;
  if (branchId) leadWhere.enquiries = { some: { branchId } };

  // Purchases per matching customer → tiers + KPI stats. groupBy is already DB-side
  // aggregation (one row per distinct purchaser, not per enquiry), so this stays bounded
  // by the number of actual buyers rather than total enquiry volume. We still need the
  // per-lead id lists below (diamondIds/goldIds) because the tier filter narrows a
  // paginated Lead.findMany, and Prisma's typed where API has no count-threshold relation
  // filter — an id list is the only way to express ">=2 purchases" without hand-rolling
  // the whole paginated query as raw SQL, which risks behavior drift on the dynamic
  // search/branch filters above.
  const purchaseGroups = await prisma.enquiry.groupBy({
    by: ["leadId"],
    where: { status: "RETAIL_DONE", lead: leadWhere },
    _count: true,
  });
  const purchaseCount = new Map<string, number>(purchaseGroups.map((g) => [g.leadId, g._count]));
  const diamondIds = purchaseGroups.filter((g) => g._count >= 2).map((g) => g.leadId);
  const goldIds = purchaseGroups.filter((g) => g._count === 1).map((g) => g.leadId);
  const ownerIds = [...diamondIds, ...goldIds];

  // Stats counts computed from the same DB-aggregated groups above (array lengths, not a
  // second full-table scan) plus a single DB-side count for the total — no row-by-row
  // reduction over unbounded data.
  const totalAll = await prisma.lead.count({ where: leadWhere });
  const stats = {
    total: totalAll,
    diamond: diamondIds.length,
    gold: goldIds.length,
    prospect: totalAll - ownerIds.length,
  };

  // Tier filter narrows the paginated result (stats stay full-set).
  let where: Prisma.LeadWhereInput = leadWhere;
  if (query.tier === "DIAMOND") where = { ...leadWhere, id: { in: diamondIds } };
  else if (query.tier === "GOLD") where = { ...leadWhere, id: { in: goldIds } };
  else if (query.tier === "PROSPECT") where = { ...leadWhere, id: { notIn: ownerIds } };

  const [leads, total] = await Promise.all([
    prisma.lead.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      include: {
        _count: { select: { enquiries: true, touches: true } },
        enquiries: {
          orderBy: { createdAt: "desc" },
          select: { id: true, status: true, carModel: true, createdAt: true, branch: { select: { name: true } } },
        },
      },
    }),
    prisma.lead.count({ where }),
  ]);

  const items = leads.map((lead) => {
    const purchases = lead.enquiries.filter((e) => e.status === "RETAIL_DONE");
    const ownedVehicles = Array.from(new Set(purchases.map((e) => e.carModel)));
    const pc = purchaseCount.get(lead.id) ?? purchases.length;
    const tier: "DIAMOND" | "GOLD" | "PROSPECT" = pc >= 2 ? "DIAMOND" : pc === 1 ? "GOLD" : "PROSPECT";

    const latest = lead.enquiries[0];
    return {
      id: lead.id,
      name: lead.name,
      phoneRaw: lead.phoneRaw,
      email: lead.email,
      profession: lead.profession,
      createdAt: lead.createdAt,
      tier,
      enquiryCount: lead._count.enquiries,
      touchCount: lead._count.touches,
      purchaseCount: purchases.length,
      ownedVehicles,
      latestEnquiryId: latest?.id ?? null,
      latestStatus: latest?.status ?? null,
      latestCarModel: latest?.carModel ?? null,
      lastActivityAt: (latest?.createdAt ?? lead.updatedAt).toISOString(),
      branches: Array.from(new Set(lead.enquiries.map((e) => e.branch.name))),
    };
  });

  return { items, total, page: query.page, pageSize: query.pageSize, stats };
}

export async function getLeadWithHistory(leadId: string) {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: {
      enquiries: {
        include: {
          branch: true,
          assignedCr: { select: { id: true, name: true } },
          consultant: { select: { id: true, name: true } },
          statusHistory: { orderBy: { createdAt: "asc" } },
        },
        orderBy: { createdAt: "desc" },
      },
      touches: { orderBy: { createdAt: "desc" } },
      conversations: {
        select: {
          id: true,
          channel: true,
          _count: { select: { messages: true } },
        },
      },
    },
  });
  if (!lead) throw new NotFoundError("Lead not found");

  // Contact summary: "walked in twice, 1 Meta form, 12 WhatsApp messages" at a glance.
  const touchesBySource: Record<string, number> = {};
  for (const touch of lead.touches) {
    touchesBySource[touch.source] = (touchesBySource[touch.source] ?? 0) + 1;
  }
  const messagesByChannel: Record<string, number> = {};
  for (const conversation of lead.conversations) {
    messagesByChannel[conversation.channel] =
      (messagesByChannel[conversation.channel] ?? 0) + conversation._count.messages;
  }

  return { ...lead, touchesBySource, messagesByChannel };
}

// ---------- DRAFTS ----------
// A CR's in-progress offline intake, kept out of the Enquiry table entirely (see LeadDraft
// comment in schema.prisma) so partial data never touches routing/reporting logic.

export async function listDrafts(createdById: string) {
  return prisma.leadDraft.findMany({ where: { createdById }, orderBy: { updatedAt: "desc" } });
}

export async function saveDraft(createdById: string, branchId: string | undefined, data: Prisma.InputJsonValue) {
  return prisma.leadDraft.create({ data: { createdById, branchId, data } });
}

export async function updateDraft(id: string, createdById: string, data: Prisma.InputJsonValue) {
  const draft = await prisma.leadDraft.findUnique({ where: { id } });
  if (!draft || draft.createdById !== createdById) throw new NotFoundError("Draft not found");
  return prisma.leadDraft.update({ where: { id }, data: { data } });
}

export async function deleteDraft(id: string, createdById: string) {
  const draft = await prisma.leadDraft.findUnique({ where: { id } });
  if (!draft || draft.createdById !== createdById) throw new NotFoundError("Draft not found");
  await prisma.leadDraft.delete({ where: { id } });
}

export async function lookupLeadByPhone(phone: string) {
  const phoneNormalized = normalizePhone(phone);
  if (!phoneNormalized) return null;

  const lead = await prisma.lead.findUnique({
    where: { phoneNormalized },
    include: {
      enquiries: {
        where: { status: { notIn: TERMINAL_STATUSES } },
        select: { id: true, status: true },
        take: 1,
      },
      // Total (not just active) — the intake form blocks the save for any lead that
      // already has an enquiry, matching the createWalkInLead rule above.
      _count: { select: { enquiries: true } },
    },
  });

  if (!lead) return null;

  // City and department live on the Enquiry, not the Lead — the most recent enquiry of
  // any status carries the last such details we heard from this customer, so the intake
  // form can pre-fill them instead of making the CR retype what the CRM already knows.
  const lastEnquiry = await prisma.enquiry.findFirst({
    where: { leadId: lead.id },
    orderBy: { createdAt: "desc" },
    select: { location: true, department: true },
  });

  return {
    leadId: lead.id,
    name: lead.name,
    email: lead.email,
    alternateMobile: lead.alternateMobile,
    dob: lead.dob,
    profession: lead.profession,
    pincode: lead.pincode,
    area: lead.area,
    address: lead.address,
    location: lastEnquiry?.location ?? null,
    department: lastEnquiry?.department ?? null,
    enquiryCount: lead._count.enquiries,
    hasActiveEnquiry: lead.enquiries.length > 0,
    activeEnquiryId: lead.enquiries[0]?.id ?? null,
    activeEnquiryStatus: lead.enquiries[0]?.status ?? null,
  };
}

/**
 * Follow-ups due (today or overdue) for the dashboard. Scope depends on the viewer:
 *  - CR_TEAM  → only the enquiries assigned to them.
 *  - BRANCH_MANAGER → every open enquiry in their branch.
 *  - ADMIN / SUPER_ADMIN → all branches.
 * This is why a manager/admin dashboard previously showed no follow-ups: the old query
 * always filtered by assignedCrId, which admins never have.
 */
export async function getReminders(user: { id: string; role: string; branchId: string | null }) {
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  const where: Prisma.EnquiryWhereInput = {
    status: { notIn: TERMINAL_STATUSES },
    followUpDueAt: { lte: endOfToday },
  };
  if (user.role === "CR_TEAM" || user.role === "CONSULTANT") {
    where.assignedCrId = user.id;
  } else if (user.role === "BRANCH_MANAGER" && user.branchId) {
    where.branchId = user.branchId;
  }
  // ADMIN / SUPER_ADMIN: no extra scope — all branches.

  return prisma.enquiry.findMany({
    where,
    include: {
      lead: { select: { name: true, phoneRaw: true } },
      assignedCr: { select: { id: true, name: true } },
    },
    orderBy: { followUpDueAt: "asc" },
    take: 50,
  });
}
