import { Router } from "express";
import { asyncHandler } from "../../lib/asyncHandler";
import { verifyJwt } from "../../middleware/auth";
import { applyBranchScope } from "../../middleware/branchScope";
import { validateQuery } from "../../middleware/validate";
import { followUpListQuerySchema } from "./follow-ups.schema";
import { listUpcomingFollowUpsHandler } from "./follow-ups.controller";

const router = Router();

// Any authenticated user can open the follow-up queue; the service scopes the rows
// to what their role may see (own / branch / all).
router.use(verifyJwt, applyBranchScope);

router.get("/upcoming", validateQuery(followUpListQuerySchema), asyncHandler(listUpcomingFollowUpsHandler));

export default router;
