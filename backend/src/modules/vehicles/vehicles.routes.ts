import { Router } from "express";
import { asyncHandler } from "../../lib/asyncHandler";
import { verifyJwt } from "../../middleware/auth";
import { requirePermission } from "../../middleware/rbac";
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
  requirePermission("vehicles", "write"),
  validateBody(createVehicleModelSchema),
  asyncHandler(createVehicleModelHandler)
);
router.patch(
  "/:modelId",
  requirePermission("vehicles", "write"),
  validateBody(updateVehicleModelSchema),
  asyncHandler(updateVehicleModelHandler)
);
router.delete("/:modelId", requirePermission("vehicles", "write"), asyncHandler(deleteVehicleModelHandler));

router.post(
  "/:modelId/variants",
  requirePermission("vehicles", "write"),
  validateBody(createVehicleVariantSchema),
  asyncHandler(createVehicleVariantHandler)
);
router.patch(
  "/variants/:variantId",
  requirePermission("vehicles", "write"),
  validateBody(updateVehicleVariantSchema),
  asyncHandler(updateVehicleVariantHandler)
);
router.delete(
  "/variants/:variantId",
  requirePermission("vehicles", "write"),
  asyncHandler(deleteVehicleVariantHandler)
);

export default router;
