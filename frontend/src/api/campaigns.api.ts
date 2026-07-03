import { axiosClient } from "./axiosClient";
import type { MessageTemplate } from "./templates.api";

export interface SegmentFilters {
  status?: string;
  source?: string;
  branchId?: string;
  assignedCrId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface MessageCampaign {
  id: string;
  name: string;
  status: "DRAFT" | "RUNNING" | "PAUSED" | "COMPLETED";
  segmentFilters: SegmentFilters;
  template: MessageTemplate;
  createdAt: string;
}

export interface CreateMessageCampaignPayload {
  name: string;
  templateId: string;
  segmentFilters: SegmentFilters;
}

export async function fetchMessageCampaigns(): Promise<MessageCampaign[]> {
  const { data } = await axiosClient.get<MessageCampaign[]>("/campaigns");
  return data;
}

export async function createMessageCampaign(payload: CreateMessageCampaignPayload): Promise<MessageCampaign> {
  const { data } = await axiosClient.post<MessageCampaign>("/campaigns", payload);
  return data;
}

export async function previewSegment(filters: SegmentFilters): Promise<number> {
  const { data } = await axiosClient.get<{ count: number }>("/campaigns/segment-preview", { params: filters });
  return data.count;
}

export async function runMessageCampaign(campaignId: string): Promise<void> {
  await axiosClient.post(`/campaigns/${campaignId}/run`);
}
