import { z } from "zod";

export const upsertAgentConfigSchema = z.object({
  name: z.string().min(1),
  systemPrompt: z.string(),
  voiceName: z.string().optional(),
  model: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const generatePromptSchema = z.object({
  agentType: z.enum(["VOICE", "WHATSAPP_CHATBOT", "INSTAGRAM_CHATBOT"]),
  description: z.string().min(1, "Describe what the agent should do"),
});

export type UpsertAgentConfigInput = z.infer<typeof upsertAgentConfigSchema>;
export type GeneratePromptInput = z.infer<typeof generatePromptSchema>;
