import { useEffect, useState } from "react";
import { useAgentConfigs, useSaveAgentConfig, useGeneratePrompt } from "../hooks/useAgentConfigs";
import { Button } from "../components/common/Button";
import { Textarea } from "../components/common/Input";
import { Modal } from "../components/common/Modal";
import { Toggle } from "../components/common/Toggle";
import { Bot, Phone, MessageCircle, Sparkles, Eye, EyeOff } from "lucide-react";
import type { AgentConfig, AgentType } from "../api/agentConfigs.api";
import { useCanWrite } from "../hooks/usePermission";

const LABELS: Record<AgentType, string> = {
  VOICE: "Outbound Voice Agent",
  WHATSAPP_CHATBOT: "WhatsApp Chatbot",
  INSTAGRAM_CHATBOT: "Instagram Chatbot",
};

function GeneratePromptModal({
  agentType,
  isOpen,
  onClose,
  onGenerated,
}: {
  agentType: AgentType;
  isOpen: boolean;
  onClose: () => void;
  onGenerated: (text: string) => void;
}) {
  const generatePrompt = useGeneratePrompt();
  const [description, setDescription] = useState("");

  const handleGenerate = async () => {
    const text = await generatePrompt.mutateAsync({ agentType, description });
    onGenerated(text);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Generate System Prompt with AI">
      <div className="flex flex-col gap-3">
        <Textarea
          label="Describe what this agent should do"
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. Follow up with leads who did a test drive last week, ask how it went, and offer to schedule a booking call."
        />
        <Button type="button" isLoading={generatePrompt.isPending} disabled={!description} onClick={handleGenerate} className="w-fit">
          Generate
        </Button>
      </div>
    </Modal>
  );
}

const THEME_MAP: Record<AgentType, { bg: string; border: string; iconBg: string; icon: React.ReactNode }> = {
  VOICE: {
    bg: "bg-primary-50/50 dark:bg-primary-950/20",
    border: "border-primary-100 dark:border-primary-900/50",
    iconBg: "bg-primary-100 text-primary-600 dark:bg-primary-900 dark:text-primary-400",
    icon: <Phone size={24} />,
  },
  WHATSAPP_CHATBOT: {
    bg: "bg-emerald-50/50 dark:bg-emerald-950/20",
    border: "border-emerald-100 dark:border-emerald-900/50",
    iconBg: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-400",
    icon: <MessageCircle size={24} />,
  },
  INSTAGRAM_CHATBOT: {
    bg: "bg-pink-50/50 dark:bg-pink-950/20",
    border: "border-pink-100 dark:border-pink-900/50",
    iconBg: "bg-pink-100 text-pink-600 dark:bg-pink-900 dark:text-pink-400",
    icon: <Bot size={24} />,
  },
};

function AgentConfigCard({ config }: { config: AgentConfig }) {
  const saveConfig = useSaveAgentConfig();
  const canWrite = useCanWrite("ai-agents");
  const [name, setName] = useState(config.name);
  const [systemPrompt, setSystemPrompt] = useState(config.systemPrompt);
  const [isActive, setIsActive] = useState(config.isActive);
  const [autoCallEnabled, setAutoCallEnabled] = useState(config.autoCallEnabled);
  const [showGenerate, setShowGenerate] = useState(false);
  const [isPromptVisible, setIsPromptVisible] = useState(false);

  useEffect(() => {
    setName(config.name);
    setSystemPrompt(config.systemPrompt);
    setIsActive(config.isActive);
    setAutoCallEnabled(config.autoCallEnabled);
  }, [config]);

  const handleSave = (overrides?: { isActive?: boolean; autoCallEnabled?: boolean }) => {
    saveConfig.mutate({
      type: config.type,
      payload: {
        name,
        systemPrompt,
        isActive: overrides?.isActive ?? isActive,
        autoCallEnabled: overrides?.autoCallEnabled ?? autoCallEnabled,
      },
    });
  };

  const handleToggleActive = (checked: boolean) => {
    setIsActive(checked);
    handleSave({ isActive: checked });
  };

  const handleToggleAutoCall = (checked: boolean) => {
    setAutoCallEnabled(checked);
    handleSave({ autoCallEnabled: checked });
  };

  const theme = THEME_MAP[config.type];
  const hasChanges =
    name !== config.name ||
    systemPrompt !== config.systemPrompt ||
    isActive !== config.isActive ||
    autoCallEnabled !== config.autoCallEnabled;

  return (
    <div className={`flex flex-col rounded-2xl border ${theme.border} bg-white shadow-sm transition-all hover:shadow-md overflow-hidden`}>
      {/* Header */}
      <div className={`p-4 pb-3 ${theme.bg}`}>
        <div className="flex items-center justify-between mb-2">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl shadow-sm ring-1 ring-black/5 ${theme.iconBg}`}>
            {theme.icon}
          </div>
          <Toggle checked={isActive} onChange={handleToggleActive} disabled={!canWrite} />
        </div>

        <input
           value={name}
           onChange={(e) => setName(e.target.value)}
           disabled={!canWrite}
           className="w-full bg-transparent text-lg font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-md px-1 -mx-1 transition-colors hover:bg-black/5 disabled:opacity-70"
           placeholder="Agent Name"
        />
        <p className="text-xs font-medium text-gray-500 mt-0.5 pl-1">{LABELS[config.type]}</p>
      </div>

      <div className="flex flex-col gap-4 p-4 flex-1 bg-white">
        {/* System Prompt */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                <Bot size={14} className="text-gray-400" />
                System Prompt
              </label>
              <button
                onClick={() => setIsPromptVisible(!isPromptVisible)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100"
                title={isPromptVisible ? "Hide Prompt" : "Show Prompt"}
              >
                {isPromptVisible ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            {isPromptVisible && (
              <button
                onClick={() => setShowGenerate(true)}
                className="text-[11px] font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1 bg-primary-50 hover:bg-primary-100 px-2 py-1 rounded-md transition-colors ring-1 ring-inset ring-primary-600/10"
              >
                <Sparkles size={11} /> Auto-Generate
              </button>
            )}
          </div>
          
          {isPromptVisible ? (
            <textarea
              rows={6}
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50/50 p-3 text-xs text-gray-700 shadow-inner focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 font-mono resize-none transition-all leading-relaxed"
              placeholder="You are a helpful AI assistant..."
              spellCheck={false}
            />
          ) : (
            <div 
              className="w-full rounded-xl border border-gray-100 bg-gray-50 p-3 text-xs text-gray-400 font-mono italic cursor-pointer hover:bg-gray-100 transition-colors flex items-center justify-center h-[96px]"
              onClick={() => setIsPromptVisible(true)}
            >
              Click to reveal system prompt...
            </div>
          )}
        </div>

        {config.type === "VOICE" && (
          <div className="flex items-start gap-2.5 rounded-xl border border-primary-100 bg-primary-50/30 p-3">
            <div className="mt-0.5">
              <Toggle checked={autoCallEnabled} onChange={handleToggleAutoCall} disabled={!canWrite} />
            </div>
            <div>
              <p className="text-xs font-medium text-primary-900">Auto-call new digital leads</p>
              <p className="text-[10px] text-primary-700/70 mt-0.5 leading-relaxed">
                Automatically trigger voice calls for fresh leads (score 0). Branch auto-call must also be enabled.
              </p>
            </div>
          </div>
        )}

        <div className="mt-auto pt-1">
          {canWrite && (
            <Button
              className="w-full shadow-sm"
              size="md"
              isLoading={saveConfig.isPending}
              onClick={() => handleSave()}
              disabled={!hasChanges}
            >
              {hasChanges ? "Save Changes" : "Up to date"}
            </Button>
          )}
        </div>
      </div>
      
      <GeneratePromptModal
        agentType={config.type}
        isOpen={showGenerate}
        onClose={() => setShowGenerate(false)}
        onGenerated={setSystemPrompt}
      />
    </div>
  );
}

export function AiAgentsPage() {
  const { data: configs, isLoading } = useAgentConfigs();

  return (
    <div className="mx-auto w-full max-w-7xl flex flex-col gap-6">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-[#0B0F19] px-6 py-8 shadow-2xl shadow-primary-900/10 ring-1 ring-slate-900/5 dark:bg-slate-950 dark:ring-white/10 sm:px-9 sm:py-9">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h1v1H0V0zm23 23h1v1h-1v-1z' fill='white'/%3E%3C/svg%3E\")", backgroundSize: "24px 24px" }}
        />
        <div className="pointer-events-none absolute -left-20 -top-20 h-[300px] w-[300px] rounded-full bg-primary-500/10 blur-[80px]" />

        <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <span className="inline-flex items-center rounded-full bg-primary-500/10 px-2.5 py-0.5 text-xs sm:text-sm font-medium text-primary-300 ring-1 ring-inset ring-primary-500/20 backdrop-blur-md">
              Intelligence Engine
            </span>
            <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              AI Agents
            </h1>
            <p className="mt-2 text-sm sm:text-base text-slate-300">
              Configure prompts and behavior for your outbound voice agent and messaging chatbots.
            </p>
          </div>
          </div>
        </div>

      {isLoading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {configs?.map((config) => <AgentConfigCard key={config.type} config={config} />)}
        </div>
      )}
    </div>
  );
}
