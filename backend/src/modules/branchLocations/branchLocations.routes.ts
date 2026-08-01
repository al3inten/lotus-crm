import { Router } from "express";
import { asyncHandler } from "../../lib/asyncHandler";
import { verifyJwt } from "../../middleware/auth";
import { requirePermission } from "../../middleware/rbac";
import { validateBody } from "../../middleware/validate";
import { createLocationSchema, updateLocationSchema } from "./branchLocations.schema";
import {
  createLocationHandler,
  listLocationsHandler,
  getLocationHandler,
  updateLocationHandler,
  deleteLocationHandler,
} from "./branchLocations.controller";

const router = Router();

router.use(verifyJwt);

router.post(
  "/",
  requirePermission("branches", "write"),
  validateBody(createLocationSchema),
  asyncHandler(createLocationHandler)
);

// No permission gate here deliberately — same rationale as GET /branches: this list
// populates the Location half of the Location -> Branch cascading selectors used
// app-wide, not only the Locations admin page. Only creating/editing/deleting a
// location needs "branches" write access (Location reuses the Branch admin permission
// since it's purely an organizational grouping above Branch, not a separate section).
router.get("/", asyncHandler(listLocationsHandler));
router.get("/:locationId", requirePermission("branches", "read"), asyncHandler(getLocationHandler));

router.patch(
  "/:locationId",
  requirePermission("branches", "write"),
  validateBody(updateLocationSchema),
  asyncHandler(updateLocationHandler)
);

router.delete("/:locationId", requirePermission("branches", "write"), asyncHandler(deleteLocationHandler));

export default router;
