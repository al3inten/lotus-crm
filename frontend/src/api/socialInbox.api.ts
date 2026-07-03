import { axiosClient } from "./axiosClient";
import type { EnquiryType } from "../types";

export type SocialChannel = "WHATSAPP" | "INSTAGRAM";

export interface ChatMessage {
  id: string;
  direction: "INBOUND" | "OUTBOUND";
  body: string;
  mediaUrl?: string | null;
  createdAt: string;
}

export interface Conversation {
  id: string;
  channel: SocialChannel;
  externalContactId: string;
  contactName?: string | null;
  leadId?: string | null;
  lead?: { id: string; name: string } | null;
  isIgnored: boolean;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
}

export interface ConvertConversationPayload {
  name: string;
  phone: string;
  email?: string;
  carModel: string;
  enquiryType: EnquiryType;
  location?: string;
  branchId: string;
}

export async function fetchConversations(params: { channel?: SocialChannel; onlyUnresolved?: boolean }): Promise<Conversation[]> {
  const { data } = await axiosClient.get<Conversation[]>("/social-inbox", { params });
  return data;
}

export async function fetchConversation(conversationId: string): Promise<Conversation> {
  const { data } = await axiosClient.get<Conversation>(`/social-inbox/${conversationId}`);
  return data;
}

export async function convertConversation(conversationId: string, payload: ConvertConversationPayload): Promise<Conversation> {
  const { data } = await axiosClient.post<Conversation>(`/social-inbox/${conversationId}/convert`, payload);
  return data;
}

export async function ignoreConversation(conversationId: string): Promise<Conversation> {
  const { data } = await axiosClient.patch<Conversation>(`/social-inbox/${conversationId}/ignore`);
  return data;
}
