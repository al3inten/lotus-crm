import { Request, Response } from "express";
import { logger } from "../../lib/logger";
import { getFasterqCredentials } from "../integrations/integrations.service";
import { applyFasterqCall, FasterqCallPayload } from "../integrations/fasterqSync.service";

// FasterQ sends two pushes per call: the first with recordingUrl empty, a second once the
// recording finishes processing. Both land here — applyFasterqCall upserts by callId either way.
export async function receiveFasterqWebhookHandler(req: Request, res: Response) {
  const payload = req.body as FasterqCallPayload;
  logger.info("Received FasterQ webhook", { callId: payload.callId, phone: payload.phone });

  const creds = await getFasterqCredentials().catch(() => null);
  const providedToken = req.header("Authorization")?.replace(/^Bearer\s+/i, "");
  if (creds && providedToken && providedToken !== creds.verifyToken) {
    logger.warn("Rejected FasterQ webhook with mismatched verify token");
    return res.status(401).send("Invalid token");
  }

  // Ack immediately — FasterQ retries with backoff on non-2xx, and processing (lead lookup,
  // transcription kickoff) shouldn't hold the connection open.
  res.status(200).send("OK");

  try {
    await applyFasterqCall(payload);
  } catch (error) {
    logger.error("Error processing FasterQ webhook", {
      callId: payload.callId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
