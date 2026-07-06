import { useState } from "react";
import type { ReactNode } from "react";
import clsx from "clsx";
import { Modal } from "../common/Modal";
import { Button } from "../common/Button";
import { useDeleteIntegration, useTestIntegration } from "../../hooks/useIntegrations";
import type { IntegrationConfigSummary, IntegrationKey } from "../../api/integrations.api";
import { CATEGORY_BY_KEY } from "./integrationMeta";
import { MetaAdsForm } from "./MetaAdsForm";
import { WhatsappForm } from "./WhatsappForm";
import { InstagramForm } from "./InstagramForm";
import { GoogleSheetsForm } from "./GoogleSheetsForm";
import { LiveKitForm } from "./LiveKitForm";
import { TeleCmiForm } from "./TeleCmiForm";
import { GeminiForm } from "./GeminiForm";
import { OpenAiForm } from "./OpenAiForm";
import { CloudinaryForm } from "./CloudinaryForm";
import { CallmaticForm } from "./CallmaticForm";
import { Blocks, Sparkles, Mic, PhoneCall, Image as ImageIcon, AlertTriangle, RefreshCw, Trash2, Settings2, Clock } from "lucide-react";

// --- Visual & Metadata Configurations ---

const STATUS_THEMES: Record<IntegrationConfigSummary["status"], { bg: string; text: string; ring: string; dot: string }> = {
  NOT_CONFIGURED: { bg: "bg-slate-50", text: "text-slate-600", ring: "ring-slate-600/10", dot: "bg-slate-400" },
  CONNECTED: { bg: "bg-emerald-50", text: "text-emerald-700", ring: "ring-emerald-600/10", dot: "bg-emerald-500" },
  ERROR: { bg: "bg-red-50", text: "text-red-700", ring: "ring-red-600/10", dot: "bg-red-500" },
};

const STATUS_LABELS: Record<IntegrationConfigSummary["status"], string> = {
  NOT_CONFIGURED: "Not connected",
  CONNECTED: "Connected",
  ERROR: "Needs attention",
};

const INTEGRATION_UI: Record<IntegrationKey, { title: string; desc: string; icon: ReactNode }> = {
  META_ADS: {
    title: "Meta Lead Ads",
    desc: "Sync leads from Facebook & Instagram ads.",
    icon: (
      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-100 bg-white shadow-sm">
        <svg className="h-8 w-8 text-[#0668E1]" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2.04C6.5 2.04 2 6.53 2 12.06C2 17.06 5.66 21.21 10.44 21.96V14.96H7.9V12.06H10.44V9.85C10.44 7.34 11.93 5.96 14.22 5.96C15.31 5.96 16.45 6.15 16.45 6.15V8.62H15.19C13.95 8.62 13.56 9.39 13.56 10.18V12.06H16.34L15.89 14.96H13.56V21.96A10 10 0 0 0 22 12.06C22 6.53 17.5 2.04 12 2.04Z" />
        </svg>
      </div>
    ),
  },
  WHATSAPP: {
    title: "WhatsApp Business",
    desc: "Automate chats and capture leads.",
    icon: (
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F57C00]">
        <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38c1.45.79 3.08 1.21 4.79 1.21 5.46 0 9.91-4.45 9.91-9.91C21.95 6.45 17.5 2 12.04 2z" />
        </svg>
      </div>
    ),
  },
  INSTAGRAM: {
    title: "Instagram",
    desc: "Process DMs and comments automatically.",
    icon: (
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF]">
        <svg className="h-7 w-7 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
        </svg>
      </div>
    ),
  },
  GOOGLE_SHEETS: {
    title: "Google Sheets",
    desc: "Export data and sync leads in real-time.",
    icon: (
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#0F9D58]">
        <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
        </svg>
      </div>
    ),
  },
  LIVEKIT: {
    title: "LiveKit (Voice)",
    desc: "Real-time voice integration infrastructure.",
    icon: <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500"><Mic className="h-6 w-6 text-white" /></div>,
  },
  TELECMI: {
    title: "TeleCMI",
    desc: "SIP Trunking and call management.",
    icon: <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500"><PhoneCall className="h-6 w-6 text-white" /></div>,
  },
  GEMINI: {
    title: "Gemini (AI)",
    desc: "Google's advanced AI models.",
    icon: <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-500"><Sparkles className="h-6 w-6 text-white" /></div>,
  },
  OPENAI: {
    title: "OpenAI",
    desc: "Prompt generation and GPT integration.",
    icon: <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600"><Sparkles className="h-6 w-6 text-white" /></div>,
  },
  CLOUDINARY: {
    title: "Cloudinary",
    desc: "Media storage and optimization.",
    icon: <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500"><ImageIcon className="h-6 w-6 text-white" /></div>,
  },
  CALLMATIC: {
    title: "Callmatic",
    desc: "Programmatic AI voice calling platform.",
    icon: <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#0F172A]"><PhoneCall className="h-6 w-6 text-white" /></div>,
  },
};

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

// --- Main Component ---

export function IntegrationCard({ config }: { config: IntegrationConfigSummary }) {
  const [showForm, setShowForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const testIntegration = useTestIntegration();
  const deleteIntegration = useDeleteIntegration();

  const handleTest = async () => {
    try {
      const result = await testIntegration.mutateAsync(config.key);
      setTestResult(result.message);
    } catch {
      setTestResult("Test failed. Please check credentials.");
    }
  };

  const handleDelete = () => {
    deleteIntegration.mutate(config.key, {
      onSuccess: () => setShowDeleteConfirm(false),
    });
  };

  const ui = INTEGRATION_UI[config.key] || {
    title: config.key,
    desc: "Configure this integration.",
    icon: <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100"><Blocks className="h-6 w-6 text-slate-400" /></div>,
  };

  const statusTheme = STATUS_THEMES[config.status];
  const category = CATEGORY_BY_KEY[config.key];

  return (
    <div className="group relative flex flex-col justify-between rounded-2xl border border-slate-100 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_24px_-16px_rgba(15,23,42,0.12)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_1px_2px_rgba(15,23,42,0.04),0_20px_32px_-16px_rgba(15,23,42,0.18)]">
      {/* Header Section */}
      <div className="flex items-start gap-4">
        {ui.icon}
        <div className="flex min-w-0 flex-1 flex-col items-start pt-1">
          <h3 className="truncate text-base font-semibold text-slate-900">{ui.title}</h3>
          <span className="mt-0.5 text-xs font-medium uppercase tracking-wide text-slate-400">{category}</span>
          <span
            className={clsx(
              "mt-2 inline-flex items-center gap-x-1.5 rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset",
              statusTheme.bg,
              statusTheme.text,
              statusTheme.ring
            )}
          >
            <span className={clsx("inline-flex h-1.5 w-1.5 rounded-full", statusTheme.dot)} />
            {STATUS_LABELS[config.status]}
          </span>
        </div>
      </div>

      {/* Body / Description Section */}
      <div className="mt-5 mb-6 min-h-[40px]">
        {config.lastError ? (
          <p className="text-sm text-red-600">{config.lastError}</p>
        ) : testResult ? (
          <p className="text-sm font-medium text-slate-700">{testResult}</p>
        ) : (
          <p className="text-sm text-slate-500">{ui.desc}</p>
        )}
        {config.hasCredentials && config.lastTestedAt && !testResult && (
          <p className="mt-2 flex items-center gap-1 text-xs text-slate-400">
            <Clock size={11} />
            Last tested {timeAgo(config.lastTestedAt)}
          </p>
        )}
      </div>

      {/* Action Buttons Section */}
      <div className="flex items-center gap-2">
        <Button
          variant={config.hasCredentials ? "secondary" : "primary"}
          icon={config.hasCredentials ? <Settings2 size={14} /> : undefined}
          onClick={() => setShowForm(true)}
          className="flex-1"
        >
          {config.hasCredentials ? "Manage" : "Configure"}
        </Button>

        {config.hasCredentials && (
          <>
            <Button
              variant="secondary"
              isLoading={testIntegration.isPending}
              onClick={handleTest}
              aria-label="Test connection"
              title="Test connection"
              className="!px-2.5"
            >
              <RefreshCw size={14} />
            </Button>
            <Button
              variant="danger"
              onClick={() => setShowDeleteConfirm(true)}
              aria-label="Remove integration"
              title="Remove integration"
              className="!px-2.5"
            >
              <Trash2 size={14} />
            </Button>
          </>
        )}
      </div>

      {/* Configuration Modal */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={`Configure ${ui.title}`}>
        {config.key === "META_ADS" && <MetaAdsForm onSaved={() => setShowForm(false)} />}
        {config.key === "WHATSAPP" && <WhatsappForm onSaved={() => setShowForm(false)} />}
        {config.key === "INSTAGRAM" && <InstagramForm onSaved={() => setShowForm(false)} />}
        {config.key === "GOOGLE_SHEETS" && <GoogleSheetsForm onSaved={() => setShowForm(false)} />}
        {config.key === "LIVEKIT" && <LiveKitForm onSaved={() => setShowForm(false)} />}
        {config.key === "TELECMI" && <TeleCmiForm onSaved={() => setShowForm(false)} />}
        {config.key === "GEMINI" && <GeminiForm onSaved={() => setShowForm(false)} />}
        {config.key === "OPENAI" && <OpenAiForm onSaved={() => setShowForm(false)} />}
        {config.key === "CLOUDINARY" && <CloudinaryForm onSaved={() => setShowForm(false)} />}
        {config.key === "CALLMATIC" && <CallmaticForm onSaved={() => setShowForm(false)} />}
      </Modal>

      {/* Danger Confirmation Modal */}
      <Modal isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} title="">
        <div className="flex flex-col gap-4 py-2 sm:p-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
            <AlertTriangle className="h-6 w-6 text-red-600" aria-hidden="true" />
          </div>

          <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
            <h3 className="text-lg font-semibold leading-6 text-slate-900">Disconnect {ui.title}?</h3>
            <div className="mt-2">
              <p className="text-sm text-slate-500">
                Are you absolutely sure? This action cannot be undone. This will permanently disconnect the integration and remove all associated credentials from our servers.
              </p>
            </div>
          </div>

          <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse sm:gap-3">
            <Button
              variant="danger"
              isLoading={deleteIntegration.isPending}
              onClick={handleDelete}
              className="w-full sm:w-auto"
            >
              Yes, disconnect
            </Button>
            <Button
              variant="secondary"
              onClick={() => setShowDeleteConfirm(false)}
              className="mt-3 w-full sm:mt-0 sm:w-auto"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
