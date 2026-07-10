import { Router } from "express";
import { getSettingsHandler, updateSettingsHandler } from "./settings.controller";
import { asyncHandler } from "../../lib/asyncHandler";
import { requireRole } from "../../middleware/rbac";
import { verifyJwt } from "../../middleware/auth";

const router = Router();

router.use(verifyJwt);

router.get("/", requireRole("SUPER_ADMIN", "ADMIN"), asyncHandler(getSettingsHandler));
router.patch("/", requireRole("SUPER_ADMIN", "ADMIN"), asyncHandler(updateSettingsHandler));

export default router;
