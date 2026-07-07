import { axiosClient } from "./axiosClient";

export type AgentType = "VOICE" | "WHATSAPP_CHATBOT" | "INSTAGRAM_CHATBOT";

export interface AgentConfig {
  id?: string;
  type: AgentType;
  name: string;
  systemPrompt: string;
  voiceName?: string | null;
  model?: string;
  isActive: boolean;
  autoCallEnabled: boolean;
}

export interface UpsertAgentConfigPayload {
  name: string;
  systemPrompt: string;
  voiceName?: string;
  model?: string;
  isActive?: boolean;
  autoCallEnabled?: boolean;
}

export async function fetchAgentConfigs(): Promise<AgentConfig[]> {
  const { data } = await axiosClient.get<AgentConfig[]>("/agent-configs");
  return data;
}

export async function saveAgentConfig(type: AgentType, payload: UpsertAgentConfigPayload): Promise<AgentConfig> {
  const { data } = await axiosClient.put<AgentConfig>(`/agent-configs/${type}`, payload);
  return data;
}

export async function generatePrompt(agentType: AgentType, description: string): Promise<string> {
  const { data } = await axiosClient.post<{ systemPrompt: string }>("/agent-configs/generate-prompt", {
    agentType,
    description,
  });
  return data.systemPrompt;
}
