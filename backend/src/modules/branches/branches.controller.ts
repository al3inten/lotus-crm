import { Request, Response } from "express";
import * as branchesService from "./branches.service";

export async function createBranchHandler(req: Request, res: Response) {
  const branch = await branchesService.createBranch(req.body);
  res.status(201).json(branch);
}

export async function listBranchesHandler(req: Request, res: Response) {
  const branches = await branchesService.listBranches(req.branchFilter);
  res.json(branches);
}

export async function getBranchHandler(req: Request, res: Response) {
  const branch = await branchesService.getBranch(req.params.branchId);
  res.json(branch);
}

export async function updateBranchHandler(req: Request, res: Response) {
  const branch = await branchesService.updateBranch(req.params.branchId, req.body);
  res.json(branch);
}

export async function toggleAutoAssignHandler(req: Request, res: Response) {
  const branch = await branchesService.setAutoAssign(req.params.branchId, req.body.autoAssignEnabled);
  res.json(branch);
}

export async function deleteBranchHandler(req: Request, res: Response) {
  await branchesService.deleteBranch(req.params.branchId);
  res.status(204).send();
}
