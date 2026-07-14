import { Request, Response } from "express";
import { UnauthorizedError } from "../../lib/errors";
import * as followUpsService from "./follow-ups.service";
import { FollowUpListQuery } from "./follow-ups.schema";

export async function listUpcomingFollowUpsHandler(req: Request, res: Response) {
  if (!req.user) throw new UnauthorizedError();
  const result = await followUpsService.getUpcomingFollowUps(req.query as unknown as FollowUpListQuery, {
    userId: req.user.id,
    role: req.user.role,
    branchFilter: req.branchFilter,
  });
  res.json(result);
}
