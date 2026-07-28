import { Router } from "express";
import { asyncHandler } from "../../lib/asyncHandler";
import { verifyJwt } from "../../middleware/auth";
import { requirePermission } from "../../middleware/rbac";
import { validateBody } from "../../middleware/validate";
import { createCallCampaignSchema } from "./voice.schema";
import {
  listCallCampaignsHandler,
  createCallCampaignHandler,
  startCampaignHandler,
  pauseCampaignHandler,
  getCallLogsForLeadHandler,
  listCallLogsHandler,
} from "./voice.controller";

const router = Router();

router.use(verifyJwt);

router.get("/campaigns", requirePermission("call-campaigns", "read"), asyncHandler(listCallCampaignsHandler));
router.post(
  "/campaigns",
  requirePermission("call-campaigns", "write"),
  validateBody(createCallCampaignSchema),
  asyncHandler(createCallCampaignHandler)
);
router.post("/campaigns/:campaignId/start", requirePermission("call-campaigns", "write"), asyncHandler(startCampaignHandler));
router.post("/campaigns/:campaignId/pause", requirePermission("call-campaigns", "write"), asyncHandler(pauseCampaignHandler));
router.get("/call-logs/lead/:leadId", asyncHandler(getCallLogsForLeadHandler));
router.get(
  "/call-logs",
  requirePermission("call-campaigns", "read"),
  asyncHandler(listCallLogsHandler)
);

export default router;
