import type { IntegrationKey } from "../../api/integrations.api";

export const CATEGORY_BY_KEY: Record<IntegrationKey, string> = {
  META_ADS: "Lead Source",
  GOOGLE_SHEETS: "Lead Source",
  WHATSAPP: "Lead Source",
  INSTAGRAM: "Messaging",
  LIVEKIT: "Voice",
  TELECMI: "Voice",
  GEMINI: "AI Model",
  OPENAI: "AI Model",
  CLOUDINARY: "Media",
  CALLMATIC: "Voice",
};

export const INTEGRATION_TITLES: Record<IntegrationKey, string> = {
  META_ADS: "Meta Lead Ads",
  WHATSAPP: "WhatsApp Business",
  INSTAGRAM: "Instagram",
  GOOGLE_SHEETS: "Google Sheets",
  LIVEKIT: "LiveKit (Voice)",
  TELECMI: "TeleCMI",
  GEMINI: "Gemini (AI)",
  OPENAI: "OpenAI",
  CLOUDINARY: "Cloudinary",
  CALLMATIC: "Callmatic",
};
