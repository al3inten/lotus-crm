import { Router } from "express";
import { getSettingsHandler, updateSettingsHandler } from "./settings.controller";
import { asyncHandler } from "../../lib/asyncHandler";
import { requireRole } from "../../middleware/rbac";
import { verifyJwt } from "../../middleware/auth";

const router = Router();

router.use(verifyJwt);

// Read-only and holds nothing sensitive (just feature flags like quotationEnabled) — every
// authenticated role needs it, since lead detail pages read it to decide what to show.
router.get("/", asyncHandler(getSettingsHandler));
router.patch("/", requireRole("SUPER_ADMIN"), asyncHandler(updateSettingsHandler));

export default router;
