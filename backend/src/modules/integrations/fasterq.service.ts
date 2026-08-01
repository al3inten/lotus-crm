import axios from "axios";
import { logger } from "../../lib/logger";
import { isIntegrationEnabled, getFasterqCredentials } from "./integrations.service";
import { applyFasterqCall, FasterqCallPayload } from "./fasterqSync.service";

const FASTERQ_API_BASE = "https://api.fasterq.in/api/integrations/calls";

// FasterQ docs recommend polling every 5-15 minutes; we look back 20 minutes on every tick
// (run every 5 minutes, see server.ts) so a slow tick or a brief outage never leaves a gap,
// while staying well under the 7-day max window and the 10 req/min rate limit.
const LOOKBACK_MS = 20 * 60 * 1000;

interface FasterqApiCall {
  callId: string;
  answered: boolean;
  inbound: boolean;
  duration: number;
  number?: string;
  formattedNumber?: string;
  startTime?: string;
  createdAt?: string;
  recUrl: string | null;
}

/**
 * Backfills/reconciles call data from FasterQ's GET /calls endpoint — the fallback path for
 * when the webhook is unconfigured or a delivery is missed, and the only way FasterQ's
 * "second push once the recording is ready" gets picked up if that push doesn't arrive.
 */
export async function pollFasterqCalls() {
  if (!(await isIntegrationEnabled("FASTERQ"))) return;

  const creds = await getFasterqCredentials();
  const to = new Date();
  const from = new Date(to.getTime() - LOOKBACK_MS);

  const { data } = await axios.get(FASTERQ_API_BASE, {
    headers: { Authorization: `Bearer ${creds.apiKey}` },
    params: { from: from.toISOString(), to: to.toISOString(), limit: 500 },
  });

  const calls: FasterqApiCall[] = Array.isArray(data?.calls) ? data.calls : Array.isArray(data) ? data : [];

  for (const call of calls) {
    const phone = call.formattedNumber || call.number;
    if (!phone) continue;

    const payload: FasterqCallPayload = {
      callId: call.callId,
      phone,
      answered: call.answered,
      inbound: call.inbound,
      duration: call.duration,
      startTime: call.startTime,
      createdAt: call.createdAt,
      recordingUrl: call.recUrl,
    };

    try {
      await applyFasterqCall(payload);
    } catch (err) {
      logger.error("Failed to apply polled FasterQ call", {
        callId: call.callId,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
}
