import { logger } from "../lib/logger";
import { pollAndDial } from "./dialer";

const POLL_INTERVAL_MS = 10_000;

async function tick() {
  try {
    await pollAndDial();
  } catch (err) {
    logger.error("Voice worker poll failed", { message: err instanceof Error ? err.message : String(err) });
  }
}

logger.info("Lotus CRM voice-worker started", { pollIntervalMs: POLL_INTERVAL_MS });
setInterval(tick, POLL_INTERVAL_MS);
void tick();
