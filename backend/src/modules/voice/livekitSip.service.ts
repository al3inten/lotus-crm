import { SipClient, RoomServiceClient } from "livekit-server-sdk";
import { SIPTransport } from "@livekit/protocol";
import * as integrationsService from "../integrations/integrations.service";

const TRUNK_NAME = "lotus-crm-telecmi-outbound";

function toHttpUrl(serverUrl: string): string {
  return serverUrl.replace(/^wss:/, "https:").replace(/^ws:/, "http:");
}

async function getClients() {
  const [livekit, telecmi] = await Promise.all([
    integrationsService.getLivekitCredentials(),
    integrationsService.getTelecmiCredentials(),
  ]);
  const httpUrl = toHttpUrl(livekit.serverUrl);
  return {
    sipClient: new SipClient(httpUrl, livekit.apiKey, livekit.apiSecret),
    roomClient: new RoomServiceClient(httpUrl, livekit.apiKey, livekit.apiSecret),
    telecmi,
    livekit,
  };
}

/** Creates the TeleCMI outbound SIP trunk in LiveKit if it doesn't already exist, returns its ID. */
export async function ensureOutboundTrunk(): Promise<string> {
  const { sipClient, telecmi } = await getClients();

  const existing = await sipClient.listSipOutboundTrunk();
  const found = existing.find((t) => t.name === TRUNK_NAME);
  if (found) return found.sipTrunkId;

  const trunk = await sipClient.createSipOutboundTrunk(TRUNK_NAME, telecmi.sipUri, [telecmi.callerIdNumber], {
    transport: SIPTransport.SIP_TRANSPORT_AUTO,
    authUsername: telecmi.trunkUsername,
    authPassword: telecmi.trunkPassword,
  });
  return trunk.sipTrunkId;
}

/** Dials a lead's phone number via the TeleCMI trunk into a fresh LiveKit room for this call. */
export async function dialOut(roomName: string, phoneNumber: string) {
  const { sipClient, telecmi } = await getClients();
  const trunkId = await ensureOutboundTrunk();

  return sipClient.createSipParticipant(trunkId, phoneNumber, roomName, {
    participantIdentity: `caller-${phoneNumber}`,
    participantName: phoneNumber,
    fromNumber: telecmi.callerIdNumber,
  });
}
