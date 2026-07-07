import { Prisma, CallStatus } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { NotFoundError, ValidationError } from "../../lib/errors";
import { CreateCallCampaignInput } from "./voice.schema";
import { normalizePhone } from "../leads/phone.util";
import * as callmaticService from "../integrations/callmatic.service";
import { logger } from "../../lib/logger";
import { getSystemUserId } from "../../lib/systemUser";
import { applyCallResult, isTerminalCallStatus } from "../integrations/callmaticSync.service";

// Every auto-dialed digital lead lands in this one persistent campaign rather than a
// fresh campaign per enquiry — keeps outbound_call_campaigns from growing one row per lead.
const AUTO_DIAL_CAMPAIGN_NAME = "Auto-Dial (Digital Leads)";

async function getOrCreateAutoDialCampaign(agentConfigId: string) {
  const existing = await prisma.outboundCallCampaign.findFirst({
    where: { name: AUTO_DIAL_CAMPAIGN_NAME },
  });
  if (existing) return existing;

  const systemUserId = await getSystemUserId();
  return prisma.outboundCallCampaign.create({
    data: {
      name: AUTO_DIAL_CAMPAIGN_NAME,
      agentConfigId,
      status: "RUNNING",
      createdById: systemUserId,
    },
  });
}

/**
 * Fires the Voice AI outbound call automatically for a freshly created digital-source
 * enquiry. Gated by two independent toggles — both must be on:
 * - AgentConfig(VOICE).autoCallEnabled: global kill switch (AI Agents page)
 * - Branch.autoCallEnabled: per-branch override (Departments page)
 * Best-effort: failures are logged, never thrown, so lead capture itself is never
 * blocked by Callmatic being down or either toggle being off.
 */
export async function triggerAutoCallForEnquiry(enquiryId: string) {
  try {
    const enquiry = await prisma.enquiry.findUnique({
      where: { id: enquiryId },
      include: { lead: true, branch: true },
    });
    if (!enquiry) return;

    if (!enquiry.branch.autoCallEnabled) {
      logger.info("Branch has auto-call disabled — skipping auto-call", { enquiryId, branchId: enquiry.branchId });
      return;
    }

    const agentConfig = await prisma.agentConfig.findUnique({ where: { type: "VOICE" } });
    if (!agentConfig?.isActive || !agentConfig.autoCallEnabled) {
      logger.info("Voice agent inactive or auto-call disabled globally — skipping auto-call", { enquiryId });
      return;
    }

    const campaign = await getOrCreateAutoDialCampaign(agentConfig.id);

    const task = await prisma.outboundCallTask.create({
      data: {
        campaignId: campaign.id,
        enquiryId,
        phoneNumber: enquiry.lead.phoneRaw,
        status: "QUEUED",
      },
    });

    const result = await callmaticService.triggerBatchCalls([
      {
        phoneNumber: normalizePhone(enquiry.lead.phoneRaw),
        variables: {
          name: enquiry.lead.name,
          callee_name: enquiry.lead.name,
          taskId: task.id,
        },
      },
    ]);

    const call = result?.data?.calls?.[0];
    if (result?.success && call) {
      await prisma.outboundCallTask.update({
        where: { id: task.id },
        data: { status: "IN_PROGRESS", externalCallId: call.callId },
      });
    }

    await prisma.enquiry.update({ where: { id: enquiryId }, data: { callTriggered: true } });
    logger.info("Auto-dial triggered for digital lead", { enquiryId, taskId: task.id, callId: call?.callId });
  } catch (err) {
    logger.error("Failed to auto-trigger Callmatic call for enquiry", {
      enquiryId,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

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
      callmaticCampaignId: input.callmaticCampaignId || undefined,
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
      const result = await callmaticService.triggerBatchCalls(chunk, campaign.callmaticCampaignId ?? undefined);
      
      if (result.success && result.data?.calls) {
        // Map external callId to tasks
        for (const call of result.data.calls) {
          const task = chunk.find(t => t.phoneNumber === call.phoneNumber);
          if (task) {
            await prisma.outboundCallTask.update({
              where: { id: task.variables.taskId },
              data: { status: "IN_PROGRESS", externalCallId: call.callId }
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

/**
 * Fallback for Callmatic's webhook being unreliable/unconfigured: polls GET /calls/{callId}
 * for every task still mid-call and applies the result once Callmatic reports it as done.
 * Safe to call repeatedly — each task is only touched while its status is non-terminal.
 */
export async function pollPendingCalls() {
  const pendingTasks = await prisma.outboundCallTask.findMany({
    where: {
      externalCallId: { not: null },
      status: { in: ["QUEUED", "DIALING", "IN_PROGRESS"] },
    },
  });

  for (const task of pendingTasks) {
    if (!task.externalCallId) continue;
    try {
      const details = await callmaticService.getCallDetails(task.externalCallId);
      if (!isTerminalCallStatus(details?.status)) continue;

      await applyCallResult(task, {
        callId: task.externalCallId,
        phoneNumber: task.phoneNumber,
        status: details.status,
        duration: details.duration,
        insights: details.insights,
        transcript: details.transcript,
      });
    } catch (err) {
      logger.error("Failed to poll Callmatic call details", {
        taskId: task.id,
        callId: task.externalCallId,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
}

export async function getCallLogsForLead(leadId: string) {
  return prisma.callLog.findMany({
    where: { conversation: { leadId, channel: "VOICE" } },
    orderBy: { createdAt: "desc" },
  });
}

export interface ListCallLogsQuery {
  phoneNumber?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

// Flat, cross-lead view of every voice call — mirrors Callmatic's own call log dashboard
// (Time / To Phone Number / Status / Duration / Recording / Transcript / Insights).
export async function listCallLogs(query: ListCallLogsQuery) {
  const page = query.page && query.page > 0 ? query.page : 1;
  const pageSize = query.pageSize && query.pageSize > 0 ? query.pageSize : 20;

  const where: Prisma.CallLogWhereInput = { conversation: { channel: "VOICE" } };
  if (query.phoneNumber) where.toNumber = { contains: query.phoneNumber };
  if (query.status) where.status = query.status as CallStatus;
  if (query.dateFrom || query.dateTo) {
    where.createdAt = {
      ...(query.dateFrom ? { gte: new Date(query.dateFrom) } : {}),
      ...(query.dateTo ? { lte: new Date(query.dateTo) } : {}),
    };
  }

  const [items, total] = await Promise.all([
    prisma.callLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { conversation: { include: { lead: { select: { id: true, name: true } } } } },
    }),
    prisma.callLog.count({ where }),
  ]);

  return { items, total, page, pageSize };
}
