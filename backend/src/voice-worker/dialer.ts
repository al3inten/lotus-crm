import { prisma } from "../lib/prisma";
import { logger } from "../lib/logger";
import { normalizePhone } from "../modules/leads/phone.util";
import * as livekitSip from "../modules/voice/livekitSip.service";
import { getTelecmiCredentials } from "../modules/integrations/integrations.service";
import { runCallSession } from "./session";

const MAX_CONCURRENT_CALLS = 3;

let activeCalls = 0;

async function placeCall(taskId: string) {
  const task = await prisma.outboundCallTask.findUnique({
    where: { id: taskId },
    include: { enquiry: { include: { lead: true } } },
  });
  if (!task) return;

  const agentConfig = await prisma.agentConfig.findUnique({ where: { type: "VOICE" } });
  if (!agentConfig?.isActive) {
    logger.warn("Voice agent is not active — skipping call", { taskId });
    return;
  }

  const phoneNormalized = normalizePhone(task.phoneNumber);
  const conversation = await prisma.conversation.upsert({
    where: { channel_externalContactId: { channel: "VOICE", externalContactId: phoneNormalized } },
    update: { leadId: task.enquiry.leadId },
    create: { channel: "VOICE", externalContactId: phoneNormalized, leadId: task.enquiry.leadId, contactName: task.enquiry.lead.name },
  });

  const telecmi = await getTelecmiCredentials();
  const callLog = await prisma.callLog.create({
    data: {
      conversationId: conversation.id,
      fromNumber: telecmi.callerIdNumber,
      toNumber: task.phoneNumber,
      status: "DIALING",
    },
  });

  await prisma.outboundCallTask.update({
    where: { id: taskId },
    data: { status: "DIALING", attemptCount: { increment: 1 }, lastAttemptAt: new Date(), callLogId: callLog.id },
  });

  const roomName = `call-${task.id}-${Date.now()}`;

  try {
    await livekitSip.dialOut(roomName, task.phoneNumber);
    await prisma.callLog.update({ where: { id: callLog.id }, data: { status: "IN_PROGRESS", startedAt: new Date() } });

    const outcome = await runCallSession(roomName, conversation.id, agentConfig);

    await prisma.callLog.update({
      where: { id: callLog.id },
      data: {
        status: outcome.status,
        endedAt: new Date(),
        durationSeconds: outcome.durationSeconds,
        recordingUrl: outcome.recordingUrl,
      },
    });
    await prisma.outboundCallTask.update({ where: { id: taskId }, data: { status: outcome.status } });
  } catch (err) {
    logger.error("Outbound call failed", { taskId, roomName, message: err instanceof Error ? err.message : String(err) });
    await prisma.callLog.update({ where: { id: callLog.id }, data: { status: "FAILED", endedAt: new Date() } });
    await prisma.outboundCallTask.update({ where: { id: taskId }, data: { status: "FAILED" } });
  }
}

export async function pollAndDial() {
  if (activeCalls >= MAX_CONCURRENT_CALLS) return;

  const capacity = MAX_CONCURRENT_CALLS - activeCalls;
  const tasks = await prisma.outboundCallTask.findMany({
    where: { status: "QUEUED", campaign: { status: "RUNNING" } },
    take: capacity,
    orderBy: { createdAt: "asc" },
  });

  for (const task of tasks) {
    activeCalls++;
    placeCall(task.id)
      .catch((err) => logger.error("Unhandled dialer error", { taskId: task.id, message: err instanceof Error ? err.message : String(err) }))
      .finally(() => {
        activeCalls--;
      });
  }
}
