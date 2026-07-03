import { axiosClient } from "./axiosClient";
import type { MediaAsset } from "./media.api";

export interface MessageTemplate {
  id: string;
  name: string;
  channel: "WHATSAPP" | "INSTAGRAM";
  category: string;
  bodyText: string;
  mediaAssetId?: string | null;
  mediaAsset?: MediaAsset | null;
  metaTemplateName?: string | null;
  metaApprovalStatus?: string | null;
  createdAt: string;
}

export interface CreateTemplatePayload {
  name: string;
  channel: "WHATSAPP" | "INSTAGRAM";
  category: string;
  bodyText: string;
  mediaAssetId?: string;
  metaTemplateName?: string;
  metaApprovalStatus?: string;
}

export async function fetchTemplates(): Promise<MessageTemplate[]> {
  const { data } = await axiosClient.get<MessageTemplate[]>("/templates");
  return data;
}

export async function createTemplate(payload: CreateTemplatePayload): Promise<MessageTemplate> {
  const { data } = await axiosClient.post<MessageTemplate>("/templates", payload);
  return data;
}

export async function deleteTemplate(templateId: string): Promise<void> {
  await axiosClient.delete(`/templates/${templateId}`);
}
