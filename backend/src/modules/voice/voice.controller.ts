import { Request, Response } from "express";
import { UnauthorizedError } from "../../lib/errors";
import * as voiceService from "./voice.service";

export async function listCallCampaignsHandler(_req: Request, res: Response) {
  res.json(await voiceService.listCallCampaigns());
}

export async function createCallCampaignHandler(req: Request, res: Response) {
  if (!req.user) throw new UnauthorizedError();
  const campaign = await voiceService.createCallCampaign(req.body, req.user.id);
  res.status(201).json(campaign);
}

export async function startCampaignHandler(req: Request, res: Response) {
  res.json(await voiceService.startCampaign(req.params.campaignId));
}

export async function pauseCampaignHandler(req: Request, res: Response) {
  res.json(await voiceService.pauseCampaign(req.params.campaignId));
}

export async function getCallLogsForLeadHandler(req: Request, res: Response) {
  res.json(await voiceService.getCallLogsForLead(req.params.leadId));
}
