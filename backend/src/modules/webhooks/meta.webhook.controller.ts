import { Request, Response } from "express";
import { logger } from "../../lib/logger";
import { verifyMetaSignature } from "./signature.util";
import * as integrationsService from "../integrations/integrations.service";
import * as metaLeadAdsService from "./metaLeadAds.service";
import * as whatsappService from "./whatsapp.service";
import * as instagramService from "./instagram.service";

async function findMatchingVerifyToken(providedToken: string): Promise<boolean> {
  const checks = [
    integrationsService.getMetaAdsCredentials,
    integrationsService.getWhatsappCredentials,
    integrationsService.getInstagramCredentials,
  ];

  for (const getCreds of checks) {
    try {
      const creds = await getCreds();
      if (creds.verifyToken === providedToken) return true;
    } catch {
      // Integration not configured — skip.
    }
  }
  return false;
}

export async function verifyWebhookHandler(req: Request, res: Response) {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode !== "subscribe" || typeof token !== "string") {
    return res.status(403).send("Forbidden");
  }

  const matched = await findMatchingVerifyToken(token);
  if (!matched) {
    return res.status(403).send("Forbidden");
  }

  return res.status(200).send(challenge);
}

async function getAppSecretForObject(object: string): Promise<string | null> {
  try {
    if (object === "page") return (await integrationsService.getMetaAdsCredentials()).appSecret;
    if (object === "whatsapp_business_account") return (await integrationsService.getWhatsappCredentials()).appSecret;
    if (object === "instagram") return (await integrationsService.getInstagramCredentials()).appSecret;
  } catch {
    return null;
  }
  return null;
}

export async function receiveWebhookHandler(req: Request, res: Response) {
  const object = req.body?.object as string | undefined;
  if (!object) return res.status(400).send("Missing object");

  const appSecret = await getAppSecretForObject(object);
  if (!appSecret) {
    logger.warn("Webhook received for unconfigured integration", { object });
    return res.status(200).send("EVENT_RECEIVED");
  }

  const signature = req.headers["x-hub-signature-256"] as string | undefined;
  if (!verifyMetaSignature(req.rawBody, signature, appSecret)) {
    logger.warn("Webhook signature verification failed", { object });
    return res.status(401).send("Invalid signature");
  }

  // Always ack quickly with 200 once the signature is valid — Meta retries aggressively
  // on non-200s. Processing errors are logged, not surfaced as webhook failures.
  res.status(200).send("EVENT_RECEIVED");

  try {
    const entries = req.body.entry ?? [];
    for (const entry of entries) {
      if (object === "page") {
        for (const change of entry.changes ?? []) {
          if (change.field === "leadgen" && change.value?.leadgen_id) {
            await metaLeadAdsService.handleLeadgenEvent(change.value.leadgen_id);
          }
        }
      } else if (object === "whatsapp_business_account") {
        for (const change of entry.changes ?? []) {
          if (change.field === "messages") {
            await whatsappService.handleIncomingMessages(change.value);
          }
        }
      } else if (object === "instagram") {
        if (entry.messaging?.length) {
          await instagramService.handleIncomingMessaging(entry.messaging);
        }
      }
    }
  } catch (err) {
    logger.error("Failed processing Meta webhook payload", {
      object,
      message: err instanceof Error ? err.message : String(err),
    });
  }
}
