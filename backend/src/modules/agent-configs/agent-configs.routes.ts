import { Router } from "express";
import { asyncHandler } from "../../lib/asyncHandler";
import { verifyJwt } from "../../middleware/auth";
import { requireRole } from "../../middleware/rbac";
import { validateBody } from "../../middleware/validate";
import { upsertAgentConfigSchema, generatePromptSchema } from "./agent-configs.schema";
import { listAgentConfigsHandler, upsertAgentConfigHandler, generatePromptHandler } from "./agent-configs.controller";

const router = Router();

router.use(verifyJwt, requireRole("SUPER_ADMIN", "ADMIN"));

router.get("/", asyncHandler(listAgentConfigsHandler));
router.put("/:type", validateBody(upsertAgentConfigSchema), asyncHandler(upsertAgentConfigHandler));
router.post("/generate-prompt", validateBody(generatePromptSchema), asyncHandler(generatePromptHandler));

export default router;
