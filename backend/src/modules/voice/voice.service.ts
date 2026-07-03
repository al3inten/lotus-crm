import { prisma } from "../../lib/prisma";
import { NotFoundError, ValidationError } from "../../lib/errors";
import { CreateCallCampaignInput } from "./voice.schema";

export async function listCallCampaigns() {
  return prisma.outboundCallCampaign.findMany({
    include: {
      tasks: { include: { enquiry: { include: { lead: true } }, callLog: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createCallCampaign(input: CreateCallCampaignInput, createdById: string) {
  const agentConfig = await prisma.agentConfig.findUnique({ where: { type: "VOICE" } });
  if (!agentConfig?.isActive) {
    throw new ValidationError("Activate the Voice agent (AI Agents page) before creating a call campaign");
  }

  const enquiries = await prisma.enquiry.findMany({
    where: { id: { in: input.enquiryIds } },
    include: { lead: true },
  });
  if (enquiries.length === 0) throw new ValidationError("No valid enquiries selected");

  return prisma.outboundCallCampaign.create({
    data: {
      name: input.name,
      branchId: input.branchId,
      agentConfigId: agentConfig.id,
      status: "DRAFT",
      createdById,
      tasks: {
        create: enquiries.map((enquiry) => ({
          enquiryId: enquiry.id,
          phoneNumber: enquiry.lead.phoneRaw,
          status: "QUEUED",
        })),
      },
    },
    include: { tasks: true },
  });
}

export async function startCampaign(campaignId: string) {
  const campaign = await prisma.outboundCallCampaign.findUnique({ where: { id: campaignId } });
  if (!campaign) throw new NotFoundError("Campaign not found");
  return prisma.outboundCallCampaign.update({ where: { id: campaignId }, data: { status: "RUNNING" } });
}

export async function pauseCampaign(campaignId: string) {
  const campaign = await prisma.outboundCallCampaign.findUnique({ where: { id: campaignId } });
  if (!campaign) throw new NotFoundError("Campaign not found");
  return prisma.outboundCallCampaign.update({ where: { id: campaignId }, data: { status: "PAUSED" } });
}

export async function getCallLogsForLead(leadId: string) {
  return prisma.callLog.findMany({
    where: { conversation: { leadId, channel: "VOICE" } },
    orderBy: { createdAt: "desc" },
  });
}
