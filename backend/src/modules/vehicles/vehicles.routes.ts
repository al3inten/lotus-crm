import { Router } from "express";
import { asyncHandler } from "../../lib/asyncHandler";
import { verifyJwt } from "../../middleware/auth";
import { requirePermission } from "../../middleware/rbac";
import { validateBody, validateQuery } from "../../middleware/validate";
import {
  createVehicleModelSchema,
  updateVehicleModelSchema,
  createVehicleVariantSchema,
  updateVehicleVariantSchema,
  upsertVehicleModelTargetSchema,
  listVehicleModelTargetsQuerySchema,
} from "./vehicles.schema";
import {
  createVehicleModelHandler,
  listVehicleModelsHandler,
  updateVehicleModelHandler,
  deleteVehicleModelHandler,
  createVehicleVariantHandler,
  updateVehicleVariantHandler,
  deleteVehicleVariantHandler,
  listVehicleModelTargetsHandler,
  upsertVehicleModelTargetHandler,
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

// Booking target + stock — read gated behind reports access (same data the Model-wise
// report reads), write gated the same as the rest of the vehicle catalog.
router.get(
  "/targets",
  requirePermission("reports", "read"),
  validateQuery(listVehicleModelTargetsQuerySchema),
  asyncHandler(listVehicleModelTargetsHandler)
);
router.put(
  "/:modelId/targets",
  requirePermission("vehicles", "write"),
  validateBody(upsertVehicleModelTargetSchema),
  asyncHandler(upsertVehicleModelTargetHandler)
);

export default router;
