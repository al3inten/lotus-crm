import express from "express";
import cors from "cors";
import compression from "compression";
import { env } from "./config/env";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";

import authRoutes from "./modules/auth/auth.routes";
import usersRoutes from "./modules/users/users.routes";
import branchesRoutes from "./modules/branches/branches.routes";
import leadsRoutes from "./modules/leads/leads.routes";
import enquiriesRoutes from "./modules/enquiries/enquiries.routes";
import followUpsRoutes from "./modules/follow-ups/follow-ups.routes";
import reportsRoutes from "./modules/reports/reports.routes";
import integrationsRoutes from "./modules/integrations/integrations.routes";
import metaOAuthCallbackRoutes from "./modules/integrations/metaOAuthCallback.routes";
import webhooksRoutes from "./modules/webhooks/webhooks.routes";
import socialInboxRoutes from "./modules/social-inbox/social-inbox.routes";
import mediaRoutes from "./modules/media/media.routes";
import templatesRoutes from "./modules/templates/templates.routes";
import agentConfigsRoutes from "./modules/agent-configs/agent-configs.routes";
import campaignsRoutes from "./modules/campaigns/campaigns.routes";
import voiceRoutes from "./modules/voice/voice.routes";
import rolesRoutes from "./modules/roles/roles.routes";
import staffDepartmentsRoutes from "./modules/staff-departments/staff-departments.routes";
import vehiclesRoutes from "./modules/vehicles/vehicles.routes";
import notificationsRoutes from "./modules/notifications/notifications.routes";
import quotesRoutes from "./modules/quotes/quotes.routes";
import settingsRoutes from "./modules/settings/settings.routes";
import searchRoutes from "./modules/search/search.routes";
import locationsRoutes from "./modules/locations/locations.routes";

export const app = express();

// gzip every response above ~1 KB so large JSON payloads (report aggregates, lead
// lists) transfer 5–10× smaller. Must sit before the routes so it wraps their output.
app.use(compression());

// CORS_ORIGIN accepts a comma-separated list so production + Vercel preview
// deployments can both call the API, e.g. "https://app.vercel.app,http://localhost:5173".
const allowedOrigins = env.CORS_ORIGIN.split(",").map((origin) => origin.trim());
app.use(cors({ origin: allowedOrigins, credentials: true }));
// Captures the exact raw bytes of the request body so webhook signature verification
// (HMAC over the raw payload) works — re-serializing req.body would break the signature.
app.use(
  express.json({
    verify: (req, _res, buf) => {
      (req as express.Request).rawBody = buf;
    },
  })
);

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/public/quotes", quotesRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/branches", branchesRoutes);
app.use("/api/leads", leadsRoutes);
app.use("/api/enquiries", enquiriesRoutes);
app.use("/api/follow-ups", followUpsRoutes);
app.use("/api/reports", reportsRoutes);
// Public callback registered first so it's handled before the JWT-protected router below —
// any other path under this prefix (e.g. /meta/oauth/start) falls through to it untouched.
app.use("/api/integrations/meta/oauth", metaOAuthCallbackRoutes);
app.use("/api/integrations", integrationsRoutes);
app.use("/api/webhooks", webhooksRoutes);
app.use("/api/social-inbox", socialInboxRoutes);
app.use("/api/media", mediaRoutes);
app.use("/api/templates", templatesRoutes);
app.use("/api/agent-configs", agentConfigsRoutes);
app.use("/api/campaigns", campaignsRoutes);
app.use("/api/voice", voiceRoutes);
app.use("/api/roles", rolesRoutes);
app.use("/api/staff-departments", staffDepartmentsRoutes);
app.use("/api/vehicle-models", vehiclesRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/locations", locationsRoutes);

app.use(notFoundHandler);
app.use(errorHandler);
