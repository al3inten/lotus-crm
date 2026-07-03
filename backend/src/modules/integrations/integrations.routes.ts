import { Router } from "express";
import { asyncHandler } from "../../lib/asyncHandler";
import { verifyJwt } from "../../middleware/auth";
import { requireRole } from "../../middleware/rbac";
import { validateBody } from "../../middleware/validate";
import { saveIntegrationSchema, syncGoogleSheetSchema } from "./integrations.schema";
import {
  listIntegrationsHandler,
  saveIntegrationHandler,
  deleteIntegrationHandler,
  testIntegrationHandler,
  syncGoogleSheetHandler,
} from "./integrations.controller";

const router = Router();

router.use(verifyJwt, requireRole("SUPER_ADMIN", "ADMIN", "BRANCH_MANAGER"));

router.get("/", asyncHandler(listIntegrationsHandler));
router.post("/google-sheets/sync", validateBody(syncGoogleSheetSchema), asyncHandler(syncGoogleSheetHandler));
router.put("/:key", requireRole("SUPER_ADMIN", "ADMIN"), validateBody(saveIntegrationSchema), asyncHandler(saveIntegrationHandler));
router.delete("/:key", requireRole("SUPER_ADMIN", "ADMIN"), asyncHandler(deleteIntegrationHandler));
router.post("/:key/test", requireRole("SUPER_ADMIN", "ADMIN"), asyncHandler(testIntegrationHandler));

export default router;
