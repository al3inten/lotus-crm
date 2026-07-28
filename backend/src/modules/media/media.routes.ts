import { Router } from "express";
import multer from "multer";
import { asyncHandler } from "../../lib/asyncHandler";
import { verifyJwt } from "../../middleware/auth";
import { requirePermission } from "../../middleware/rbac";
import { validateBody, validateQuery } from "../../middleware/validate";
import { uploadMediaSchema, listMediaQuerySchema } from "./media.schema";
import { uploadMediaHandler, listMediaHandler, deleteMediaHandler } from "./media.controller";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB — enough for a short car walkaround video
});

const router = Router();

router.use(verifyJwt);

router.get("/", requirePermission("media-library", "read"), validateQuery(listMediaQuerySchema), asyncHandler(listMediaHandler));
router.post("/", requirePermission("media-library", "write"), upload.single("file"), validateBody(uploadMediaSchema), asyncHandler(uploadMediaHandler));
router.delete("/:mediaId", requirePermission("media-library", "write"), asyncHandler(deleteMediaHandler));

export default router;
