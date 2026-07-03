import { Router } from "express";
import multer from "multer";
import { asyncHandler } from "../../lib/asyncHandler";
import { verifyJwt } from "../../middleware/auth";
import { applyBranchScope } from "../../middleware/branchScope";
import { requireRole } from "../../middleware/rbac";
import { validateBody, validateQuery } from "../../middleware/validate";
import { createEnquirySchema, walkInLeadSchema, leadListQuerySchema } from "./leads.schema";
import {
  createEnquiryHandler,
  createWalkInHandler,
  listEnquiriesHandler,
  getLeadHandler,
  importLeadsHandler,
} from "./leads.controller";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB — plenty for a lead spreadsheet, caps abuse
});

const router = Router();

router.use(verifyJwt, applyBranchScope);

router.post("/", validateBody(createEnquirySchema), asyncHandler(createEnquiryHandler));
router.post("/walk-in", validateBody(walkInLeadSchema), asyncHandler(createWalkInHandler));
router.post(
  "/import",
  requireRole("SUPER_ADMIN", "ADMIN", "BRANCH_MANAGER", "CR_TEAM"),
  upload.single("file"),
  asyncHandler(importLeadsHandler)
);
router.get("/", validateQuery(leadListQuerySchema), asyncHandler(listEnquiriesHandler));
router.get("/:leadId", asyncHandler(getLeadHandler));

export default router;
