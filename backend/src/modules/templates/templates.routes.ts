import { Router } from "express";
import { asyncHandler } from "../../lib/asyncHandler";
import { verifyJwt } from "../../middleware/auth";
import { requireRole } from "../../middleware/rbac";
import { validateBody } from "../../middleware/validate";
import { createTemplateSchema, updateTemplateSchema } from "./templates.schema";
import {
  listTemplatesHandler,
  getTemplateHandler,
  createTemplateHandler,
  updateTemplateHandler,
  deleteTemplateHandler,
} from "./templates.controller";

const router = Router();

router.use(verifyJwt, requireRole("SUPER_ADMIN", "ADMIN", "BRANCH_MANAGER"));

router.get("/", asyncHandler(listTemplatesHandler));
router.get("/:templateId", asyncHandler(getTemplateHandler));
router.post("/", validateBody(createTemplateSchema), asyncHandler(createTemplateHandler));
router.patch("/:templateId", validateBody(updateTemplateSchema), asyncHandler(updateTemplateHandler));
router.delete("/:templateId", asyncHandler(deleteTemplateHandler));

export default router;
