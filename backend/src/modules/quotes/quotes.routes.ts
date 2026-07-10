import { Router } from "express";
import { asyncHandler } from "../../lib/asyncHandler";
import { getPublicQuoteHandler } from "./quotes.controller";

const router = Router();

// Public route to view quotation
router.get("/:id", asyncHandler(getPublicQuoteHandler));

export default router;
