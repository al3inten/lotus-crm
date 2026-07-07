import { useEffect, useState } from "react";
import { useAgentConfigs, useSaveAgentConfig, useGeneratePrompt } from "../hooks/useAgentConfigs";
import { Button } from "../components/common/Button";
import { Input, Textarea } from "../components/common/Input";
import { Modal } from "../components/common/Modal";
import { Toggle } from "../components/common/Toggle";
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

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">{LABELS[config.type]}</h3>
        <label className="flex items-center gap-2 text-xs text-gray-600">
          <input type="checkbox" checked={isActive} onChange={(e) => handleToggleActive(e.target.checked)} />
          Active
        </label>
      </div>
      <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} />
      <Textarea label="System Prompt" rows={8} value={systemPrompt} onChange={(e) => setSystemPrompt(e.target.value)} />
      {config.type === "VOICE" && (
        <div className="rounded-lg border border-gray-200 p-3">
          <Toggle
            label="Auto-call new digital leads"
            description="Voice AI calls a lead automatically the moment it's created (score 0) — also requires the branch's own auto-call toggle to be on"
            checked={autoCallEnabled}
            onChange={handleToggleAutoCall}
          />
        </div>
      )}
      <div className="flex gap-2">
        <Button variant="secondary" onClick={() => setShowGenerate(true)}>
          Generate with AI
        </Button>
        <Button isLoading={saveConfig.isPending} onClick={() => handleSave()}>
          Save
        </Button>
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
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">AI Agents</h1>
        <p className="text-sm text-gray-500">
          Configure the system prompt for each agent. Toggle "Active" to turn a bot on or off — the WhatsApp/Instagram
          chatbots reply automatically once active; the voice agent only calls leads from a campaign you start.
        </p>
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
