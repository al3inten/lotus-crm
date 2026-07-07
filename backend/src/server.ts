import { app } from "./app";
import { env } from "./config/env";
import { logger } from "./lib/logger";
import { pollPendingCalls } from "./modules/voice/voice.service";

app.listen(env.PORT, () => {
  logger.info(`Lotus CRM backend listening on port ${env.PORT}`);
});

// Fallback for Callmatic's webhook being unreliable/unconfigured on their side — poll for
// any call still in progress and pull its result directly via their GET /calls/{callId}.
const CALLMATIC_POLL_INTERVAL_MS = 20_000;
setInterval(() => {
  pollPendingCalls().catch((err) =>
    logger.error("Callmatic call poll tick failed", { error: err instanceof Error ? err.message : String(err) })
  );
}, CALLMATIC_POLL_INTERVAL_MS);
