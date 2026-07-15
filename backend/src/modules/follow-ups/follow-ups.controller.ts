import { Request, Response } from "express";
import { UnauthorizedError } from "../../lib/errors";
import * as followUpsService from "./follow-ups.service";
import { FollowUpListQuery, FollowUpCalendarQuery } from "./follow-ups.schema";

export async function listUpcomingFollowUpsHandler(req: Request, res: Response) {
  if (!req.user) throw new UnauthorizedError();
  const result = await followUpsService.getUpcomingFollowUps(req.query as unknown as FollowUpListQuery, {
    userId: req.user.id,
    role: req.user.role,
    branchFilter: req.branchFilter,
  });
  res.json(result);
}

export async function followUpCalendarHandler(req: Request, res: Response) {
  if (!req.user) throw new UnauthorizedError();
  const result = await followUpsService.getFollowUpCalendar(req.query as unknown as FollowUpCalendarQuery, {
    userId: req.user.id,
    role: req.user.role,
    branchFilter: req.branchFilter,
  });
  res.json(result);
}
