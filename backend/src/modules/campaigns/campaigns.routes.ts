import { Router } from "express";
import { asyncHandler } from "../../lib/asyncHandler";
import { verifyJwt } from "../../middleware/auth";
import { requirePermission } from "../../middleware/rbac";
import { validateBody, validateQuery } from "../../middleware/validate";
import { createMessageCampaignSchema, segmentFiltersSchema } from "./campaigns.schema";
import {
  listCampaignsHandler,
  createCampaignHandler,
  previewSegmentHandler,
  runCampaignHandler,
} from "./campaigns.controller";

const router = Router();

router.use(verifyJwt);

router.get("/", requirePermission("bulk-messages", "read"), asyncHandler(listCampaignsHandler));
router.post("/", requirePermission("bulk-messages", "write"), validateBody(createMessageCampaignSchema), asyncHandler(createCampaignHandler));
router.get("/segment-preview", requirePermission("bulk-messages", "read"), validateQuery(segmentFiltersSchema), asyncHandler(previewSegmentHandler));
router.post("/:campaignId/run", requirePermission("bulk-messages", "write"), asyncHandler(runCampaignHandler));

export default router;
