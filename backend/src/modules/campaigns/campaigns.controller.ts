import { Request, Response } from "express";
import { UnauthorizedError } from "../../lib/errors";
import { logger } from "../../lib/logger";
import * as campaignsService from "./campaigns.service";
import { SegmentFilters } from "./campaigns.schema";

export async function listCampaignsHandler(_req: Request, res: Response) {
  res.json(await campaignsService.listCampaigns());
}

export async function createCampaignHandler(req: Request, res: Response) {
  if (!req.user) throw new UnauthorizedError();
  const campaign = await campaignsService.createCampaign(req.body, req.user.id);
  res.status(201).json(campaign);
}

export async function previewSegmentHandler(req: Request, res: Response) {
  const count = await campaignsService.previewSegmentCount(req.query as unknown as SegmentFilters);
  res.json({ count });
}

export async function runCampaignHandler(req: Request, res: Response) {
  res.status(202).json({ message: "Campaign send started" });
  campaignsService.runCampaign(req.params.campaignId).catch((err) => {
    logger.error("Campaign run failed", { campaignId: req.params.campaignId, message: err instanceof Error ? err.message : String(err) });
  });
}
