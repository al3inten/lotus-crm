import { axiosClient } from "./axiosClient";

export type CallStatus = "QUEUED" | "DIALING" | "IN_PROGRESS" | "COMPLETED" | "NO_ANSWER" | "FAILED";
export type CampaignStatus = "DRAFT" | "RUNNING" | "PAUSED" | "COMPLETED";

export interface CallLog {
  id: string;
  status: CallStatus;
  fromNumber: string;
  toNumber: string;
  startedAt?: string | null;
  endedAt?: string | null;
  durationSeconds?: number | null;
  recordingUrl?: string | null;
  summary?: string | null;
  createdAt: string;
}

export interface OutboundCallTask {
  id: string;
  phoneNumber: string;
  status: CallStatus;
  attemptCount: number;
  enquiry: { id: string; carModel: string; lead: { id: string; name: string } };
  callLog?: CallLog | null;
}

export interface OutboundCallCampaign {
  id: string;
  name: string;
  status: CampaignStatus;
  createdAt: string;
  tasks: OutboundCallTask[];
}

export interface CreateCallCampaignPayload {
  name: string;
  branchId?: string;
  enquiryIds: string[];
}

export async function fetchCallCampaigns(): Promise<OutboundCallCampaign[]> {
  const { data } = await axiosClient.get<OutboundCallCampaign[]>("/voice/campaigns");
  return data;
}

export async function createCallCampaign(payload: CreateCallCampaignPayload): Promise<OutboundCallCampaign> {
  const { data } = await axiosClient.post<OutboundCallCampaign>("/voice/campaigns", payload);
  return data;
}

export async function startCallCampaign(campaignId: string): Promise<OutboundCallCampaign> {
  const { data } = await axiosClient.post<OutboundCallCampaign>(`/voice/campaigns/${campaignId}/start`);
  return data;
}

export async function pauseCallCampaign(campaignId: string): Promise<OutboundCallCampaign> {
  const { data } = await axiosClient.post<OutboundCallCampaign>(`/voice/campaigns/${campaignId}/pause`);
  return data;
}

export async function fetchCallLogsForLead(leadId: string): Promise<CallLog[]> {
  const { data } = await axiosClient.get<CallLog[]>(`/voice/call-logs/lead/${leadId}`);
  return data;
}
