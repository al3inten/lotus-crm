import { useEffect, useState } from "react";
import { useAgentConfigs, useSaveAgentConfig, useGeneratePrompt } from "../hooks/useAgentConfigs";
import { Button } from "../components/common/Button";
import { Textarea } from "../components/common/Input";
import { Modal } from "../components/common/Modal";
import { Toggle } from "../components/common/Toggle";
import { Bot, Phone, MessageCircle, Sparkles } from "lucide-react";
import type { AgentConfig, AgentType } from "../api/agentConfigs.api";

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
    bg: "bg-indigo-50/50 dark:bg-indigo-950/20",
    border: "border-indigo-100 dark:border-indigo-900/50",
    iconBg: "bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-400",
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
  const [name, setName] = useState(config.name);
  const [systemPrompt, setSystemPrompt] = useState(config.systemPrompt);
  const [isActive, setIsActive] = useState(config.isActive);
  const [autoCallEnabled, setAutoCallEnabled] = useState(config.autoCallEnabled);
  const [showGenerate, setShowGenerate] = useState(false);

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
    <div className={`flex flex-col rounded-3xl border ${theme.border} bg-white shadow-sm transition-all hover:shadow-lg overflow-hidden`}>
      {/* Header */}
      <div className={`p-6 pb-5 ${theme.bg}`}>
        <div className="flex items-center justify-between mb-4">
          <div className={`flex h-14 w-14 items-center justify-center rounded-2xl shadow-sm ring-1 ring-black/5 ${theme.iconBg}`}>
            {theme.icon}
          </div>
          <Toggle checked={isActive} onChange={handleToggleActive} />
        </div>
        
        <input
           value={name}
           onChange={(e) => setName(e.target.value)}
           className="w-full bg-transparent text-2xl font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md px-1 -mx-1 transition-colors hover:bg-black/5"
           placeholder="Agent Name"
        />
        <p className="text-sm font-medium text-gray-500 mt-1 pl-1">{LABELS[config.type]}</p>
      </div>

      <div className="flex flex-col gap-6 p-6 flex-1 bg-white">
        {/* System Prompt */}
        <div className="flex-1 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Bot size={16} className="text-gray-400" />
              System Prompt
            </label>
            <button
              onClick={() => setShowGenerate(true)}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg transition-colors ring-1 ring-inset ring-blue-600/10"
            >
              <Sparkles size={13} /> Auto-Generate
            </button>
          </div>
          
          <textarea
            rows={10}
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            className="w-full flex-1 rounded-2xl border border-gray-200 bg-gray-50/50 p-4 text-sm text-gray-700 shadow-inner focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono resize-none transition-all leading-relaxed"
            placeholder="You are a helpful AI assistant..."
            spellCheck={false}
          />
        </div>

        {config.type === "VOICE" && (
          <div className="flex items-start gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/30 p-4">
            <div className="mt-0.5">
              <Toggle checked={autoCallEnabled} onChange={handleToggleAutoCall} />
            </div>
            <div>
              <p className="text-sm font-medium text-indigo-900">Auto-call new digital leads</p>
              <p className="text-xs text-indigo-700/70 mt-1 leading-relaxed">
                Automatically trigger voice calls for fresh leads (score 0). Branch auto-call must also be enabled.
              </p>
            </div>
          </div>
        )}

        <div className="mt-auto pt-2">
          <Button 
            className="w-full shadow-sm" 
            size="lg"
            isLoading={saveConfig.isPending} 
            onClick={() => handleSave()}
            disabled={!hasChanges}
          >
            {hasChanges ? "Save Changes" : "Up to date"}
          </Button>
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
    <div className="flex flex-col gap-8 p-4 md:p-6 lg:p-8">
      <div className="mx-auto w-full max-w-7xl flex flex-col gap-8">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-3xl bg-slate-900 px-8 py-10 shadow-2xl dark:bg-slate-950 sm:px-12 sm:py-14">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -left-[10%] -top-[50%] h-[200%] w-[50%] rounded-full bg-violet-600/30 blur-[100px] dark:bg-violet-600/20" />
            <div className="absolute -right-[20%] top-[-20%] h-[150%] w-[60%] rounded-full bg-blue-500/20 blur-[120px] dark:bg-blue-500/10" />
          </div>

          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <span className="inline-flex items-center rounded-full bg-violet-500/10 px-3 py-1 text-sm font-medium text-violet-300 ring-1 ring-inset ring-violet-500/20 backdrop-blur-md">
                Intelligence Engine
              </span>
              <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                AI Agents
              </h1>
              <p className="mt-3 text-lg text-slate-300">
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
    </div>
  );
}
