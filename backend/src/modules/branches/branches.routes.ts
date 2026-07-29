import { Router } from "express";
import { asyncHandler } from "../../lib/asyncHandler";
import { verifyJwt } from "../../middleware/auth";
import { requirePermission } from "../../middleware/rbac";
import { applyBranchScope } from "../../middleware/branchScope";
import { validateBody } from "../../middleware/validate";
import { createBranchSchema, updateBranchSchema, toggleAutoAssignSchema, toggleAutoCallSchema } from "./branches.schema";
import {
  createBranchHandler,
  listBranchesHandler,
  getBranchHandler,
  updateBranchHandler,
  toggleAutoAssignHandler,
  toggleAutoCallHandler,
  deleteBranchHandler,
} from "./branches.controller";

const router = Router();

router.use(verifyJwt);

router.post(
  "/",
  requirePermission("branches", "write"),
  validateBody(createBranchSchema),
  asyncHandler(createBranchHandler)
);

// No permission gate here deliberately — this list is used app-wide just to populate
// branch dropdowns (lead wizard, filters, reports, etc.), not only the Branches admin
// page, so every authenticated user can read it (already scoped to what they can see
// via applyBranchScope). Only creating/editing/deleting a branch needs "branches" access.
router.get("/", applyBranchScope, asyncHandler(listBranchesHandler));
router.get("/:branchId", requirePermission("branches", "read"), asyncHandler(getBranchHandler));

router.patch(
  "/:branchId",
  requirePermission("branches", "write"),
  validateBody(updateBranchSchema),
  asyncHandler(updateBranchHandler)
);

router.patch(
  "/:branchId/auto-assign",
  requirePermission("branches", "write"),
  validateBody(toggleAutoAssignSchema),
  asyncHandler(toggleAutoAssignHandler)
);

router.patch(
  "/:branchId/auto-call",
  requirePermission("branches", "write"),
  validateBody(toggleAutoCallSchema),
  asyncHandler(toggleAutoCallHandler)
);

router.delete("/:branchId", requirePermission("branches", "write"), asyncHandler(deleteBranchHandler));

export default router;
