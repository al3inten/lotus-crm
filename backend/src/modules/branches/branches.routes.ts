import { Router } from "express";
import { asyncHandler } from "../../lib/asyncHandler";
import { verifyJwt } from "../../middleware/auth";
import { requireRole } from "../../middleware/rbac";
import { applyBranchScope } from "../../middleware/branchScope";
import { validateBody } from "../../middleware/validate";
import { createBranchSchema, updateBranchSchema, toggleAutoAssignSchema } from "./branches.schema";
import {
  createBranchHandler,
  listBranchesHandler,
  getBranchHandler,
  updateBranchHandler,
  toggleAutoAssignHandler,
} from "./branches.controller";

const router = Router();

router.use(verifyJwt);

router.post(
  "/",
  requireRole("SUPER_ADMIN", "ADMIN"),
  validateBody(createBranchSchema),
  asyncHandler(createBranchHandler)
);

router.get("/", applyBranchScope, asyncHandler(listBranchesHandler));
router.get("/:branchId", asyncHandler(getBranchHandler));

router.patch(
  "/:branchId",
  requireRole("SUPER_ADMIN", "ADMIN"),
  validateBody(updateBranchSchema),
  asyncHandler(updateBranchHandler)
);

router.patch(
  "/:branchId/auto-assign",
  requireRole("SUPER_ADMIN", "ADMIN", "BRANCH_MANAGER"),
  validateBody(toggleAutoAssignSchema),
  asyncHandler(toggleAutoAssignHandler)
);

export default router;
