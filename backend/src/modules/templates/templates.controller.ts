import { Request, Response } from "express";
import { UnauthorizedError } from "../../lib/errors";
import * as templatesService from "./templates.service";

export async function listTemplatesHandler(_req: Request, res: Response) {
  res.json(await templatesService.listTemplates());
}

export async function getTemplateHandler(req: Request, res: Response) {
  res.json(await templatesService.getTemplate(req.params.templateId));
}

export async function createTemplateHandler(req: Request, res: Response) {
  if (!req.user) throw new UnauthorizedError();
  const template = await templatesService.createTemplate(req.body, req.user.id);
  res.status(201).json(template);
}

export async function updateTemplateHandler(req: Request, res: Response) {
  res.json(await templatesService.updateTemplate(req.params.templateId, req.body));
}

export async function deleteTemplateHandler(req: Request, res: Response) {
  await templatesService.deleteTemplate(req.params.templateId);
  res.status(204).send();
}
