import { Router } from "express";
import multer from "multer";
import { asyncHandler } from "../../lib/asyncHandler";
import { verifyJwt } from "../../middleware/auth";
import { requireRole } from "../../middleware/rbac";
import { validateBody, validateQuery } from "../../middleware/validate";
import { uploadMediaSchema, listMediaQuerySchema } from "./media.schema";
import { uploadMediaHandler, listMediaHandler, deleteMediaHandler } from "./media.controller";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB — enough for a short car walkaround video
});

const router = Router();

router.use(verifyJwt, requireRole("SUPER_ADMIN", "ADMIN", "BRANCH_MANAGER"));

router.get("/", validateQuery(listMediaQuerySchema), asyncHandler(listMediaHandler));
router.post("/", upload.single("file"), validateBody(uploadMediaSchema), asyncHandler(uploadMediaHandler));
router.delete("/:mediaId", asyncHandler(deleteMediaHandler));

export default router;
