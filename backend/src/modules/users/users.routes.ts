import { Router } from "express";
import multer from "multer";
import { asyncHandler } from "../../lib/asyncHandler";
import { verifyJwt } from "../../middleware/auth";
import { requireRole, requirePermission } from "../../middleware/rbac";
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
router.get("/activity", requirePermission("branches", "read"), asyncHandler(teamActivityHandler));

// Profile photo — self, or any staff member with branches-write access (enforced in handler).
router.post("/:userId/avatar", uploadAvatar.single("file"), asyncHandler(uploadAvatarHandler));

// Branch-wise staff overview for admins.
router.get("/directory", requirePermission("branches", "read"), asyncHandler(directoryHandler));

// SUPER_ADMIN-level user creation (head-office/staff accounts outside the branch flow).
router.post("/", requireRole("SUPER_ADMIN"), validateBody(createUserSchema), asyncHandler(createUserHandler));

router.patch(
  "/:userId",
  requirePermission("branches", "write"),
  validateBody(updateUserSchema),
  asyncHandler(updateUserHandler)
);

router.delete("/:userId", requirePermission("branches", "write"), asyncHandler(deleteUserHandler));

// Branches UI: add staff under a branch, assigned a fully-custom RoleDefinition.
router.post(
  "/branches/:branchId/staff",
  requirePermission("branches", "write"),
  validateBody(createBranchStaffSchema),
  asyncHandler(createBranchStaffHandler)
);

// Any authenticated staff member needs this too — they're the ones assigning a
// CR/colleague while working the enquiry pipeline (status changes, reassignment,
// quotations, exchange evaluations all read from this list). Left open (verifyJwt
// only) rather than gated on "branches" read, since it's consumed widely outside
// the Branches admin page itself.
router.get("/branches/:branchId/staff", asyncHandler(listBranchUsersHandler));

export default router;
