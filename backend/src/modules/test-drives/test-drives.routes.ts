import { Router } from "express";
import { asyncHandler } from "../../lib/asyncHandler";
import { verifyJwt } from "../../middleware/auth";
import { applyBranchScope } from "../../middleware/branchScope";
import { validateQuery } from "../../middleware/validate";
import { testDriveListQuerySchema } from "./test-drives.schema";
import { listTestDrivesHandler } from "./test-drives.controller";

const router = Router();

// Any authenticated user can open the test drive queue; the service scopes the rows
// to what their role may see (own / branch / all).
router.use(verifyJwt, applyBranchScope);

router.get("/", validateQuery(testDriveListQuerySchema), asyncHandler(listTestDrivesHandler));

export default router;
