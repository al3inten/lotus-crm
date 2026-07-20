import { Router } from "express";
import { Request, Response } from "express";
import { asyncHandler } from "../../lib/asyncHandler";
import { verifyJwt } from "../../middleware/auth";
import { requireRole } from "../../middleware/rbac";
import { validateBody, validateQuery } from "../../middleware/validate";
import {
  createStaffDepartmentSchema,
  updateStaffDepartmentSchema,
  listStaffDepartmentsQuerySchema,
  ListStaffDepartmentsQuery,
} from "./staff-departments.schema";
import * as service from "./staff-departments.service";

const router = Router();

router.use(verifyJwt, requireRole("SUPER_ADMIN", "ADMIN", "BRANCH_MANAGER"));

router.get(
  "/",
  validateQuery(listStaffDepartmentsQuerySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as unknown as ListStaffDepartmentsQuery;
    res.json(await service.listStaffDepartments(query.branchId));
  })
);

router.post(
  "/",
  requireRole("SUPER_ADMIN", "ADMIN"),
  validateBody(createStaffDepartmentSchema),
  asyncHandler(async (req: Request, res: Response) => {
    res.status(201).json(await service.createStaffDepartment(req.body));
  })
);

router.patch(
  "/:departmentId",
  requireRole("SUPER_ADMIN", "ADMIN"),
  validateBody(updateStaffDepartmentSchema),
  asyncHandler(async (req: Request, res: Response) => {
    res.json(await service.updateStaffDepartment(req.params.departmentId, req.body));
  })
);

router.delete(
  "/:departmentId",
  requireRole("SUPER_ADMIN", "ADMIN"),
  asyncHandler(async (req: Request, res: Response) => {
    await service.deleteStaffDepartment(req.params.departmentId);
    res.status(204).send();
  })
);

export default router;
