import { Request, Response } from "express";
import * as settingsService from "./settings.service";

export async function getSettingsHandler(req: Request, res: Response) {
  const settings = await settingsService.getSystemSettings();
  res.json(settings);
}

export async function updateSettingsHandler(req: Request, res: Response) {
  const settings = await settingsService.updateSystemSettings(req.body);
  res.json(settings);
}
