import axios from "axios";
import * as integrationsService from "../integrations/integrations.service";

const GRAPH_API_BASE = "https://graph.facebook.com/v19.0";

export async function sendTextMessage(igsid: string, text: string) {
  const creds = await integrationsService.getInstagramCredentials();
  await axios.post(
    `${GRAPH_API_BASE}/me/messages`,
    { recipient: { id: igsid }, message: { text } },
    { params: { access_token: creds.accessToken } }
  );
}

export async function sendMediaMessage(igsid: string, mediaUrl: string, mediaType: "image" | "video") {
  const creds = await integrationsService.getInstagramCredentials();
  await axios.post(
    `${GRAPH_API_BASE}/me/messages`,
    {
      recipient: { id: igsid },
      message: { attachment: { type: mediaType, payload: { url: mediaUrl, is_reusable: true } } },
    },
    { params: { access_token: creds.accessToken } }
  );
}
