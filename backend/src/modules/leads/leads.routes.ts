import { Router } from "express";
import multer from "multer";
import { asyncHandler } from "../../lib/asyncHandler";
import { verifyJwt } from "../../middleware/auth";
import { applyBranchScope } from "../../middleware/branchScope";
import { requirePermission } from "../../middleware/rbac";
import { validateBody, validateQuery } from "../../middleware/validate";
import { createEnquirySchema, walkInLeadSchema, leadDraftSchema, leadListQuerySchema, customerListQuerySchema } from "./leads.schema";
import {
  createEnquiryHandler,
  createWalkInHandler,
  listEnquiriesHandler,
  listCustomersHandler,
  getLeadHandler,
  importLeadsHandler,
  downloadLeadImportTemplateHandler,
  listDraftsHandler,
  saveDraftHandler,
  updateDraftHandler,
  deleteDraftHandler,
  lookupLeadHandler,
  getRemindersHandler,
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
  requirePermission("leads", "write"),
  upload.single("file"),
  asyncHandler(importLeadsHandler)
);
router.get(
  "/import/template",
  requirePermission("leads", "read"),
  asyncHandler(downloadLeadImportTemplateHandler)
);

router.get("/lookup", asyncHandler(lookupLeadHandler));
router.get("/reminders", asyncHandler(getRemindersHandler));

// Registered before "/:leadId" so "drafts" isn't swallowed as a leadId param.
router.get("/drafts", asyncHandler(listDraftsHandler));
router.post("/drafts", validateBody(leadDraftSchema), asyncHandler(saveDraftHandler));
router.patch("/drafts/:id", validateBody(leadDraftSchema.pick({ data: true })), asyncHandler(updateDraftHandler));
router.delete("/drafts/:id", asyncHandler(deleteDraftHandler));

// Registered before "/:leadId" so "customers" isn't swallowed as a leadId param.
router.get("/customers", validateQuery(customerListQuerySchema), asyncHandler(listCustomersHandler));

router.get("/", validateQuery(leadListQuerySchema), asyncHandler(listEnquiriesHandler));
router.get("/:leadId", asyncHandler(getLeadHandler));

export default router;
