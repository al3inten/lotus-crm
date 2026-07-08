import { EnquiryStatus, LeadSource, Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { NotFoundError } from "../../lib/errors";
import { normalizePhone } from "./phone.util";
import { getNextCrForBranch } from "../enquiries/routing.service";
import { DIGITAL_SOURCES, TRANSACTION_OPTIONS } from "../../config/constants";
import { CreateEnquiryInput, LeadListQuery } from "./leads.schema";
import { triggerAutoCallForEnquiry } from "../voice/voice.service";

// A lead with an enquiry in any of these states is mid-journey; new contacts from any
// source attach to that journey instead of opening a parallel one.
const TERMINAL_STATUSES: EnquiryStatus[] = ["DELIVERED", "LOST"];

/**
 * Phone number is the identity key. Every inbound contact records a LeadTouch.
 * - No active enquiry (first contact, or all past journeys ended in DELIVERED/LOST):
 *   a new Enquiry is created — a genuinely new buying journey.
 * - Active enquiry exists: NO new enquiry. The touch attaches to the active journey,
 *   so the same person walking in today and submitting a Meta form tomorrow stays ONE
 *   enquiry with full contact history — never a duplicate row.
 */
export async function createOrAttachEnquiry(input: CreateEnquiryInput, createdById: string) {
  const phoneNormalized = normalizePhone(input.phone);

  const result = await prisma.$transaction(async (tx) => {
    const branch = await tx.branch.findUnique({ where: { id: input.branchId } });
    if (!branch) throw new NotFoundError("Branch not found");

    const lead = await tx.lead.upsert({
      where: { phoneNormalized },
      // Repeat contacts never overwrite an already-completed profile — only a brand-new
      // lead gets the enrichment fields from this submission.
      update: {},
      create: {
        name: input.name,
        phoneRaw: input.phone,
        phoneNormalized,
        email: input.email,
        alternateMobile: input.alternateMobile,
        dob: input.dob ? new Date(input.dob) : undefined,
        profession: input.profession,
        pincode: input.pincode,
        address: input.address,
      },
    });

    const priorEnquiryCount = await tx.enquiry.count({ where: { leadId: lead.id } });
    const isRepeatLead = priorEnquiryCount > 0;

    const activeEnquiry = await tx.enquiry.findFirst({
      where: { leadId: lead.id, status: { notIn: TERMINAL_STATUSES } },
      orderBy: { createdAt: "desc" },
    });

    if (activeEnquiry) {
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
        status: "NEW",
        department: input.department,
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
      branch: true,
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
