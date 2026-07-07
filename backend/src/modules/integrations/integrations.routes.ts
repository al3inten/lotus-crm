import { Router } from "express";
import { asyncHandler } from "../../lib/asyncHandler";
import { verifyJwt } from "../../middleware/auth";
import { requireRole } from "../../middleware/rbac";
import { validateBody } from "../../middleware/validate";
import { saveIntegrationSchema, syncGoogleSheetSchema, toggleIntegrationSchema } from "./integrations.schema";
import {
  listIntegrationsHandler,
  saveIntegrationHandler,
  deleteIntegrationHandler,
  testIntegrationHandler,
  syncGoogleSheetHandler,
  toggleIntegrationHandler,
} from "./integrations.controller";
import {
  startMetaOAuthHandler,
  metaAdsStatusHandler,
  disconnectMetaHandler,
  syncMetaPageHandler,
  syncAllMetaPagesHandler,
} from "./metaOAuth.controller";

const router = Router();

router.use(verifyJwt, requireRole("SUPER_ADMIN", "ADMIN", "BRANCH_MANAGER"));

router.get("/", asyncHandler(listIntegrationsHandler));
router.post("/google-sheets/sync", validateBody(syncGoogleSheetSchema), asyncHandler(syncGoogleSheetHandler));

router.get("/meta/oauth/start", requireRole("SUPER_ADMIN", "ADMIN"), asyncHandler(startMetaOAuthHandler));
router.get("/meta/pages", asyncHandler(metaAdsStatusHandler));
router.post("/meta/pages/:pageId/sync", requireRole("SUPER_ADMIN", "ADMIN"), asyncHandler(syncMetaPageHandler));
router.post("/meta/sync-all", requireRole("SUPER_ADMIN", "ADMIN"), asyncHandler(syncAllMetaPagesHandler));
router.post("/meta/disconnect", requireRole("SUPER_ADMIN", "ADMIN"), asyncHandler(disconnectMetaHandler));

router.put("/:key", requireRole("SUPER_ADMIN", "ADMIN"), validateBody(saveIntegrationSchema), asyncHandler(saveIntegrationHandler));
router.patch("/:key/enabled", requireRole("SUPER_ADMIN", "ADMIN"), validateBody(toggleIntegrationSchema), asyncHandler(toggleIntegrationHandler));
router.delete("/:key", requireRole("SUPER_ADMIN", "ADMIN"), asyncHandler(deleteIntegrationHandler));
router.post("/:key/test", requireRole("SUPER_ADMIN", "ADMIN"), asyncHandler(testIntegrationHandler));

export default router;
