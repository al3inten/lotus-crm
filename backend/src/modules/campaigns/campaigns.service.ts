import { Prisma, EnquiryStatus, LeadSource } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { logger } from "../../lib/logger";
import { NotFoundError, ValidationError } from "../../lib/errors";
import * as whatsappSend from "../webhooks/whatsappSend.service";
import { CreateMessageCampaignInput, SegmentFilters } from "./campaigns.schema";
import { istDayStart, istDayEnd } from "../../lib/istDate";

const SEND_DELAY_MS = 1200; // paced sending — keeps us well under WhatsApp's rate limits

export async function listCampaigns() {
  return prisma.messageCampaign.findMany({
    include: { template: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function createCampaign(input: CreateMessageCampaignInput, createdById: string) {
  const template = await prisma.messageTemplate.findUnique({ where: { id: input.templateId } });
  if (!template) throw new NotFoundError("Template not found");

  return prisma.messageCampaign.create({
    data: {
      name: input.name,
      templateId: input.templateId,
      segmentFilters: input.segmentFilters,
      status: "DRAFT",
      createdById,
    },
  });
}

function buildSegmentWhere(filters: SegmentFilters): Prisma.EnquiryWhereInput {
  const where: Prisma.EnquiryWhereInput = {};
  if (filters.branchId) where.branchId = filters.branchId;
  if (filters.status) where.status = filters.status as EnquiryStatus;
  if (filters.source) where.source = filters.source as LeadSource;
  if (filters.assignedCrId) where.assignedCrId = filters.assignedCrId;
  if (filters.dateFrom || filters.dateTo) {
    where.createdAt = {
      ...(filters.dateFrom ? { gte: istDayStart(filters.dateFrom) } : {}),
      ...(filters.dateTo ? { lte: istDayEnd(filters.dateTo) } : {}),
    };
  }
  return where;
}

export async function previewSegmentCount(filters: SegmentFilters): Promise<number> {
  return prisma.enquiry.count({ where: buildSegmentWhere(filters) });
}

async function sendOne(phoneRaw: string, leadId: string, bodyText: string, mediaUrl?: string) {
  await whatsappSend.sendTextMessage(phoneRaw, bodyText);

  const conversation = await prisma.conversation.upsert({
    where: { channel_externalContactId: { channel: "WHATSAPP", externalContactId: phoneRaw } },
    update: { leadId },
    create: { channel: "WHATSAPP", externalContactId: phoneRaw, leadId },
  });

  await prisma.chatMessage.create({
    data: { conversationId: conversation.id, direction: "OUTBOUND", body: bodyText, mediaUrl },
  });
}

/**
 * Fires off a paced, sequential send to every lead matching the campaign's segment.
 * Runs after the HTTP response is sent (the caller doesn't block on the whole batch) —
 * for very large audiences a real job queue would be more robust, but this is a reasonable
 * MVP given WhatsApp template sends already need to be paced one-by-one regardless.
 */
export async function runCampaign(campaignId: string) {
  const campaign = await prisma.messageCampaign.findUnique({
    where: { id: campaignId },
    include: { template: { include: { mediaAsset: true } } },
  });
  if (!campaign) throw new NotFoundError("Campaign not found");
  if (campaign.status === "RUNNING") throw new ValidationError("Campaign is already running");

  await prisma.messageCampaign.update({ where: { id: campaignId }, data: { status: "RUNNING" } });

  const filters = campaign.segmentFilters as SegmentFilters;
  const enquiries = await prisma.enquiry.findMany({
    where: buildSegmentWhere(filters),
    include: { lead: true },
    distinct: ["leadId"],
  });

  for (const enquiry of enquiries) {
    try {
      await sendOne(enquiry.lead.phoneRaw, enquiry.leadId, campaign.template.bodyText, campaign.template.mediaAsset?.cloudinaryUrl);
    } catch (err) {
      logger.error("Bulk campaign send failed for one recipient", {
        campaignId,
        leadId: enquiry.leadId,
        message: err instanceof Error ? err.message : String(err),
      });
    }
    await new Promise((resolve) => setTimeout(resolve, SEND_DELAY_MS));
  }

  await prisma.messageCampaign.update({ where: { id: campaignId }, data: { status: "COMPLETED" } });
}
