import { Router } from "express";
import { asyncHandler } from "../../lib/asyncHandler";
import { verifyJwt } from "../../middleware/auth";
import { requireRole } from "../../middleware/rbac";
import { validateBody } from "../../middleware/validate";
import { createBranchStaffSchema, createUserSchema, updateUserSchema } from "./users.schema";
import {
  createBranchStaffHandler,
  createUserHandler,
  listBranchUsersHandler,
  updateUserHandler,
  directoryHandler,
  deleteUserHandler,
} from "./users.controller";

const router = Router();

router.use(verifyJwt);

// Branch-wise / department-wise staff overview for admins.
router.get("/directory", requireRole("SUPER_ADMIN", "ADMIN", "BRANCH_MANAGER"), asyncHandler(directoryHandler));

// Admin-level user creation (Branch Managers, other Admins).
router.post(
  "/",
  requireRole("SUPER_ADMIN", "ADMIN"),
  validateBody(createUserSchema),
  asyncHandler(createUserHandler)
);

router.patch(
  "/:userId",
  requireRole("SUPER_ADMIN", "ADMIN", "BRANCH_MANAGER"),
  validateBody(updateUserSchema),
  asyncHandler(updateUserHandler)
);

router.delete("/:userId", requireRole("SUPER_ADMIN", "ADMIN"), asyncHandler(deleteUserHandler));

// Departments UI: add Consultants / CR Team members under a branch.
router.post(
  "/branches/:branchId/staff",
  requireRole("SUPER_ADMIN", "ADMIN", "BRANCH_MANAGER"),
  validateBody(createBranchStaffSchema),
  asyncHandler(createBranchStaffHandler)
);

// CR Team and Consultants need this too — they're the ones assigning a consultant or
// picking a colleague while working the enquiry pipeline (status changes, test drives,
// quotations, exchange evaluations all read from this list).
router.get(
  "/branches/:branchId/staff",
  requireRole("SUPER_ADMIN", "ADMIN", "BRANCH_MANAGER", "CR_TEAM", "CONSULTANT"),
  asyncHandler(listBranchUsersHandler)
);

export default router;
