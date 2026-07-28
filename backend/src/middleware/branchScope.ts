import { NextFunction, Request, Response } from "express";
import { UnauthorizedError, ForbiddenError } from "../lib/errors";

// Computes req.branchFilter: undefined for SUPER_ADMIN or any role with
// canViewAllBranches, { branchId } for everyone else. Services must apply this to
// every list/aggregate query; controllers must additionally check ownership on
// single-resource routes.
export function applyBranchScope(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) throw new UnauthorizedError();

  if (req.user.role === "SUPER_ADMIN" || req.user.canViewAllBranches) {
    req.branchFilter = undefined;
    return next();
  }

  if (!req.user.branchId) {
    throw new ForbiddenError("User has no branch assigned");
  }

  req.branchFilter = { branchId: req.user.branchId };
  next();
}
