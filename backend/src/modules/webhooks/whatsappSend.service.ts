import axios from "axios";
import * as integrationsService from "../integrations/integrations.service";

const GRAPH_API_BASE = "https://graph.facebook.com/v19.0";

export async function sendTextMessage(toPhone: string, text: string) {
  const creds = await integrationsService.getWhatsappCredentials();
  await axios.post(
    `${GRAPH_API_BASE}/${creds.phoneNumberId}/messages`,
    { messaging_product: "whatsapp", to: toPhone, type: "text", text: { body: text } },
    { headers: { Authorization: `Bearer ${creds.accessToken}` } }
  );
}

export async function sendMediaMessage(toPhone: string, mediaUrl: string, mediaType: "image" | "video" | "document", caption?: string) {
  const creds = await integrationsService.getWhatsappCredentials();
  await axios.post(
    `${GRAPH_API_BASE}/${creds.phoneNumberId}/messages`,
    {
      messaging_product: "whatsapp",
      to: toPhone,
      type: mediaType,
      [mediaType]: { link: mediaUrl, caption },
    },
    { headers: { Authorization: `Bearer ${creds.accessToken}` } }
  );
}
