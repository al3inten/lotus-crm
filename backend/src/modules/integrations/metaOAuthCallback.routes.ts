import { Router } from "express";
import { asyncHandler } from "../../lib/asyncHandler";
import { metaOAuthCallbackHandler } from "./metaOAuth.controller";

const router = Router();

// Public — Facebook redirects the admin's browser here directly after login, so this can't
// sit behind the JWT-protected router. The signed `state` param (see metaOAuth.service.ts)
// is what proves the request is legitimate and carries which admin initiated it.
router.get("/callback", asyncHandler(metaOAuthCallbackHandler));

export default router;
