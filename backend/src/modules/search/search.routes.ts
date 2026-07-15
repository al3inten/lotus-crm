import { Router } from "express";
import { asyncHandler } from "../../lib/asyncHandler";
import { verifyJwt } from "../../middleware/auth";
import { applyBranchScope } from "../../middleware/branchScope";
import { globalSearchHandler } from "./search.controller";

const router = Router();

router.use(verifyJwt, applyBranchScope);
router.get("/", asyncHandler(globalSearchHandler));

export default router;
