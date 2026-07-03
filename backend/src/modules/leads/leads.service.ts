import { EnquiryStatus, LeadSource, Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { NotFoundError } from "../../lib/errors";
import { normalizePhone } from "./phone.util";
import { getNextCrForBranch } from "../enquiries/routing.service";
import { DIGITAL_SOURCES, TRANSACTION_OPTIONS } from "../../config/constants";
import { CreateEnquiryInput, LeadListQuery } from "./leads.schema";

export async function createOrAttachEnquiry(input: CreateEnquiryInput, createdById: string) {
  const phoneNormalized = normalizePhone(input.phone);

  return prisma.$transaction(async (tx) => {
    const branch = await tx.branch.findUnique({ where: { id: input.branchId } });
    if (!branch) throw new NotFoundError("Branch not found");

    const lead = await tx.lead.upsert({
      where: { phoneNormalized },
      update: {},
      create: {
        name: input.name,
        phoneRaw: input.phone,
        phoneNormalized,
        email: input.email,
      },
    });

    const priorEnquiryCount = await tx.enquiry.count({ where: { leadId: lead.id } });
    const isRepeatLead = priorEnquiryCount > 0;

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
      },
    });

    await tx.enquiryStatusHistory.create({
      data: {
        enquiryId: enquiry.id,
        fromStatus: null,
        toStatus: "NEW",
        changedById: createdById,
      },
    });

    return { lead, enquiry, isRepeatLead, priorEnquiryCount };
  }, TRANSACTION_OPTIONS);
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

  const [items, total] = await Promise.all([
    prisma.enquiry.findMany({
      where,
      include: {
        lead: true,
        branch: true,
        assignedCr: { select: { id: true, name: true } },
        consultant: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.enquiry.count({ where }),
  ]);

  return { items, total, page: query.page, pageSize: query.pageSize };
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
    },
  });
  if (!lead) throw new NotFoundError("Lead not found");
  return lead;
}
