import { Router } from "express";
import { asyncHandler } from "../../lib/asyncHandler";
import { verifyJwt } from "../../middleware/auth";
import { applyBranchScope } from "../../middleware/branchScope";
import { requirePermission } from "../../middleware/rbac";
import { validateQuery } from "../../middleware/validate";
import { followUpListQuerySchema, followUpCalendarQuerySchema } from "./follow-ups.schema";
import { listUpcomingFollowUpsHandler, followUpCalendarHandler } from "./follow-ups.controller";

const router = Router();

// Every route here is a read (viewing the queue) — the service scopes the rows
// to what their role may see (own / branch / all); no write routes in this module.
router.use(verifyJwt, requirePermission("follow-ups", "read"), applyBranchScope);

router.get("/upcoming", validateQuery(followUpListQuerySchema), asyncHandler(listUpcomingFollowUpsHandler));
router.get("/calendar", validateQuery(followUpCalendarQuerySchema), asyncHandler(followUpCalendarHandler));

export default router;
