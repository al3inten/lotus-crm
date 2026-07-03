import { useState } from "react";
import clsx from "clsx";
import { Modal } from "../common/Modal";
import { Button } from "../common/Button";
import { useDeleteIntegration, useTestIntegration } from "../../hooks/useIntegrations";
import type { IntegrationConfigSummary, IntegrationKey } from "../../api/integrations.api";
import { MetaAdsForm } from "./MetaAdsForm";
import { WhatsappForm } from "./WhatsappForm";
import { InstagramForm } from "./InstagramForm";
import { GoogleSheetsForm } from "./GoogleSheetsForm";
import { LiveKitForm } from "./LiveKitForm";
import { TeleCmiForm } from "./TeleCmiForm";
import { GeminiForm } from "./GeminiForm";
import { OpenAiForm } from "./OpenAiForm";
import { CloudinaryForm } from "./CloudinaryForm";

const LABELS: Record<IntegrationKey, string> = {
  META_ADS: "Meta Lead Ads",
  WHATSAPP: "WhatsApp Business API",
  INSTAGRAM: "Instagram",
  GOOGLE_SHEETS: "Google Sheets",
  LIVEKIT: "LiveKit (Voice)",
  TELECMI: "TeleCMI (SIP Trunk)",
  GEMINI: "Gemini (AI)",
  OPENAI: "OpenAI (Prompt Generator)",
  CLOUDINARY: "Cloudinary (Media Storage)",
};

const STATUS_STYLES: Record<IntegrationConfigSummary["status"], string> = {
  NOT_CONFIGURED: "bg-gray-100 text-gray-600",
  CONNECTED: "bg-green-100 text-green-800",
  ERROR: "bg-red-100 text-red-800",
};

const STATUS_LABELS: Record<IntegrationConfigSummary["status"], string> = {
  NOT_CONFIGURED: "Not connected",
  CONNECTED: "Connected",
  ERROR: "Error",
};

export function IntegrationCard({ config }: { config: IntegrationConfigSummary }) {
  const [showForm, setShowForm] = useState(false);
  const testIntegration = useTestIntegration();
  const deleteIntegration = useDeleteIntegration();
  const [testResult, setTestResult] = useState<string | null>(null);

  const handleTest = async () => {
    const result = await testIntegration.mutateAsync(config.key);
    setTestResult(result.message);
  };

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-gray-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-900">{LABELS[config.key]}</span>
        <span className={clsx("rounded-full px-2 py-0.5 text-xs font-medium", STATUS_STYLES[config.status])}>
          {STATUS_LABELS[config.status]}
        </span>
      </div>

      {config.lastError && <p className="text-xs text-red-600">{config.lastError}</p>}
      {testResult && <p className="text-xs text-gray-600">{testResult}</p>}

      <div className="mt-2 flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => setShowForm(true)}>
          {config.hasCredentials ? "Update Credentials" : "Configure"}
        </Button>
        {config.hasCredentials && (
          <>
            <Button variant="secondary" isLoading={testIntegration.isPending} onClick={handleTest}>
              Test Connection
            </Button>
            <Button variant="danger" onClick={() => deleteIntegration.mutate(config.key)}>
              Disconnect
            </Button>
          </>
        )}
      </div>

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={`Configure ${LABELS[config.key]}`}>
        {config.key === "META_ADS" && <MetaAdsForm onSaved={() => setShowForm(false)} />}
        {config.key === "WHATSAPP" && <WhatsappForm onSaved={() => setShowForm(false)} />}
        {config.key === "INSTAGRAM" && <InstagramForm onSaved={() => setShowForm(false)} />}
        {config.key === "GOOGLE_SHEETS" && <GoogleSheetsForm onSaved={() => setShowForm(false)} />}
        {config.key === "LIVEKIT" && <LiveKitForm onSaved={() => setShowForm(false)} />}
        {config.key === "TELECMI" && <TeleCmiForm onSaved={() => setShowForm(false)} />}
        {config.key === "GEMINI" && <GeminiForm onSaved={() => setShowForm(false)} />}
        {config.key === "OPENAI" && <OpenAiForm onSaved={() => setShowForm(false)} />}
        {config.key === "CLOUDINARY" && <CloudinaryForm onSaved={() => setShowForm(false)} />}
      </Modal>
    </div>
  );
}
