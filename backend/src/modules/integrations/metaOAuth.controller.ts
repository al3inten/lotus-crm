import { Request, Response } from "express";
import { env } from "../../config/env";
import { logger } from "../../lib/logger";
import { UnauthorizedError } from "../../lib/errors";
import * as metaOAuthService from "./metaOAuth.service";
import * as metaAdsPagesService from "./metaAdsPages.service";
import * as integrationsService from "./integrations.service";

function frontendOrigin(): string {
  return env.CORS_ORIGIN.split(",")[0].trim();
}

export async function startMetaOAuthHandler(req: Request, res: Response) {
  if (!req.user) throw new UnauthorizedError();
  const url = await metaOAuthService.buildAuthUrl(req.user.id);
  res.json({ url });
}

/** App ID (masked secret) + the exact redirect URI to register in the Meta App dashboard. */
export async function metaAppConfigHandler(_req: Request, res: Response) {
  const saved = await integrationsService.getMetaAppConfig();
  const appId = saved?.appId ?? env.FACEBOOK_APP_ID ?? null;
  res.json({
    configured: !!(saved || (env.FACEBOOK_APP_ID && env.FACEBOOK_APP_SECRET)),
    appId,
    redirectUri: metaOAuthService.getRedirectUri(),
  });
}

export async function metaOAuthCallbackHandler(req: Request, res: Response) {
  const code = req.query.code as string | undefined;
  const state = req.query.state as string | undefined;

  if (!code || !state) {
    return res.redirect(`${frontendOrigin()}/integrations?meta=error`);
  }

  try {
    const { userId } = metaOAuthService.verifyState(state);
    await metaOAuthService.completeOAuthConnection(code, userId);
    return res.redirect(`${frontendOrigin()}/integrations?meta=connected`);
  } catch (err) {
    logger.error("Meta OAuth callback failed", { message: err instanceof Error ? err.message : String(err) });
    return res.redirect(`${frontendOrigin()}/integrations?meta=error`);
  }
}

export async function metaAdsStatusHandler(_req: Request, res: Response) {
  const [pages, identity] = await Promise.all([
    metaAdsPagesService.listMetaAdsPages(),
    integrationsService.getMetaAdsIdentity(),
  ]);
  res.json({ connected: identity !== null, fbUserName: identity?.fbUserName ?? null, pages });
}

export async function disconnectMetaHandler(_req: Request, res: Response) {
  await metaOAuthService.disconnectMetaAds();
  res.status(204).send();
}

export async function syncMetaPageHandler(req: Request, res: Response) {
  const result = await metaOAuthService.syncPageLeads(req.params.pageId);
  res.json(result);
}

export async function syncAllMetaPagesHandler(_req: Request, res: Response) {
  const result = await metaOAuthService.syncAllPagesLeads();
  res.json(result);
}
