import { Router } from "express";
import { asyncHandler } from "../../lib/asyncHandler";
import { verifyJwt } from "../../middleware/auth";
import { requirePermission } from "../../middleware/rbac";
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

router.use(verifyJwt);

router.get("/", requirePermission("templates", "read"), asyncHandler(listTemplatesHandler));
router.get("/:templateId", requirePermission("templates", "read"), asyncHandler(getTemplateHandler));
router.post("/", requirePermission("templates", "write"), validateBody(createTemplateSchema), asyncHandler(createTemplateHandler));
router.patch("/:templateId", requirePermission("templates", "write"), validateBody(updateTemplateSchema), asyncHandler(updateTemplateHandler));
router.delete("/:templateId", requirePermission("templates", "write"), asyncHandler(deleteTemplateHandler));

export default router;
