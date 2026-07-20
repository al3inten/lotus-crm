import { Router } from "express";
import { asyncHandler } from "../../lib/asyncHandler";
import { verifyJwt } from "../../middleware/auth";
import { requireRole } from "../../middleware/rbac";
import { validateBody } from "../../middleware/validate";
import {
  changeStatusSchema,
  reassignSchema,
  testDriveSchema,
  updateTestDriveSchema,
  quotationSchema,
  exchangeEvaluationSchema,
  financeApplicationSchema,
  deliveryDetailsSchema,
  enquiryDetailsSchema,
  createFollowUpSchema,
  createCommentSchema,
} from "./enquiries.schema";
import {
  getEnquiryHandler,
  changeStatusHandler,
  reassignHandler,
  testDriveHandler,
  updateTestDriveHandler,
  quotationHandler,
  exchangeHandler,
  financeHandler,
  deliveryHandler,
  updateDetailsHandler,
  addFollowUpHandler,
  getCommentsHandler,
  addCommentHandler,
} from "./enquiries.controller";

const router = Router();

router.use(verifyJwt);

router.get("/:enquiryId", asyncHandler(getEnquiryHandler));

router.patch("/:enquiryId/status", validateBody(changeStatusSchema), asyncHandler(changeStatusHandler));
router.patch("/:enquiryId/details", validateBody(enquiryDetailsSchema), asyncHandler(updateDetailsHandler));

router.patch(
  "/:enquiryId/reassign",
  requireRole("SUPER_ADMIN", "ADMIN", "BRANCH_MANAGER"),
  validateBody(reassignSchema),
  asyncHandler(reassignHandler)
);

router.post("/:enquiryId/test-drive", validateBody(testDriveSchema), asyncHandler(testDriveHandler));
router.patch("/:enquiryId/test-drive/:testDriveId", validateBody(updateTestDriveSchema), asyncHandler(updateTestDriveHandler));
router.post("/:enquiryId/quotation", validateBody(quotationSchema), asyncHandler(quotationHandler));
router.post("/:enquiryId/exchange-evaluation", validateBody(exchangeEvaluationSchema), asyncHandler(exchangeHandler));
router.post("/:enquiryId/finance", validateBody(financeApplicationSchema), asyncHandler(financeHandler));
router.post("/:enquiryId/delivery", validateBody(deliveryDetailsSchema), asyncHandler(deliveryHandler));
router.post("/:enquiryId/follow-ups", validateBody(createFollowUpSchema), asyncHandler(addFollowUpHandler));
router.get("/:enquiryId/comments", asyncHandler(getCommentsHandler));
router.post("/:enquiryId/comments", validateBody(createCommentSchema), asyncHandler(addCommentHandler));

export default router;
