import { z } from "zod";

// The Meta Developer App's own App ID/Secret, entered once so the OAuth "Login with Facebook"
// flow (metaOAuth.service.ts) has something to build the auth URL with — falls back to the
// FACEBOOK_APP_ID/FACEBOOK_APP_SECRET env vars when not set here.
export const metaAppCredentialsSchema = z.object({
  appId: z.string().min(1, "App ID is required"),
  appSecret: z.string().min(1, "App secret is required"),
});

// Populated by the OAuth callback (metaOAuth.controller.ts), never by a manual form —
// per-Page access tokens live in the MetaAdsPage table.
export const metaAdsCredentialsSchema = z.object({
  fbUserId: z.string().min(1),
  fbUserName: z.string().min(1),
  longLivedUserAccessToken: z.string().min(1),
});

export const whatsappCredentialsSchema = z.object({
  phoneNumberId: z.string().min(1),
  accessToken: z.string().min(1),
  appSecret: z.string().min(1),
  verifyToken: z.string().min(1),
});

export const instagramCredentialsSchema = z.object({
  instagramBusinessAccountId: z.string().min(1),
  accessToken: z.string().min(1),
  appSecret: z.string().min(1),
  verifyToken: z.string().min(1),
});

export const googleSheetsCredentialsSchema = z.object({
  serviceAccountJson: z.string().min(1, "Paste the full service account JSON key"),
});

export const livekitCredentialsSchema = z.object({
  serverUrl: z.string().min(1, "Server URL is required (e.g. wss://your-livekit-host)"),
  apiKey: z.string().min(1),
  apiSecret: z.string().min(1),
});

export const telecmiCredentialsSchema = z.object({
  sipUri: z.string().min(1, "SIP trunk URI/IP is required"),
  trunkUsername: z.string().min(1),
  trunkPassword: z.string().min(1),
  callerIdNumber: z.string().min(1, "The TeleCMI number to dial out from"),
});

export const geminiCredentialsSchema = z.object({
  apiKey: z.string().min(1),
});

export const openaiCredentialsSchema = z.object({
  apiKey: z.string().min(1),
});

export const cloudinaryCredentialsSchema = z.object({
  cloudName: z.string().min(1),
  apiKey: z.string().min(1),
  apiSecret: z.string().min(1),
});

export const callmaticCredentialsSchema = z.object({
  apiKey: z.string().min(1, "Callmatic API Key is required"),
  campaignId: z.string().min(1, "Callmatic Campaign ID is required"),
});

export const fasterqCredentialsSchema = z.object({
  apiKey: z.string().min(1, "FasterQ API Key is required"),
  // Sent by FasterQ in a custom header on webhook deliveries; also used for the GET /calls
  // polling auth check performed by testConnection.
  verifyToken: z.string().min(1),
});

export const CREDENTIAL_SCHEMAS = {
  META_APP: metaAppCredentialsSchema,
  META_ADS: metaAdsCredentialsSchema,
  WHATSAPP: whatsappCredentialsSchema,
  INSTAGRAM: instagramCredentialsSchema,
  GOOGLE_SHEETS: googleSheetsCredentialsSchema,
  LIVEKIT: livekitCredentialsSchema,
  TELECMI: telecmiCredentialsSchema,
  GEMINI: geminiCredentialsSchema,
  OPENAI: openaiCredentialsSchema,
  CLOUDINARY: cloudinaryCredentialsSchema,
  CALLMATIC: callmaticCredentialsSchema,
  FASTERQ: fasterqCredentialsSchema,
} as const;

export type IntegrationKey = keyof typeof CREDENTIAL_SCHEMAS;

export type MetaAppCredentials = z.infer<typeof metaAppCredentialsSchema>;
export type MetaAdsCredentials = z.infer<typeof metaAdsCredentialsSchema>;
export type WhatsappCredentials = z.infer<typeof whatsappCredentialsSchema>;
export type InstagramCredentials = z.infer<typeof instagramCredentialsSchema>;
export type GoogleSheetsCredentials = z.infer<typeof googleSheetsCredentialsSchema>;
export type LivekitCredentials = z.infer<typeof livekitCredentialsSchema>;
export type TelecmiCredentials = z.infer<typeof telecmiCredentialsSchema>;
export type GeminiCredentials = z.infer<typeof geminiCredentialsSchema>;
export type OpenAiCredentials = z.infer<typeof openaiCredentialsSchema>;
export type CloudinaryCredentials = z.infer<typeof cloudinaryCredentialsSchema>;
export type CallmaticCredentials = z.infer<typeof callmaticCredentialsSchema>;
export type FasterqCredentials = z.infer<typeof fasterqCredentialsSchema>;

export const saveIntegrationSchema = z.object({
  credentials: z.record(z.string(), z.unknown()),
});

export const toggleIntegrationSchema = z.object({
  enabled: z.boolean(),
});

export const syncGoogleSheetSchema = z.object({
  sheetUrl: z.string().min(1, "Sheet URL or ID is required"),
  sheetName: z.string().optional(),
  branchId: z.string().min(1),
});

export type SyncGoogleSheetInput = z.infer<typeof syncGoogleSheetSchema>;
