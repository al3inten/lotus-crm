import { Router } from "express";
import { asyncHandler } from "../../lib/asyncHandler";
import { verifyJwt } from "../../middleware/auth";
import { requirePermission } from "../../middleware/rbac";
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

router.use(verifyJwt);

router.get("/", requirePermission("integrations", "read"), asyncHandler(listIntegrationsHandler));
router.post("/google-sheets/sync", requirePermission("integrations", "write"), validateBody(syncGoogleSheetSchema), asyncHandler(syncGoogleSheetHandler));

router.get("/meta/oauth/start", requirePermission("integrations", "write"), asyncHandler(startMetaOAuthHandler));
router.get("/meta/pages", requirePermission("integrations", "read"), asyncHandler(metaAdsStatusHandler));
router.post("/meta/pages/:pageId/sync", requirePermission("integrations", "write"), asyncHandler(syncMetaPageHandler));
router.post("/meta/sync-all", requirePermission("integrations", "write"), asyncHandler(syncAllMetaPagesHandler));
router.post("/meta/disconnect", requirePermission("integrations", "write"), asyncHandler(disconnectMetaHandler));

router.put("/:key", requirePermission("integrations", "write"), validateBody(saveIntegrationSchema), asyncHandler(saveIntegrationHandler));
router.patch("/:key/enabled", requirePermission("integrations", "write"), validateBody(toggleIntegrationSchema), asyncHandler(toggleIntegrationHandler));
router.delete("/:key", requirePermission("integrations", "write"), asyncHandler(deleteIntegrationHandler));
router.post("/:key/test", requirePermission("integrations", "write"), asyncHandler(testIntegrationHandler));

export default router;
