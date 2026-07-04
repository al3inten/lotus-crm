import { Request, Response } from "express";
import { Role } from "@prisma/client";
import * as usersService from "./users.service";

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
