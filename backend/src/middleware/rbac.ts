import { NextFunction, Request, Response } from "express";
import { Role } from "@prisma/client";
import { ForbiddenError, UnauthorizedError } from "../lib/errors";

export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) throw new UnauthorizedError();
    if (!roles.includes(req.user.role)) {
      throw new ForbiddenError(`Requires one of roles: ${roles.join(", ")}`);
    }
    next();
  };
}

export const CROSS_BRANCH_ROLES: Role[] = ["SUPER_ADMIN", "ADMIN"];
export const BRANCH_STAFF_ROLES: Role[] = ["BRANCH_MANAGER", "CR_TEAM", "CONSULTANT"];
