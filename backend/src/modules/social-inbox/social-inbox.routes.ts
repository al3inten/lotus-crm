import { Router } from "express";
import { asyncHandler } from "../../lib/asyncHandler";
import { verifyJwt } from "../../middleware/auth";
import { validateBody, validateQuery } from "../../middleware/validate";
import { convertConversationSchema, listConversationsQuerySchema } from "./social-inbox.schema";
import {
  listConversationsHandler,
  getConversationHandler,
  convertConversationHandler,
  ignoreConversationHandler,
} from "./social-inbox.controller";

const router = Router();

router.use(verifyJwt);

router.get("/", validateQuery(listConversationsQuerySchema), asyncHandler(listConversationsHandler));
router.get("/:conversationId", asyncHandler(getConversationHandler));
router.post("/:conversationId/convert", validateBody(convertConversationSchema), asyncHandler(convertConversationHandler));
router.patch("/:conversationId/ignore", asyncHandler(ignoreConversationHandler));

export default router;
