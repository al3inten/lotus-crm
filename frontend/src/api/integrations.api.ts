import { axiosClient } from "./axiosClient";

export type IntegrationKey =
  | "META_APP"
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
  enabled: boolean;
  lastError: string | null;
  lastTestedAt: string | null;
  updatedAt: string | null;
}

export interface MetaAdsPageSummary {
  pageId: string;
  pageName: string;
  leadFormCount: number;
  webhookSubscribed: boolean;
  lastSyncedAt: string | null;
}

export interface MetaAdsStatus {
  connected: boolean;
  fbUserName: string | null;
  pages: MetaAdsPageSummary[];
}

export interface MetaAppConfig {
  configured: boolean;
  appId: string | null;
  redirectUri: string;
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

export async function toggleIntegration(key: IntegrationKey, enabled: boolean): Promise<void> {
  await axiosClient.patch(`/integrations/${key}/enabled`, { enabled });
}

export async function fetchMetaAppConfig(): Promise<MetaAppConfig> {
  const { data } = await axiosClient.get<MetaAppConfig>("/integrations/meta/app-config");
  return data;
}

export async function startMetaOAuth(): Promise<{ url: string }> {
  const { data } = await axiosClient.get<{ url: string }>("/integrations/meta/oauth/start");
  return data;
}

export async function fetchMetaAdsStatus(): Promise<MetaAdsStatus> {
  const { data } = await axiosClient.get<MetaAdsStatus>("/integrations/meta/pages");
  return data;
}

export async function disconnectMetaAds(): Promise<void> {
  await axiosClient.post("/integrations/meta/disconnect");
}

export async function syncMetaAdsPage(pageId: string): Promise<{ created: number }> {
  const { data } = await axiosClient.post<{ created: number }>(`/integrations/meta/pages/${pageId}/sync`);
  return data;
}

export async function syncAllMetaAdsPages(): Promise<{ created: number }> {
  const { data } = await axiosClient.post<{ created: number }>("/integrations/meta/sync-all");
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
