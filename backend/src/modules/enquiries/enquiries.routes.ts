import { Router } from "express";
import { asyncHandler } from "../../lib/asyncHandler";
import { verifyJwt } from "../../middleware/auth";
import { requireRole } from "../../middleware/rbac";
import { validateBody } from "../../middleware/validate";
import {
  changeStatusSchema,
  bookingDetailsSchema,
  retailDetailsSchema,
  updateKeyDateSchema,
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
  createNoteSchema,
} from "./enquiries.schema";
import {
  getEnquiryHandler,
  changeStatusHandler,
  updateBookingHandler,
  updateRetailHandler,
  updateKeyDateHandler,
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
  getNotesHandler,
  addNoteHandler,
} from "./enquiries.controller";

const router = Router();

router.use(verifyJwt);

router.get("/:enquiryId", asyncHandler(getEnquiryHandler));

router.patch("/:enquiryId/status", validateBody(changeStatusSchema), asyncHandler(changeStatusHandler));
router.patch("/:enquiryId/details", validateBody(enquiryDetailsSchema), asyncHandler(updateDetailsHandler));
router.patch("/:enquiryId/booking", validateBody(bookingDetailsSchema), asyncHandler(updateBookingHandler));
router.patch("/:enquiryId/retail", validateBody(retailDetailsSchema), asyncHandler(updateRetailHandler));
router.patch("/:enquiryId/key-dates", validateBody(updateKeyDateSchema), asyncHandler(updateKeyDateHandler));

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

// Private notes — reads are scoped to the caller inside the service, never by query param.
router.get("/:enquiryId/notes", asyncHandler(getNotesHandler));
router.post("/:enquiryId/notes", validateBody(createNoteSchema), asyncHandler(addNoteHandler));

export default router;
