import { Router } from "express";
import { Request, Response } from "express";
import { asyncHandler } from "../../lib/asyncHandler";
import { verifyJwt } from "../../middleware/auth";
import { requireRole } from "../../middleware/rbac";
import { validateBody, validateQuery } from "../../middleware/validate";
import { createRoleSchema, updateRoleSchema, listRolesQuerySchema, ListRolesQuery } from "./roles.schema";
import * as rolesService from "./roles.service";

const router = Router();

router.use(verifyJwt, requireRole("SUPER_ADMIN", "ADMIN", "BRANCH_MANAGER"));

router.get(
  "/",
  validateQuery(listRolesQuerySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as unknown as ListRolesQuery;
    res.json(await rolesService.listRoles(query.branchId));
  })
);

router.post(
  "/",
  requireRole("SUPER_ADMIN", "ADMIN"),
  validateBody(createRoleSchema),
  asyncHandler(async (req: Request, res: Response) => {
    res.status(201).json(await rolesService.createRole(req.body));
  })
);

router.patch(
  "/:roleId",
  requireRole("SUPER_ADMIN", "ADMIN"),
  validateBody(updateRoleSchema),
  asyncHandler(async (req: Request, res: Response) => {
    res.json(await rolesService.updateRole(req.params.roleId, req.body));
  })
);

router.delete(
  "/:roleId",
  requireRole("SUPER_ADMIN", "ADMIN"),
  asyncHandler(async (req: Request, res: Response) => {
    await rolesService.deleteRole(req.params.roleId);
    res.status(204).send();
  })
);

export default router;
