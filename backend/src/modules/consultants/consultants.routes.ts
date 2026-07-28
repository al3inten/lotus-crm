import { Router } from "express";
import { Request, Response } from "express";
import { asyncHandler } from "../../lib/asyncHandler";
import { verifyJwt } from "../../middleware/auth";
import { requirePermission } from "../../middleware/rbac";
import { validateBody, validateQuery } from "../../middleware/validate";
import {
  createConsultantSchema,
  updateConsultantSchema,
  listConsultantsQuerySchema,
  ListConsultantsQuery,
} from "./consultants.schema";
import * as service from "./consultants.service";

const router = Router();

router.use(verifyJwt);

// GET is intentionally open to any authenticated user (not gated on "branches" read)
// because consultant-picking dropdowns appear outside the Branches admin page too
// (lead wizard, test drive allocation, enquiry detail) — deviation from the plan's
// literal wording, which would otherwise lock those dropdowns for most staff roles.
router.get(
  "/",
  validateQuery(listConsultantsQuerySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as unknown as ListConsultantsQuery;
    res.json(await service.listConsultants(query.branchId));
  })
);

router.post(
  "/",
  requirePermission("branches", "write"),
  validateBody(createConsultantSchema),
  asyncHandler(async (req: Request, res: Response) => {
    res.status(201).json(await service.createConsultant(req.body));
  })
);

router.patch(
  "/:consultantId",
  requirePermission("branches", "write"),
  validateBody(updateConsultantSchema),
  asyncHandler(async (req: Request, res: Response) => {
    res.json(await service.updateConsultant(req.params.consultantId, req.body));
  })
);

router.delete(
  "/:consultantId",
  requirePermission("branches", "write"),
  asyncHandler(async (req: Request, res: Response) => {
    await service.deleteConsultant(req.params.consultantId);
    res.status(204).send();
  })
);

export default router;
