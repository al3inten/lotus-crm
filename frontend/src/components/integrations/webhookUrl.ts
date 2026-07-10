export function getMetaWebhookUrl(): string {
  const apiBase = (import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000/api").replace(/\/$/, "");
  // A relative base (e.g. "/api", served same-origin via the Vite proxy / ngrok)
  // must be resolved against the current origin so the URL is externally usable.
  const absoluteBase = apiBase.startsWith("http") ? apiBase : `${window.location.origin}${apiBase}`;
  return `${absoluteBase}/webhooks/meta`;
}
