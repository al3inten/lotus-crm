import { Router } from "express";
import { asyncHandler } from "../../lib/asyncHandler";
import { validateBody } from "../../middleware/validate";
import { verifyJwt } from "../../middleware/auth";
import { loginSchema } from "./auth.schema";
import { loginHandler, meHandler } from "./auth.controller";

const router = Router();

router.post("/login", validateBody(loginSchema), asyncHandler(loginHandler));
router.get("/me", verifyJwt, asyncHandler(meHandler));

export default router;
