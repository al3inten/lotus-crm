import { Request, Response } from "express";
import { prisma } from "../../lib/prisma";
import { logger } from "../../lib/logger";
import { applyCallResult } from "../integrations/callmaticSync.service";

export async function receiveCallmaticWebhookHandler(req: Request, res: Response) {
  const payload = req.body;
  logger.info("Received Callmatic webhook", { callId: payload.callId, status: payload.status, payload });

  try {
    const { phoneNumber } = payload;

    const task = await prisma.outboundCallTask.findFirst({
      where: { phoneNumber },
      orderBy: { createdAt: "desc" },
    });

    if (!task) {
      logger.warn(`No OutboundCallTask found for phone ${phoneNumber}`);
      return res.status(200).send("OK");
    }

    await applyCallResult(task, payload);

    res.status(200).send("OK");
  } catch (error) {
    logger.error("Error processing Callmatic webhook", {
      error: error instanceof Error ? error.message : String(error)
    });
    res.status(500).send("Internal Server Error");
  }
}
