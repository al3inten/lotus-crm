import { Router } from "express";
import { asyncHandler } from "../../lib/asyncHandler";
import { verifyJwt } from "../../middleware/auth";
import { requireRole } from "../../middleware/rbac";
import { validateBody } from "../../middleware/validate";
import { createCallCampaignSchema } from "./voice.schema";
import {
  listCallCampaignsHandler,
  createCallCampaignHandler,
  startCampaignHandler,
  pauseCampaignHandler,
  getCallLogsForLeadHandler,
} from "./voice.controller";

const router = Router();

router.use(verifyJwt);

router.get("/campaigns", requireRole("SUPER_ADMIN", "ADMIN", "BRANCH_MANAGER", "CR_TEAM"), asyncHandler(listCallCampaignsHandler));
router.post(
  "/campaigns",
  requireRole("SUPER_ADMIN", "ADMIN", "BRANCH_MANAGER"),
  validateBody(createCallCampaignSchema),
  asyncHandler(createCallCampaignHandler)
);
router.post("/campaigns/:campaignId/start", requireRole("SUPER_ADMIN", "ADMIN", "BRANCH_MANAGER"), asyncHandler(startCampaignHandler));
router.post("/campaigns/:campaignId/pause", requireRole("SUPER_ADMIN", "ADMIN", "BRANCH_MANAGER"), asyncHandler(pauseCampaignHandler));
router.get("/call-logs/lead/:leadId", asyncHandler(getCallLogsForLeadHandler));

export default router;
