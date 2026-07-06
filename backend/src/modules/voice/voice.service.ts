import { prisma } from "../../lib/prisma";
import { NotFoundError, ValidationError } from "../../lib/errors";
import { CreateCallCampaignInput } from "./voice.schema";
import { normalizePhone } from "../leads/phone.util";
import * as callmaticService from "../integrations/callmatic.service";
import { logger } from "../../lib/logger";

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
  const campaign = await prisma.outboundCallCampaign.findUnique({ 
    where: { id: campaignId },
    include: { tasks: { include: { enquiry: { include: { lead: true } } } } }
  });
  if (!campaign) throw new NotFoundError("Campaign not found");
  
  const updatedCampaign = await prisma.outboundCallCampaign.update({ where: { id: campaignId }, data: { status: "RUNNING" } });

  try {
    const callTasks = campaign.tasks.map(t => ({
      phoneNumber: normalizePhone(t.enquiry.lead.phoneRaw),
      variables: {
        name: t.enquiry.lead.name,
        callee_name: t.enquiry.lead.name,
        taskId: t.id, // For mapping webhook responses later
      }
    }));
    
    // Chunk into 200 calls per request as per Callmatic API limits
    const chunkSize = 200;
    for (let i = 0; i < callTasks.length; i += chunkSize) {
      const chunk = callTasks.slice(i, i + chunkSize);
      const result = await callmaticService.triggerBatchCalls(chunk);
      
      if (result.success && result.data?.calls) {
        // Map external callId to tasks
        for (const call of result.data.calls) {
          const task = chunk.find(t => t.phoneNumber === call.phoneNumber);
          if (task) {
            await prisma.outboundCallTask.update({
              where: { id: task.variables.taskId },
              data: { status: "IN_PROGRESS" }
            });
            logger.info("Callmatic call triggered", { taskId: task.variables.taskId, callId: call.callId });
          }
        }
      }
    }
  } catch (err) {
    logger.error("Failed to trigger Callmatic campaign. Falling back to local worker.", {
      error: err instanceof Error ? err.message : String(err),
    });
  }

  return updatedCampaign;
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
