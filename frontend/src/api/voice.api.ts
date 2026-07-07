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
  transcript?: string | null;
  insights?: unknown;
  createdAt: string;
}

export interface GlobalCallLog extends CallLog {
  conversation?: { lead?: { id: string; name: string } | null } | null;
}

export interface ListCallLogsFilters {
  phoneNumber?: string;
  status?: CallStatus | "";
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

export interface ListCallLogsResult {
  items: GlobalCallLog[];
  total: number;
  page: number;
  pageSize: number;
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
  callmaticCampaignId?: string | null;
  tasks: OutboundCallTask[];
}

export interface CreateCallCampaignPayload {
  name: string;
  branchId?: string;
  enquiryIds: string[];
  callmaticCampaignId?: string;
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

export async function fetchCallLogs(filters: ListCallLogsFilters): Promise<ListCallLogsResult> {
  const { data } = await axiosClient.get<ListCallLogsResult>("/voice/call-logs", {
    params: filters,
  });
  return data;
}
