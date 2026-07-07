import { z } from "zod";

// Meta Ads no longer uses a manual credentials form — see MetaAdsForm.tsx, which now
// drives the "Login with Facebook" OAuth flow instead.

export const whatsappCredentialsFormSchema = z.object({
  phoneNumberId: z.string().min(1, "Phone number ID is required"),
  accessToken: z.string().min(1, "Access token is required"),
  appSecret: z.string().min(1, "App secret is required"),
  verifyToken: z.string().min(1, "Verify token is required"),
});
export type WhatsappCredentialsFormValues = z.infer<typeof whatsappCredentialsFormSchema>;

export const instagramCredentialsFormSchema = z.object({
  instagramBusinessAccountId: z.string().min(1, "Instagram Business Account ID is required"),
  accessToken: z.string().min(1, "Access token is required"),
  appSecret: z.string().min(1, "App secret is required"),
  verifyToken: z.string().min(1, "Verify token is required"),
});
export type InstagramCredentialsFormValues = z.infer<typeof instagramCredentialsFormSchema>;

export const googleSheetsCredentialsFormSchema = z.object({
  serviceAccountJson: z.string().min(1, "Paste the service account JSON key").refine(
    (val) => {
      try {
        JSON.parse(val);
        return true;
      } catch {
        return false;
      }
    },
    { message: "Must be valid JSON" }
  ),
});
export type GoogleSheetsCredentialsFormValues = z.infer<typeof googleSheetsCredentialsFormSchema>;

export const googleSheetSyncFormSchema = z.object({
  sheetUrl: z.string().min(1, "Sheet URL or ID is required"),
  sheetName: z.string().optional(),
  branchId: z.string().min(1, "Branch is required"),
});
export type GoogleSheetSyncFormValues = z.infer<typeof googleSheetSyncFormSchema>;

export const livekitCredentialsFormSchema = z.object({
  serverUrl: z.string().min(1, "Server URL is required (e.g. wss://your-livekit-host)"),
  apiKey: z.string().min(1, "API key is required"),
  apiSecret: z.string().min(1, "API secret is required"),
});
export type LivekitCredentialsFormValues = z.infer<typeof livekitCredentialsFormSchema>;

export const telecmiCredentialsFormSchema = z.object({
  sipUri: z.string().min(1, "SIP trunk URI/IP is required"),
  trunkUsername: z.string().min(1, "Trunk username is required"),
  trunkPassword: z.string().min(1, "Trunk password is required"),
  callerIdNumber: z.string().min(1, "Caller ID number is required"),
});
export type TelecmiCredentialsFormValues = z.infer<typeof telecmiCredentialsFormSchema>;

export const geminiCredentialsFormSchema = z.object({
  apiKey: z.string().min(1, "API key is required"),
});
export type GeminiCredentialsFormValues = z.infer<typeof geminiCredentialsFormSchema>;

export const openaiCredentialsFormSchema = z.object({
  apiKey: z.string().min(1, "API key is required"),
});
export type OpenAiCredentialsFormValues = z.infer<typeof openaiCredentialsFormSchema>;

export const cloudinaryCredentialsFormSchema = z.object({
  cloudName: z.string().min(1, "Cloud name is required"),
  apiKey: z.string().min(1, "API key is required"),
  apiSecret: z.string().min(1, "API secret is required"),
});
export type CloudinaryCredentialsFormValues = z.infer<typeof cloudinaryCredentialsFormSchema>;

export const callmaticCredentialsFormSchema = z.object({
  apiKey: z.string().min(1, "API key is required"),
  campaignId: z.string().min(1, "Campaign ID is required"),
});
export type CallmaticCredentialsFormValues = z.infer<typeof callmaticCredentialsFormSchema>;
