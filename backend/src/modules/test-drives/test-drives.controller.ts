import { Request, Response } from "express";
import { UnauthorizedError } from "../../lib/errors";
import * as testDrivesService from "./test-drives.service";
import { TestDriveListQuery } from "./test-drives.schema";

export async function listTestDrivesHandler(req: Request, res: Response) {
  if (!req.user) throw new UnauthorizedError();
  const result = await testDrivesService.getTestDrives(req.query as unknown as TestDriveListQuery, {
    userId: req.user.id,
    role: req.user.role,
    restrictLeadsToOwn: req.user.restrictLeadsToOwn,
    canViewAllBranches: req.user.canViewAllBranches,
    branchFilter: req.branchFilter,
  });
  res.json(result);
}
