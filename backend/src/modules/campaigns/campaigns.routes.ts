import { Router } from "express";
import { asyncHandler } from "../../lib/asyncHandler";
import { verifyJwt } from "../../middleware/auth";
import { requireRole } from "../../middleware/rbac";
import { validateBody, validateQuery } from "../../middleware/validate";
import { createMessageCampaignSchema, segmentFiltersSchema } from "./campaigns.schema";
import {
  listCampaignsHandler,
  createCampaignHandler,
  previewSegmentHandler,
  runCampaignHandler,
} from "./campaigns.controller";

const router = Router();

router.use(verifyJwt, requireRole("SUPER_ADMIN", "ADMIN", "BRANCH_MANAGER"));

router.get("/", asyncHandler(listCampaignsHandler));
router.post("/", validateBody(createMessageCampaignSchema), asyncHandler(createCampaignHandler));
router.get("/segment-preview", validateQuery(segmentFiltersSchema), asyncHandler(previewSegmentHandler));
router.post("/:campaignId/run", asyncHandler(runCampaignHandler));

export default router;
