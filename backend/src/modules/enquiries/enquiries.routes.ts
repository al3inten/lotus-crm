import { Router } from "express";
import { asyncHandler } from "../../lib/asyncHandler";
import { verifyJwt } from "../../middleware/auth";
import { requireRole } from "../../middleware/rbac";
import { validateBody } from "../../middleware/validate";
import {
  changeStatusSchema,
  reassignSchema,
  testDriveSchema,
  quotationSchema,
  exchangeEvaluationSchema,
  financeApplicationSchema,
  deliveryDetailsSchema,
} from "./enquiries.schema";
import {
  getEnquiryHandler,
  changeStatusHandler,
  reassignHandler,
  testDriveHandler,
  quotationHandler,
  exchangeHandler,
  financeHandler,
  deliveryHandler,
} from "./enquiries.controller";

const router = Router();

router.use(verifyJwt);

router.get("/:enquiryId", asyncHandler(getEnquiryHandler));

router.patch("/:enquiryId/status", validateBody(changeStatusSchema), asyncHandler(changeStatusHandler));

router.patch(
  "/:enquiryId/reassign",
  requireRole("SUPER_ADMIN", "ADMIN", "BRANCH_MANAGER"),
  validateBody(reassignSchema),
  asyncHandler(reassignHandler)
);

router.post("/:enquiryId/test-drive", validateBody(testDriveSchema), asyncHandler(testDriveHandler));
router.post("/:enquiryId/quotation", validateBody(quotationSchema), asyncHandler(quotationHandler));
router.post("/:enquiryId/exchange-evaluation", validateBody(exchangeEvaluationSchema), asyncHandler(exchangeHandler));
router.post("/:enquiryId/finance", validateBody(financeApplicationSchema), asyncHandler(financeHandler));
router.post("/:enquiryId/delivery", validateBody(deliveryDetailsSchema), asyncHandler(deliveryHandler));

export default router;
