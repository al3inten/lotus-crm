import { Router } from "express";
import rateLimit from "express-rate-limit";
import { asyncHandler } from "../../lib/asyncHandler";
import { validateBody } from "../../middleware/validate";
import { verifyJwt } from "../../middleware/auth";
import { loginSchema } from "./auth.schema";
import { loginHandler, meHandler } from "./auth.controller";

const router = Router();

// Strict limiter on credential submission only (not /me, which is a routine
// session check hit on every page load/focus) to slow down brute-force login
// attempts without punishing normal shared-office-IP usage.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts, please try again later." },
});

router.post("/login", loginLimiter, validateBody(loginSchema), asyncHandler(loginHandler));
router.get("/me", verifyJwt, asyncHandler(meHandler));

export default router;
