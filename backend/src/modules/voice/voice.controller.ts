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

export async function listCallLogsHandler(req: Request, res: Response) {
  const { phoneNumber, status, dateFrom, dateTo, page, pageSize } = req.query;
  res.json(
    await voiceService.listCallLogs({
      phoneNumber: typeof phoneNumber === "string" ? phoneNumber : undefined,
      status: typeof status === "string" ? status : undefined,
      dateFrom: typeof dateFrom === "string" ? dateFrom : undefined,
      dateTo: typeof dateTo === "string" ? dateTo : undefined,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    })
  );
}
