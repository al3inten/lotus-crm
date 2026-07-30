import { NextFunction, Request, Response } from "express";
import { Role } from "@prisma/client";
import { ForbiddenError, UnauthorizedError } from "../lib/errors";
import { ModuleKey } from "../config/constants";

export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) throw new UnauthorizedError();
    if (!roles.includes(req.user.role)) {
      throw new ForbiddenError(`Requires one of roles: ${roles.join(", ")}`);
    }
    next();
  };
}

/**
 * Enforces the per-section None/Read/Write permission model. SUPER_ADMIN always
 * passes; STAFF is checked against req.user.permissions[section] — "write" also
 * satisfies a "read" requirement.
 */
export function requirePermission(section: ModuleKey, level: "read" | "write") {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) throw new UnauthorizedError();
    if (req.user.role === "SUPER_ADMIN") return next();

    const granted = req.user.permissions[section];
    const ok = level === "read" ? granted === "read" || granted === "write" : granted === "write";
    if (!ok) {
      throw new ForbiddenError(`Requires ${level} access to ${section}`);
    }
    next();
  };
}

/**
 * Gates reassigning a customer's owning CR. SUPER_ADMIN always passes; every other role
 * needs canReassignCustomerCr explicitly enabled (a toggle in Roles & Responsibilities,
 * independent of the leads read/write grid).
 */
export function requireCustomerReassignRights(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) throw new UnauthorizedError();
  if (!req.user.canReassignCustomerCr) {
    throw new ForbiddenError("Only an admin (or a role with reassign rights) can reassign a customer's CR.");
  }
  next();
}
