import { Router } from "express";
import { asyncHandler } from "../../lib/asyncHandler";
import { verifyJwt } from "../../middleware/auth";
import { pincodeLookupHandler, locationSearchHandler } from "./locations.controller";

const router = Router();

router.use(verifyJwt);
router.get("/pincode/:pincode", asyncHandler(pincodeLookupHandler));
router.get("/search", asyncHandler(locationSearchHandler));

export default router;
