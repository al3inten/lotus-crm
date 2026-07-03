import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { UnauthorizedError } from "../lib/errors";
import { AuthUser } from "../types/express";

export function verifyJwt(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    throw new UnauthorizedError("Missing or malformed Authorization header");
  }

  const token = header.slice("Bearer ".length);

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as AuthUser;
    req.user = { id: payload.id, role: payload.role, branchId: payload.branchId };
    next();
  } catch {
    throw new UnauthorizedError("Invalid or expired token");
  }
}
