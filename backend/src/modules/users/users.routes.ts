import { Router } from "express";
import multer from "multer";
import { asyncHandler } from "../../lib/asyncHandler";
import { verifyJwt } from "../../middleware/auth";
import { requireRole } from "../../middleware/rbac";
import { validateBody } from "../../middleware/validate";
import { createBranchStaffSchema, createUserSchema, updateUserSchema, setBreakSchema } from "./users.schema";
import {
  createBranchStaffHandler,
  createUserHandler,
  listBranchUsersHandler,
  updateUserHandler,
  directoryHandler,
  deleteUserHandler,
  uploadAvatarHandler,
  heartbeatHandler,
  setBreakHandler,
  teamActivityHandler,
} from "./users.controller";

const uploadAvatar = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB is plenty for a profile photo
});

const router = Router();

router.use(verifyJwt);

// Presence + break (self-service) and the team-activity monitor. Declared before the
// parameterised routes so "me"/"activity" aren't swallowed by "/:userId".
router.post("/me/heartbeat", asyncHandler(heartbeatHandler));
router.patch("/me/break", validateBody(setBreakSchema), asyncHandler(setBreakHandler));
router.get(
  "/activity",
  requireRole("SUPER_ADMIN", "ADMIN", "BRANCH_MANAGER"),
  asyncHandler(teamActivityHandler)
);

// Profile photo — self, or any staff member if a manager/admin (enforced in handler).
router.post("/:userId/avatar", uploadAvatar.single("file"), asyncHandler(uploadAvatarHandler));

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
