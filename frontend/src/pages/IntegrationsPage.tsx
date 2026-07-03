import { useIntegrations } from "../hooks/useIntegrations";
import { IntegrationCard } from "../components/integrations/IntegrationCard";
import { GoogleSheetsSyncForm } from "../components/integrations/GoogleSheetsSyncForm";

export function IntegrationsPage() {
  const { data: integrations, isLoading } = useIntegrations();
  const googleSheetsConfig = integrations?.find((i) => i.key === "GOOGLE_SHEETS");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Integrations</h1>
        <p className="text-sm text-gray-500">
          Connect Meta Lead Ads, WhatsApp, Instagram, and Google Sheets to automatically capture leads. Credentials
          are stored encrypted on the server and never exposed to the browser after saving.
        </p>
      </div>

      {isLoading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {integrations?.map((config) => (
            <IntegrationCard key={config.key} config={config} />
          ))}
        </div>
      )}

      {googleSheetsConfig?.hasCredentials && <GoogleSheetsSyncForm />}
    </div>
  );
}
