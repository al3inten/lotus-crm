import axios from "axios";
import jwt from "jsonwebtoken";
import { env } from "../../config/env";
import { logger } from "../../lib/logger";
import { AppError } from "../../lib/errors";
import * as integrationsService from "./integrations.service";
import * as metaAdsPagesService from "./metaAdsPages.service";
import { createLeadFromLeadgenId } from "../webhooks/metaLeadAds.service";

const GRAPH_API_BASE = "https://graph.facebook.com/v19.0";
const OAUTH_SCOPES = "pages_show_list,pages_read_engagement,pages_manage_metadata,leads_retrieval";
const STATE_PURPOSE = "meta-oauth";
// Manual "Sync" is a maintenance action, not the primary capture path (that's the webhook) —
// cap the backfill per form so a stale/huge form can't turn one click into a huge batch job.
const MAX_LEADS_PER_FORM_SYNC = 100;

function requireMetaAppConfig() {
  if (!env.FACEBOOK_APP_ID || !env.FACEBOOK_APP_SECRET) {
    throw new AppError(
      "Meta (Facebook) OAuth isn't configured — set FACEBOOK_APP_ID and FACEBOOK_APP_SECRET in the backend environment.",
      500
    );
  }
  return { appId: env.FACEBOOK_APP_ID, appSecret: env.FACEBOOK_APP_SECRET };
}

function getRedirectUri(): string {
  return `${env.BACKEND_PUBLIC_URL.replace(/\/$/, "")}/api/integrations/meta/oauth/callback`;
}

export function buildAuthUrl(userId: string): string {
  const { appId } = requireMetaAppConfig();
  const state = jwt.sign({ purpose: STATE_PURPOSE, userId }, env.JWT_SECRET, { expiresIn: "10m" });

  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: getRedirectUri(),
    state,
    scope: OAUTH_SCOPES,
  });
  return `https://www.facebook.com/v19.0/dialog/oauth?${params.toString()}`;
}

export function verifyState(state: string): { userId: string } {
  try {
    const payload = jwt.verify(state, env.JWT_SECRET) as { purpose: string; userId: string };
    if (payload.purpose !== STATE_PURPOSE) throw new Error("Wrong state purpose");
    return { userId: payload.userId };
  } catch {
    throw new AppError("Invalid or expired Facebook login session — please try again", 400);
  }
}

async function exchangeCodeForLongLivedUserToken(code: string): Promise<string> {
  const { appId, appSecret } = requireMetaAppConfig();

  const { data: shortLived } = await axios.get(`${GRAPH_API_BASE}/oauth/access_token`, {
    params: { client_id: appId, redirect_uri: getRedirectUri(), client_secret: appSecret, code },
  });

  const { data: longLived } = await axios.get(`${GRAPH_API_BASE}/oauth/access_token`, {
    params: {
      grant_type: "fb_exchange_token",
      client_id: appId,
      client_secret: appSecret,
      fb_exchange_token: shortLived.access_token,
    },
  });

  return longLived.access_token as string;
}

async function fetchFacebookIdentity(userAccessToken: string): Promise<{ id: string; name: string }> {
  const { data } = await axios.get(`${GRAPH_API_BASE}/me`, {
    params: { fields: "id,name", access_token: userAccessToken },
  });
  return data;
}

async function fetchManagedPages(userAccessToken: string): Promise<metaAdsPagesService.FacebookPageRef[]> {
  const { data } = await axios.get(`${GRAPH_API_BASE}/me/accounts`, {
    params: { fields: "id,name,access_token", access_token: userAccessToken },
  });
  return data.data ?? [];
}

async function subscribePageToLeadgenWebhook(pageId: string, pageAccessToken: string): Promise<boolean> {
  try {
    await axios.post(`${GRAPH_API_BASE}/${pageId}/subscribed_apps`, null, {
      params: { subscribed_fields: "leadgen", access_token: pageAccessToken },
    });
    return true;
  } catch (err) {
    logger.error("Failed to subscribe Page to leadgen webhook", {
      pageId,
      message: err instanceof Error ? err.message : String(err),
    });
    return false;
  }
}

async function fetchLeadFormCount(pageId: string, pageAccessToken: string): Promise<number> {
  try {
    const { data } = await axios.get(`${GRAPH_API_BASE}/${pageId}/leadgen_forms`, {
      params: { fields: "id", access_token: pageAccessToken },
    });
    return (data.data ?? []).length;
  } catch {
    return 0;
  }
}

/** Completes the OAuth handshake: exchanges the code, stores the identity + Pages, subscribes webhooks. */
export async function completeOAuthConnection(code: string, updatedById: string) {
  const longLivedUserAccessToken = await exchangeCodeForLongLivedUserToken(code);
  const identity = await fetchFacebookIdentity(longLivedUserAccessToken);
  const pages = await fetchManagedPages(longLivedUserAccessToken);

  await integrationsService.saveCredentials(
    "META_ADS",
    { fbUserId: identity.id, fbUserName: identity.name, longLivedUserAccessToken },
    updatedById
  );
  await metaAdsPagesService.upsertMetaAdsPages(pages);

  for (const page of pages) {
    const subscribed = await subscribePageToLeadgenWebhook(page.id, page.access_token);
    await metaAdsPagesService.setPageWebhookSubscribed(page.id, subscribed);
    const leadFormCount = await fetchLeadFormCount(page.id, page.access_token);
    await metaAdsPagesService.setPageLeadFormCount(page.id, leadFormCount);
  }
}

export async function disconnectMetaAds() {
  await metaAdsPagesService.deleteAllMetaAdsPages();
  await integrationsService.deleteCredentials("META_ADS");
}

/** Backfills recent leads for one connected Page across all of its lead forms. */
export async function syncPageLeads(pageId: string): Promise<{ created: number }> {
  const pageAccessToken = await metaAdsPagesService.getMetaAdsPageAccessToken(pageId);
  if (!pageAccessToken) throw new AppError("This Page is not connected", 404);

  const { data: formsResponse } = await axios.get(`${GRAPH_API_BASE}/${pageId}/leadgen_forms`, {
    params: { fields: "id", access_token: pageAccessToken },
  });
  const forms: { id: string }[] = formsResponse.data ?? [];

  let created = 0;
  for (const form of forms) {
    const { data: leadsResponse } = await axios.get(`${GRAPH_API_BASE}/${form.id}/leads`, {
      params: { access_token: pageAccessToken, limit: MAX_LEADS_PER_FORM_SYNC },
    });
    const leads: { id: string }[] = leadsResponse.data ?? [];
    for (const lead of leads) {
      const result = await createLeadFromLeadgenId(pageAccessToken, lead.id);
      if (result) created += 1;
    }
  }

  await metaAdsPagesService.touchPageSync(pageId);
  return { created };
}

export async function syncAllPagesLeads(): Promise<{ created: number }> {
  const pages = await metaAdsPagesService.listMetaAdsPages();
  let created = 0;
  for (const page of pages) {
    const result = await syncPageLeads(page.pageId);
    created += result.created;
  }
  return { created };
}
