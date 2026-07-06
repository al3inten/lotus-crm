import { axiosClient } from "./axiosClient";

export type IntegrationKey =
  | "META_ADS"
  | "WHATSAPP"
  | "INSTAGRAM"
  | "GOOGLE_SHEETS"
  | "LIVEKIT"
  | "TELECMI"
  | "GEMINI"
  | "OPENAI"
  | "CLOUDINARY"
  | "CALLMATIC";
export type IntegrationStatus = "NOT_CONFIGURED" | "CONNECTED" | "ERROR";

export interface IntegrationConfigSummary {
  key: IntegrationKey;
  status: IntegrationStatus;
  hasCredentials: boolean;
  lastError: string | null;
  lastTestedAt: string | null;
  updatedAt: string | null;
}

export interface MetaAdsCredentials {
  pageId: string;
  pageAccessToken: string;
  appSecret: string;
  verifyToken: string;
}

export interface WhatsappCredentials {
  phoneNumberId: string;
  accessToken: string;
  appSecret: string;
  verifyToken: string;
}

export interface InstagramCredentials {
  instagramBusinessAccountId: string;
  accessToken: string;
  appSecret: string;
  verifyToken: string;
}

export interface GoogleSheetsCredentials {
  serviceAccountJson: string;
}

export async function fetchIntegrations(): Promise<IntegrationConfigSummary[]> {
  const { data } = await axiosClient.get<IntegrationConfigSummary[]>("/integrations");
  return data;
}

export async function saveIntegrationCredentials(key: IntegrationKey, credentials: Record<string, unknown>): Promise<void> {
  await axiosClient.put(`/integrations/${key}`, { credentials });
}

export async function deleteIntegration(key: IntegrationKey): Promise<void> {
  await axiosClient.delete(`/integrations/${key}`);
}

export async function testIntegrationConnection(key: IntegrationKey): Promise<{ ok: boolean; message: string }> {
  const { data } = await axiosClient.post<{ ok: boolean; message: string }>(`/integrations/${key}/test`);
  return data;
}

export interface ImportSummary {
  totalRows: number;
  created: number;
  merged: number;
  failed: number;
  errors: { row: number; message: string }[];
}

export async function syncGoogleSheet(sheetUrl: string, sheetName: string | undefined, branchId: string): Promise<ImportSummary> {
  const { data } = await axiosClient.post<ImportSummary>("/integrations/google-sheets/sync", {
    sheetUrl,
    sheetName,
    branchId,
  });
  return data;
}
