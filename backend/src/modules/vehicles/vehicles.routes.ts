import { Router } from "express";
import { asyncHandler } from "../../lib/asyncHandler";
import { verifyJwt } from "../../middleware/auth";
import { requireRole } from "../../middleware/rbac";
import { validateBody } from "../../middleware/validate";
import {
  createVehicleModelSchema,
  updateVehicleModelSchema,
  createVehicleVariantSchema,
  updateVehicleVariantSchema,
} from "./vehicles.schema";
import {
  createVehicleModelHandler,
  listVehicleModelsHandler,
  updateVehicleModelHandler,
  deleteVehicleModelHandler,
  createVehicleVariantHandler,
  updateVehicleVariantHandler,
  deleteVehicleVariantHandler,
} from "./vehicles.controller";

const router = Router();

router.use(verifyJwt);

// Reads open to any authenticated user — the Add Lead wizard needs this for its dropdowns.
router.get("/", asyncHandler(listVehicleModelsHandler));

router.post(
  "/",
  requireRole("SUPER_ADMIN", "ADMIN"),
  validateBody(createVehicleModelSchema),
  asyncHandler(createVehicleModelHandler)
);
router.patch(
  "/:modelId",
  requireRole("SUPER_ADMIN", "ADMIN"),
  validateBody(updateVehicleModelSchema),
  asyncHandler(updateVehicleModelHandler)
);
router.delete("/:modelId", requireRole("SUPER_ADMIN", "ADMIN"), asyncHandler(deleteVehicleModelHandler));

router.post(
  "/:modelId/variants",
  requireRole("SUPER_ADMIN", "ADMIN"),
  validateBody(createVehicleVariantSchema),
  asyncHandler(createVehicleVariantHandler)
);
router.patch(
  "/variants/:variantId",
  requireRole("SUPER_ADMIN", "ADMIN"),
  validateBody(updateVehicleVariantSchema),
  asyncHandler(updateVehicleVariantHandler)
);
router.delete(
  "/variants/:variantId",
  requireRole("SUPER_ADMIN", "ADMIN"),
  asyncHandler(deleteVehicleVariantHandler)
);

export default router;
