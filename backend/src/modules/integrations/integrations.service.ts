import axios from "axios";
import { google } from "googleapis";
import { RoomServiceClient } from "livekit-server-sdk";
import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";
import { v2 as cloudinary } from "cloudinary";
import { IntegrationKey as PrismaIntegrationKey } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { encryptJson, decryptJson } from "../../lib/crypto";
import { ForbiddenError, NotFoundError, ValidationError } from "../../lib/errors";
import {
  CREDENTIAL_SCHEMAS,
  IntegrationKey,
  MetaAdsCredentials,
  WhatsappCredentials,
  InstagramCredentials,
  GoogleSheetsCredentials,
  LivekitCredentials,
  TelecmiCredentials,
  GeminiCredentials,
  OpenAiCredentials,
  CloudinaryCredentials,
  CallmaticCredentials,
} from "./integrations.schema";

const GRAPH_API_BASE = "https://graph.facebook.com/v19.0";

const ALL_KEYS: IntegrationKey[] = [
  "META_ADS",
  "WHATSAPP",
  "INSTAGRAM",
  "GOOGLE_SHEETS",
  "LIVEKIT",
  "TELECMI",
  "GEMINI",
  "OPENAI",
  "CLOUDINARY",
  "CALLMATIC",
];

export async function listConfigs() {
  const rows = await prisma.integrationConfig.findMany();
  const rowByKey = new Map(rows.map((r) => [r.key, r]));

  return ALL_KEYS.map((key) => {
    const row = rowByKey.get(key as PrismaIntegrationKey);
    return {
      key,
      status: row?.status ?? "NOT_CONFIGURED",
      hasCredentials: !!row?.encryptedCredentials,
      enabled: row?.enabled ?? true,
      lastError: row?.lastError ?? null,
      lastTestedAt: row?.lastTestedAt ?? null,
      updatedAt: row?.updatedAt ?? null,
    };
  });
}

export async function setEnabled(key: IntegrationKey, enabled: boolean, updatedById: string) {
  await prisma.integrationConfig.upsert({
    where: { key: key as PrismaIntegrationKey },
    create: { key: key as PrismaIntegrationKey, enabled, updatedById },
    update: { enabled, updatedById },
  });
}

export async function saveCredentials(key: IntegrationKey, rawCredentials: unknown, updatedById: string) {
  const schema = CREDENTIAL_SCHEMAS[key];
  const parsed = schema.safeParse(rawCredentials);
  if (!parsed.success) {
    throw new ValidationError("Invalid credentials for this integration", parsed.error.flatten());
  }

  const encrypted = encryptJson(parsed.data);

  await prisma.integrationConfig.upsert({
    where: { key: key as PrismaIntegrationKey },
    create: {
      key: key as PrismaIntegrationKey,
      encryptedCredentials: encrypted,
      status: "CONNECTED",
      enabled: true,
      updatedById,
    },
    update: {
      encryptedCredentials: encrypted,
      status: "CONNECTED",
      lastError: null,
      updatedById,
      // enabled is intentionally left untouched — re-saving/re-authorizing credentials
      // shouldn't silently flip an integration an admin turned off back on.
    },
  });
}

export async function deleteCredentials(key: IntegrationKey) {
  const existing = await prisma.integrationConfig.findUnique({ where: { key: key as PrismaIntegrationKey } });
  if (!existing) return;
  await prisma.integrationConfig.update({
    where: { key: key as PrismaIntegrationKey },
    data: { encryptedCredentials: null, status: "NOT_CONFIGURED", lastError: null, lastTestedAt: null },
  });
}

async function getCredentials<T>(key: IntegrationKey): Promise<T> {
  const row = await prisma.integrationConfig.findUnique({ where: { key: key as PrismaIntegrationKey } });
  if (!row?.encryptedCredentials) {
    throw new NotFoundError(`${key} is not configured`);
  }
  // Single chokepoint: every credential consumer in the codebase (webhooks, outbound
  // sends, sync jobs, AI providers) goes through here, so this is the one place the
  // enable/disable toggle needs to be enforced.
  if (!row.enabled) {
    throw new ForbiddenError(`${key} is disabled`);
  }
  return decryptJson<T>(row.encryptedCredentials);
}

export const getMetaAdsCredentials = () => getCredentials<MetaAdsCredentials>("META_ADS");

/**
 * Reads just the connected Facebook identity for display purposes, bypassing the `enabled`
 * gate — an admin who disabled Meta Ads should still see who it's connected as, not a
 * "logged out" state, since disabling doesn't clear the saved login.
 */
export async function getMetaAdsIdentity(): Promise<{ fbUserId: string; fbUserName: string } | null> {
  const row = await prisma.integrationConfig.findUnique({ where: { key: "META_ADS" } });
  if (!row?.encryptedCredentials) return null;
  const creds = decryptJson<MetaAdsCredentials>(row.encryptedCredentials);
  return { fbUserId: creds.fbUserId, fbUserName: creds.fbUserName };
}
export const getWhatsappCredentials = () => getCredentials<WhatsappCredentials>("WHATSAPP");
export const getInstagramCredentials = () => getCredentials<InstagramCredentials>("INSTAGRAM");
export const getGoogleSheetsCredentials = () => getCredentials<GoogleSheetsCredentials>("GOOGLE_SHEETS");
export const getLivekitCredentials = () => getCredentials<LivekitCredentials>("LIVEKIT");
export const getTelecmiCredentials = () => getCredentials<TelecmiCredentials>("TELECMI");
export const getGeminiCredentials = () => getCredentials<GeminiCredentials>("GEMINI");
export const getOpenAiCredentials = () => getCredentials<OpenAiCredentials>("OPENAI");
export const getCloudinaryCredentials = () => getCredentials<CloudinaryCredentials>("CLOUDINARY");
export const getCallmaticCredentials = () => getCredentials<CallmaticCredentials>("CALLMATIC");

/** Configures the shared cloudinary SDK instance from stored credentials; call before any upload/delete. */
export async function configureCloudinary() {
  const creds = await getCloudinaryCredentials();
  cloudinary.config({ cloud_name: creds.cloudName, api_key: creds.apiKey, api_secret: creds.apiSecret });
  return cloudinary;
}

async function markResult(key: IntegrationKey, ok: boolean, errorMessage?: string) {
  await prisma.integrationConfig.update({
    where: { key: key as PrismaIntegrationKey },
    data: {
      status: ok ? "CONNECTED" : "ERROR",
      lastError: ok ? null : (errorMessage ?? "Unknown error"),
      lastTestedAt: new Date(),
    },
  });
}

export async function testConnection(key: IntegrationKey): Promise<{ ok: boolean; message: string }> {
  try {
    switch (key) {
      case "META_ADS": {
        const creds = await getMetaAdsCredentials();
        const { data } = await axios.get(`${GRAPH_API_BASE}/me`, {
          params: { fields: "id,name", access_token: creds.longLivedUserAccessToken },
        });
        await markResult(key, true);
        return { ok: true, message: `Connected as ${data.name}` };
      }
      case "WHATSAPP": {
        const creds = await getWhatsappCredentials();
        const { data } = await axios.get(`${GRAPH_API_BASE}/${creds.phoneNumberId}`, {
          params: { fields: "id,display_phone_number", access_token: creds.accessToken },
        });
        await markResult(key, true);
        return { ok: true, message: `Connected to WhatsApp number ${data.display_phone_number ?? data.id}` };
      }
      case "INSTAGRAM": {
        const creds = await getInstagramCredentials();
        const { data } = await axios.get(`${GRAPH_API_BASE}/${creds.instagramBusinessAccountId}`, {
          params: { fields: "id,username", access_token: creds.accessToken },
        });
        await markResult(key, true);
        return { ok: true, message: `Connected to Instagram @${data.username ?? data.id}` };
      }
      case "GOOGLE_SHEETS": {
        const creds = await getGoogleSheetsCredentials();
        const serviceAccount = JSON.parse(creds.serviceAccountJson);
        const auth = new google.auth.JWT({
          email: serviceAccount.client_email,
          key: serviceAccount.private_key,
          scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
        });
        await auth.authorize();
        await markResult(key, true);
        return { ok: true, message: `Authenticated as ${serviceAccount.client_email}` };
      }
      case "LIVEKIT": {
        const creds = await getLivekitCredentials();
        const httpUrl = creds.serverUrl.replace(/^wss:/, "https:").replace(/^ws:/, "http:");
        const client = new RoomServiceClient(httpUrl, creds.apiKey, creds.apiSecret);
        const rooms = await client.listRooms();
        await markResult(key, true);
        return { ok: true, message: `Connected — ${rooms.length} active room(s)` };
      }
      case "TELECMI": {
        // TeleCMI has no generic "verify SIP trunk" REST call — genuine verification only
        // happens on an actual dial attempt. We just confirm the credentials decrypt and
        // required fields are present; real validation happens the first time a call is placed.
        await getTelecmiCredentials();
        await markResult(key, true);
        return { ok: true, message: "Credentials saved. SIP trunk connectivity is verified on the first outbound call." };
      }
      case "GEMINI": {
        const creds = await getGeminiCredentials();
        const ai = new GoogleGenAI({ apiKey: creds.apiKey });
        const models = await ai.models.list();
        await markResult(key, true);
        const count = Array.isArray((models as { page?: unknown[] }).page)
          ? (models as { page: unknown[] }).page.length
          : undefined;
        return { ok: true, message: count !== undefined ? `Connected — ${count} model(s) available` : "Connected" };
      }
      case "OPENAI": {
        const creds = await getOpenAiCredentials();
        const client = new OpenAI({ apiKey: creds.apiKey });
        const models = await client.models.list();
        await markResult(key, true);
        return { ok: true, message: `Connected — ${models.data.length} model(s) available` };
      }
      case "CLOUDINARY": {
        const creds = await getCloudinaryCredentials();
        cloudinary.config({ cloud_name: creds.cloudName, api_key: creds.apiKey, api_secret: creds.apiSecret });
        await cloudinary.api.ping();
        await markResult(key, true);
        return { ok: true, message: `Connected to Cloudinary cloud "${creds.cloudName}"` };
      }
      case "CALLMATIC": {
        const creds = await getCallmaticCredentials();
        // Since there is no generic "verify API key" endpoint documented, we can just save it or make a mock call.
        // Or we can try to fetch the campaign status, but there's no endpoint provided for that in the prompt.
        // We'll mark it as true for now if credentials exist.
        await markResult(key, true);
        return { ok: true, message: `Callmatic credentials saved.` };
      }
      default:
        throw new ValidationError(`Unsupported integration key: ${key}`);
    }
  } catch (err) {
    const message = axios.isAxiosError(err)
      ? JSON.stringify(err.response?.data ?? err.message)
      : err instanceof Error
        ? err.message
        : "Unknown error";
    await markResult(key, false, message);
    return { ok: false, message };
  }
}
