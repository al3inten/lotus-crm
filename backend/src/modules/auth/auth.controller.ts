import { Request, Response } from "express";
import * as authService from "./auth.service";
import { UnauthorizedError } from "../../lib/errors";

export async function loginHandler(req: Request, res: Response) {
  const result = await authService.login(req.body);
  res.json(result);
}

export async function meHandler(req: Request, res: Response) {
  if (!req.user) throw new UnauthorizedError();
  const user = await authService.getCurrentUser(req.user.id);
  res.json(user);
}
