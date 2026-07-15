import OpenAI from "openai";
import { AgentType } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import * as integrationsService from "../integrations/integrations.service";
import { UpsertAgentConfigInput, GeneratePromptInput } from "./agent-configs.schema";

const DEFAULT_NAMES: Record<AgentType, string> = {
  VOICE: "Outbound Voice Agent",
  WHATSAPP_CHATBOT: "WhatsApp Chatbot",
  INSTAGRAM_CHATBOT: "Instagram Chatbot",
};

export async function listAgentConfigs() {
  const types: AgentType[] = ["VOICE", "WHATSAPP_CHATBOT", "INSTAGRAM_CHATBOT"];
  const rows = await prisma.agentConfig.findMany();
  const byType = new Map(rows.map((r) => [r.type, r]));

  return types.map(
    (type) =>
      byType.get(type) ?? { type, name: DEFAULT_NAMES[type], systemPrompt: "", isActive: false, autoCallEnabled: false }
  );
}

export async function upsertAgentConfig(type: AgentType, input: UpsertAgentConfigInput, updatedById: string) {
  return prisma.agentConfig.upsert({
    where: { type },
    create: {
      type,
      name: input.name,
      systemPrompt: input.systemPrompt,
      voiceName: input.voiceName,
      model: input.model,
      isActive: input.isActive ?? false,
      autoCallEnabled: input.autoCallEnabled ?? false,
      updatedById,
    },
    update: {
      name: input.name,
      systemPrompt: input.systemPrompt,
      voiceName: input.voiceName,
      model: input.model,
      isActive: input.isActive,
      autoCallEnabled: input.autoCallEnabled,
      updatedById,
    },
  });
}

export async function getActiveAgentConfig(type: AgentType) {
  const config = await prisma.agentConfig.findUnique({ where: { type } });
  return config?.isActive ? config : null;
}

const META_PROMPT = `You are an expert at writing system prompts for AI sales agents at a Hyundai car dealership in India.
Write a clear, well-structured system prompt for the agent described below. The prompt should cover:
- The agent's role and tone (professional, warm, concise — this is a real sales conversation, not generic customer support)
- What the agent should try to accomplish in the conversation
- Explicit dos and don'ts (never invent pricing/discounts, never make promises about availability, always confirm the customer's name and car of interest)
- When to hand off to a human CR team member
- Dealership context: this is Lotus D-CRM for a Hyundai dealer group.

Output only the system prompt text itself, no preamble or explanation.`;

export async function generateSystemPrompt(input: GeneratePromptInput): Promise<string> {
  const creds = await integrationsService.getOpenAiCredentials();
  const client = new OpenAI({ apiKey: creds.apiKey });

  const agentTypeLabel = input.agentType === "VOICE" ? "outbound phone call voice agent" : "chat agent";

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: META_PROMPT },
      {
        role: "user",
        content: `Agent type: ${agentTypeLabel}\nWhat this agent should do: ${input.description}`,
      },
    ],
  });

  return response.choices[0]?.message?.content?.trim() ?? "";
}
