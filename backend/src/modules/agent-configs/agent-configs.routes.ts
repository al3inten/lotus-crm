import { Router } from "express";
import { asyncHandler } from "../../lib/asyncHandler";
import { verifyJwt } from "../../middleware/auth";
import { requirePermission } from "../../middleware/rbac";
import { validateBody } from "../../middleware/validate";
import { upsertAgentConfigSchema, generatePromptSchema } from "./agent-configs.schema";
import { listAgentConfigsHandler, upsertAgentConfigHandler, generatePromptHandler } from "./agent-configs.controller";

const router = Router();

router.use(verifyJwt);

router.get("/", requirePermission("ai-agents", "read"), asyncHandler(listAgentConfigsHandler));
router.put("/:type", requirePermission("ai-agents", "write"), validateBody(upsertAgentConfigSchema), asyncHandler(upsertAgentConfigHandler));
router.post("/generate-prompt", requirePermission("ai-agents", "write"), validateBody(generatePromptSchema), asyncHandler(generatePromptHandler));

export default router;
