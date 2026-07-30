import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { UnauthorizedError } from "../lib/errors";
import { prisma } from "../lib/prisma";
import { MODULE_KEYS, PermissionsMap } from "../config/constants";

/** All-none permission map — used to fail closed for STAFF users who have no
 * active role definition. */
export function emptyPermissions(): PermissionsMap {
  return Object.fromEntries(MODULE_KEYS.map((key) => [key, "none"])) as PermissionsMap;
}

/**
 * Loads the caller's effective permissions/toggles from the DB on every request —
 * a role edit must take effect on the very next request, so we deliberately do not
 * trust a cached JWT payload for this. The JWT itself only carries `{ id }`.
 */
export async function loadAuthUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      roleDefinition: {
        select: {
          permissions: true,
          canViewAllBranches: true,
          restrictLeadsToOwn: true,
          canReassignCustomerCr: true,
          isActive: true,
        },
      },
    },
  });

  if (!user || !user.isActive) return null;

  const roleDefinition = user.roleDefinition && user.roleDefinition.isActive ? user.roleDefinition : null;

  const permissions: PermissionsMap =
    user.role === "SUPER_ADMIN"
      ? (Object.fromEntries(MODULE_KEYS.map((key) => [key, "write"])) as PermissionsMap)
      : roleDefinition
        ? (roleDefinition.permissions as PermissionsMap)
        : emptyPermissions();

  return {
    id: user.id,
    role: user.role,
    branchId: user.branchId,
    permissions,
    canViewAllBranches: user.role === "SUPER_ADMIN" || (roleDefinition?.canViewAllBranches ?? false),
    restrictLeadsToOwn: user.role === "SUPER_ADMIN" ? false : (roleDefinition?.restrictLeadsToOwn ?? false),
    canReassignCustomerCr: user.role === "SUPER_ADMIN" || (roleDefinition?.canReassignCustomerCr ?? false),
    isCr: user.isCr,
  };
}

export async function verifyJwt(req: Request, _res: Response, next: NextFunction) {
  // This is an async function (it does a DB lookup below), so a bare `throw` here would
  // become an unhandled promise rejection instead of an Express-handled error — Express
  // only auto-catches synchronous throws in middleware. verifyJwt is registered directly
  // as middleware all over the app (not wrapped in asyncHandler), so every error path
  // below must go through next(err) instead of throw, or one bad/expired token crashes
  // the entire server process.
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      throw new UnauthorizedError("Missing or malformed Authorization header");
    }

    const token = header.slice("Bearer ".length);

    let payload: { id: string };
    try {
      payload = jwt.verify(token, env.JWT_SECRET) as { id: string };
    } catch {
      throw new UnauthorizedError("Invalid or expired token");
    }

    const authUser = await loadAuthUser(payload.id);
    if (!authUser) throw new UnauthorizedError("User no longer exists or is inactive");

    req.user = authUser;
    next();
  } catch (err) {
    next(err);
  }
}
