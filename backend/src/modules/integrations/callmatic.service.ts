import axios from "axios";
import { getCallmaticCredentials } from "./integrations.service";

const CALLMATIC_API_BASE = "https://api.callmatic.ai/v1";

interface CallmaticCallDetails {
  phoneNumber: string;
  variables: Record<string, string>;
}

export async function triggerBatchCalls(tasks: CallmaticCallDetails[]) {
  const creds = await getCallmaticCredentials();
  
  const response = await axios.post(
    `${CALLMATIC_API_BASE}/calls/batch`,
    {
      campaignId: creds.campaignId,
      to: tasks,
    },
    {
      headers: {
        "Content-Type": "application/json",
        "api-key": creds.apiKey,
      },
    }
  );
  
  return response.data;
}

export async function getCallDetails(callId: string) {
  const creds = await getCallmaticCredentials();
  
  const response = await axios.get(`${CALLMATIC_API_BASE}/calls/${callId}`, {
    headers: {
      "Content-Type": "application/json",
      "api-key": creds.apiKey,
    },
  });
  
  return response.data;
}

export async function getCallRecordingStream(callId: string) {
  const creds = await getCallmaticCredentials();
  
  const response = await axios.get(`${CALLMATIC_API_BASE}/recordings/${callId}`, {
    headers: {
      "api-key": creds.apiKey,
    },
    responseType: "stream",
  });
  
  return response.data;
}
