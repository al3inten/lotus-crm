import { Router } from "express";
import { asyncHandler } from "../../lib/asyncHandler";
import { verifyWebhookHandler, receiveWebhookHandler } from "./meta.webhook.controller";
import { receiveCallmaticWebhookHandler } from "./callmatic.webhook.controller";

const router = Router();

// Public — Meta calls these directly. Authenticity is enforced via hub.verify_token (GET)
// and X-Hub-Signature-256 HMAC verification (POST), not JWT.
router.get("/meta", asyncHandler(verifyWebhookHandler));
router.post("/meta", asyncHandler(receiveWebhookHandler));

// Callmatic Webhook
router.post("/callmatic", asyncHandler(receiveCallmaticWebhookHandler));

export default router;
