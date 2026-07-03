import { Request, Response } from "express";
import { UnauthorizedError, ValidationError } from "../../lib/errors";
import * as mediaService from "./media.service";
import { ListMediaQuery } from "./media.schema";

export async function uploadMediaHandler(req: Request, res: Response) {
  if (!req.user) throw new UnauthorizedError();
  if (!req.file) throw new ValidationError("No file uploaded");
  const result = await mediaService.uploadMedia(req.file.buffer, req.body, req.user.id);
  res.status(201).json(result);
}

export async function listMediaHandler(req: Request, res: Response) {
  const result = await mediaService.listMedia(req.query as unknown as ListMediaQuery);
  res.json(result);
}

export async function deleteMediaHandler(req: Request, res: Response) {
  await mediaService.deleteMedia(req.params.mediaId);
  res.status(204).send();
}
