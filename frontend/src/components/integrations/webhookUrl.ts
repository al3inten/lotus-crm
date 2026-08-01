/** A random string for the "Webhook Verify Token" field — it isn't a secret derived from
 * anything, just an arbitrary shared password that has to match between this backend and
 * Meta's dashboard, so there's no reason to make the CR invent one by hand. */
export function generateVerifyToken(): string {
  return crypto.randomUUID().replace(/-/g, "");
}

function resolveWebhookUrl(path: string): string {
  const apiBase = (import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000/api").replace(/\/$/, "");
  // A relative base (e.g. "/api", served same-origin via the Vite proxy / ngrok)
  // must be resolved against the current origin so the URL is externally usable.
  const absoluteBase = apiBase.startsWith("http") ? apiBase : `${window.location.origin}${apiBase}`;
  return `${absoluteBase}${path}`;
}

export function getMetaWebhookUrl(): string {
  return resolveWebhookUrl("/webhooks/meta");
}

export function getFasterqWebhookUrl(): string {
  return resolveWebhookUrl("/webhooks/fasterq");
}
