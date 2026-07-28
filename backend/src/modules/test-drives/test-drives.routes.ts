import { Router } from "express";
import { asyncHandler } from "../../lib/asyncHandler";
import { verifyJwt } from "../../middleware/auth";
import { applyBranchScope } from "../../middleware/branchScope";
import { requirePermission } from "../../middleware/rbac";
import { validateQuery } from "../../middleware/validate";
import { testDriveListQuerySchema } from "./test-drives.schema";
import { listTestDrivesHandler } from "./test-drives.controller";

const router = Router();

// Read-only queue (test drive creation/updates happen via the enquiry routes); the
// service further scopes the rows to what their role may see (own / branch / all).
router.use(verifyJwt, requirePermission("test-drives", "read"), applyBranchScope);

router.get("/", validateQuery(testDriveListQuerySchema), asyncHandler(listTestDrivesHandler));

export default router;
