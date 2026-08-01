import type { IntegrationKey } from "../../api/integrations.api";

export const CATEGORY_BY_KEY: Record<IntegrationKey, string> = {
  // Not its own card (saved from within the Meta Lead Ads form) — see integrations.service.ts's
  // ALL_KEYS, which deliberately excludes it from the list the Integrations page renders.
  META_APP: "Lead Source",
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
  FASTERQ: "Voice",
};

export const INTEGRATION_TITLES: Record<IntegrationKey, string> = {
  META_APP: "Meta Developer App",
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
  FASTERQ: "FasterQ",
};
