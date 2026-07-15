import { Router } from "express";
import { asyncHandler } from "../../lib/asyncHandler";
import { verifyJwt } from "../../middleware/auth";
import { applyBranchScope } from "../../middleware/branchScope";
import { validateQuery } from "../../middleware/validate";
import { followUpListQuerySchema, followUpCalendarQuerySchema } from "./follow-ups.schema";
import { listUpcomingFollowUpsHandler, getFollowUpCalendarCountsHandler } from "./follow-ups.controller";

const router = Router();

// Any authenticated user can open the follow-up queue; the service scopes the rows
// to what their role may see (own / branch / all).
router.use(verifyJwt, applyBranchScope);

router.get("/upcoming", validateQuery(followUpListQuerySchema), asyncHandler(listUpcomingFollowUpsHandler));
router.get("/calendar-counts", validateQuery(followUpCalendarQuerySchema), asyncHandler(getFollowUpCalendarCountsHandler));

export default router;
