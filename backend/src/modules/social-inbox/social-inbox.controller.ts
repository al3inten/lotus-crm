import { Request, Response } from "express";
import { UnauthorizedError } from "../../lib/errors";
import * as socialInboxService from "./social-inbox.service";
import { ListConversationsQuery } from "./social-inbox.schema";

export async function listConversationsHandler(req: Request, res: Response) {
  const result = await socialInboxService.listConversations(req.query as unknown as ListConversationsQuery);
  res.json(result);
}

export async function getConversationHandler(req: Request, res: Response) {
  const result = await socialInboxService.getConversation(req.params.conversationId);
  res.json(result);
}

export async function convertConversationHandler(req: Request, res: Response) {
  if (!req.user) throw new UnauthorizedError();
  const result = await socialInboxService.convertToLead(req.params.conversationId, req.body, req.user.id);
  res.json(result);
}

export async function ignoreConversationHandler(req: Request, res: Response) {
  const result = await socialInboxService.ignoreConversation(req.params.conversationId);
  res.json(result);
}
