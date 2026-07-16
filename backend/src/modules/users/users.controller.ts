import { Request, Response } from "express";
import { Role } from "@prisma/client";
import { ForbiddenError, UnauthorizedError, ValidationError } from "../../lib/errors";
import * as usersService from "./users.service";

const MANAGER_ROLES: Role[] = ["SUPER_ADMIN", "ADMIN", "BRANCH_MANAGER"];

export async function createBranchStaffHandler(req: Request, res: Response) {
  const branchId = req.params.branchId;
  const user = await usersService.createBranchStaff(branchId, req.body);
  res.status(201).json(user);
}

export async function createUserHandler(req: Request, res: Response) {
  const user = await usersService.createUser(req.body);
  res.status(201).json(user);
}

export async function listBranchUsersHandler(req: Request, res: Response) {
  const branchId = req.params.branchId;
  const role = req.query.role as Role | undefined;
  const users = await usersService.listBranchUsers(branchId, role);
  res.json(users);
}

export async function updateUserHandler(req: Request, res: Response) {
  const user = await usersService.updateUser(req.params.userId, req.body);
  res.json(user);
}

export async function directoryHandler(_req: Request, res: Response) {
  res.json(await usersService.getDirectory());
}

export async function deleteUserHandler(req: Request, res: Response) {
  await usersService.deleteUser(req.params.userId);
  res.status(204).send();
}

export async function uploadAvatarHandler(req: Request, res: Response) {
  if (!req.user) throw new UnauthorizedError();
  const targetId = req.params.userId;
  // A user may set their own photo; managers/admins may set anyone's.
  if (targetId !== req.user.id && !MANAGER_ROLES.includes(req.user.role)) {
    throw new ForbiddenError("You can only change your own profile photo");
  }
  if (!req.file?.buffer) throw new ValidationError("No image uploaded");
  const user = await usersService.updateAvatar(targetId, req.file.buffer);
  res.json(user);
}

export async function heartbeatHandler(req: Request, res: Response) {
  if (!req.user) throw new UnauthorizedError();
  await usersService.recordHeartbeat(req.user.id);
  res.json({ ok: true });
}

export async function setBreakHandler(req: Request, res: Response) {
  if (!req.user) throw new UnauthorizedError();
  const user = await usersService.setBreak(req.user.id, req.body.onBreak);
  res.json(user);
}

export async function teamActivityHandler(req: Request, res: Response) {
  if (!req.user) throw new UnauthorizedError();
  const activity = await usersService.getTeamActivity({ role: req.user.role, branchId: req.user.branchId });
  res.json(activity);
}
