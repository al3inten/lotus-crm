import { Router } from "express";
import { asyncHandler } from "../../lib/asyncHandler";
import { verifyJwt } from "../../middleware/auth";
import { requirePermission } from "../../middleware/rbac";
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

router.get("/", requirePermission("social-inbox", "read"), validateQuery(listConversationsQuerySchema), asyncHandler(listConversationsHandler));
router.get("/:conversationId", requirePermission("social-inbox", "read"), asyncHandler(getConversationHandler));
router.post("/:conversationId/convert", requirePermission("social-inbox", "write"), validateBody(convertConversationSchema), asyncHandler(convertConversationHandler));
router.patch("/:conversationId/ignore", requirePermission("social-inbox", "write"), asyncHandler(ignoreConversationHandler));

export default router;
