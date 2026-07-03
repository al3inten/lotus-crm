import { Request, Response } from "express";
import { AgentType } from "@prisma/client";
import { UnauthorizedError, ValidationError } from "../../lib/errors";
import * as agentConfigsService from "./agent-configs.service";

const VALID_TYPES = new Set<string>(["VOICE", "WHATSAPP_CHATBOT", "INSTAGRAM_CHATBOT"]);

function parseType(raw: string): AgentType {
  if (!VALID_TYPES.has(raw)) throw new ValidationError(`Unknown agent type: ${raw}`);
  return raw as AgentType;
}

export async function listAgentConfigsHandler(_req: Request, res: Response) {
  res.json(await agentConfigsService.listAgentConfigs());
}

export async function upsertAgentConfigHandler(req: Request, res: Response) {
  if (!req.user) throw new UnauthorizedError();
  const type = parseType(req.params.type);
  const result = await agentConfigsService.upsertAgentConfig(type, req.body, req.user.id);
  res.json(result);
}

export async function generatePromptHandler(req: Request, res: Response) {
  const prompt = await agentConfigsService.generateSystemPrompt(req.body);
  res.json({ systemPrompt: prompt });
}
