import { Router } from "express";
import { asyncHandler } from "../../lib/asyncHandler";
import { verifyJwt } from "../../middleware/auth";
import { requirePermission, requireCustomerReassignRights } from "../../middleware/rbac";
import { requireEnquiryOwnership, requireEnquiryBranchScope } from "../../middleware/enquiryOwnership";
import { validateBody } from "../../middleware/validate";
import {
  changeStatusSchema,
  bookingDetailsSchema,
  retailDetailsSchema,
  rtoDetailsSchema,
  deliveryDateSchema,
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
  closeFollowUpSchema,
  reopenSchema,
  createCommentSchema,
  createNoteSchema,
} from "./enquiries.schema";
import {
  getEnquiryHandler,
  changeStatusHandler,
  updateBookingHandler,
  updateRetailHandler,
  updateRtoHandler,
  updateDeliveryDateHandler,
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
  closeFollowUpHandler,
  reopenHandler,
  getCommentsHandler,
  addCommentHandler,
  getNotesHandler,
  addNoteHandler,
} from "./enquiries.controller";

const router = Router();

router.use(verifyJwt);

const ownership = asyncHandler(requireEnquiryOwnership);
const branchScope = asyncHandler(requireEnquiryBranchScope);

// Viewing a lead is always allowed regardless of assignment (only the mutating routes
// below additionally restrict CR_TEAM to enquiries assigned to them) — but branch scoping
// still applies, so `branchScope` (no ownership check) is used here to keep cross-branch
// enquiries out of reach without blocking view access to a teammate's assigned lead.
router.get("/:enquiryId", branchScope, asyncHandler(getEnquiryHandler));

router.patch("/:enquiryId/status", ownership, validateBody(changeStatusSchema), asyncHandler(changeStatusHandler));
router.patch("/:enquiryId/details", ownership, validateBody(enquiryDetailsSchema), asyncHandler(updateDetailsHandler));
router.patch("/:enquiryId/booking", ownership, validateBody(bookingDetailsSchema), asyncHandler(updateBookingHandler));
router.patch("/:enquiryId/retail", ownership, validateBody(retailDetailsSchema), asyncHandler(updateRetailHandler));
router.patch("/:enquiryId/rto", ownership, validateBody(rtoDetailsSchema), asyncHandler(updateRtoHandler));
router.patch("/:enquiryId/delivery-date", ownership, validateBody(deliveryDateSchema), asyncHandler(updateDeliveryDateHandler));
router.patch("/:enquiryId/key-dates", ownership, validateBody(updateKeyDateSchema), asyncHandler(updateKeyDateHandler));

router.patch(
  "/:enquiryId/reassign",
  ownership,
  requireCustomerReassignRights,
  validateBody(reassignSchema),
  asyncHandler(reassignHandler)
);

router.post("/:enquiryId/test-drive", ownership, validateBody(testDriveSchema), asyncHandler(testDriveHandler));
router.patch("/:enquiryId/test-drive/:testDriveId", ownership, validateBody(updateTestDriveSchema), asyncHandler(updateTestDriveHandler));
router.post("/:enquiryId/quotation", ownership, validateBody(quotationSchema), asyncHandler(quotationHandler));
router.post("/:enquiryId/exchange-evaluation", ownership, validateBody(exchangeEvaluationSchema), asyncHandler(exchangeHandler));
router.post("/:enquiryId/finance", ownership, validateBody(financeApplicationSchema), asyncHandler(financeHandler));
router.post("/:enquiryId/delivery", ownership, validateBody(deliveryDetailsSchema), asyncHandler(deliveryHandler));
router.post("/:enquiryId/follow-ups", ownership, validateBody(createFollowUpSchema), asyncHandler(addFollowUpHandler));
router.post("/:enquiryId/follow-ups/close", ownership, validateBody(closeFollowUpSchema), asyncHandler(closeFollowUpHandler));
router.post("/:enquiryId/reopen", ownership, validateBody(reopenSchema), asyncHandler(reopenHandler));
router.get("/:enquiryId/comments", asyncHandler(getCommentsHandler));
router.post("/:enquiryId/comments", ownership, validateBody(createCommentSchema), asyncHandler(addCommentHandler));

// Private notes — reads are scoped to the caller inside the service, never by query param.
// Adding one isn't really "acting on the lead" the way status/detail edits are, and CRs may
// want to jot a private note on any lead they're reviewing — left unrestricted.
router.get("/:enquiryId/notes", asyncHandler(getNotesHandler));
router.post("/:enquiryId/notes", validateBody(createNoteSchema), asyncHandler(addNoteHandler));

export default router;
