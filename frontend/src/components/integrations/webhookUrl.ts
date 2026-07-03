export function getMetaWebhookUrl(): string {
  const apiBase = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000/api";
  return `${apiBase.replace(/\/$/, "")}/webhooks/meta`;
}
