import { Request, Response } from "express";
import { prisma } from "../../lib/prisma";
import { logger } from "../../lib/logger";

export async function receiveCallmaticWebhookHandler(req: Request, res: Response) {
  const payload = req.body;
  logger.info("Received Callmatic webhook", { callId: payload.callId, status: payload.status });

  try {
    const { callId, phoneNumber, status, duration, insights, transcript } = payload;
    
    // 1. Find the OutboundCallTask for this phone number
    const task = await prisma.outboundCallTask.findFirst({
      where: { phoneNumber },
      orderBy: { createdAt: "desc" },
    });

    if (!task) {
      logger.warn(`No OutboundCallTask found for phone ${phoneNumber}`);
      return res.status(200).send("OK");
    }

    // 2. Find or create Voice conversation for the lead
    let conversation = await prisma.conversation.findUnique({
      where: { channel_externalContactId: { channel: "VOICE", externalContactId: phoneNumber } }
    });

    if (!conversation) {
      // Find lead to attach to the conversation
      const enquiry = await prisma.enquiry.findUnique({ where: { id: task.enquiryId } });
      conversation = await prisma.conversation.create({
        data: {
          channel: "VOICE",
          externalContactId: phoneNumber,
          leadId: enquiry?.leadId,
        }
      });
    }

    // 3. Create or update CallLog
    const summary = insights?.find((i: any) => i.actionType === "SUMMARIZE")?.output?.summary;
    
    const callLog = await prisma.callLog.upsert({
      where: { externalCallId: callId },
      create: {
        conversationId: conversation.id,
        externalCallId: callId,
        fromNumber: "CALLMATIC_BOT",
        toNumber: phoneNumber,
        status: status === "completed" ? "COMPLETED" : "FAILED",
        durationSeconds: duration ? Math.round(duration) : undefined,
        summary: summary || "No summary provided",
      },
      update: {
        status: status === "completed" ? "COMPLETED" : "FAILED",
        durationSeconds: duration ? Math.round(duration) : undefined,
        summary: summary || "No summary provided",
      }
    });

    // 4. Update the OutboundCallTask
    await prisma.outboundCallTask.update({
      where: { id: task.id },
      data: {
        status: status === "completed" ? "COMPLETED" : "FAILED",
        callLogId: callLog.id,
      }
    });

    // Optionally update enquiry status based on summary (e.g. if they are interested)
    // For now, simply logging it is enough.

    res.status(200).send("OK");
  } catch (error) {
    logger.error("Error processing Callmatic webhook", {
      error: error instanceof Error ? error.message : String(error)
    });
    res.status(500).send("Internal Server Error");
  }
}
