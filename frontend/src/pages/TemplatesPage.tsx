import { useState } from "react";
import { useTemplates, useCreateTemplate, useDeleteTemplate } from "../hooks/useTemplates";
import { useMediaAssets } from "../hooks/useMedia";
import { Button } from "../components/common/Button";
import { Input, Select, Textarea } from "../components/common/Input";
import { Modal } from "../components/common/Modal";

function CreateTemplateForm({ onDone }: { onDone: () => void }) {
  const createTemplate = useCreateTemplate();
  const { data: media } = useMediaAssets();
  const [name, setName] = useState("");
  const [channel, setChannel] = useState<"WHATSAPP" | "INSTAGRAM">("WHATSAPP");
  const [category, setCategory] = useState("MARKETING");
  const [bodyText, setBodyText] = useState("");
  const [mediaAssetId, setMediaAssetId] = useState("");

  const handleSubmit = async () => {
    if (!name || !bodyText) return;
    await createTemplate.mutateAsync({ name, channel, category, bodyText, mediaAssetId: mediaAssetId || undefined });
    onDone();
  };

  return (
    <div className="flex flex-col gap-3">
      <Input label="Template Name" value={name} onChange={(e) => setName(e.target.value)} />
      <Select label="Channel" value={channel} onChange={(e) => setChannel(e.target.value as "WHATSAPP" | "INSTAGRAM")}>
        <option value="WHATSAPP">WhatsApp</option>
        <option value="INSTAGRAM">Instagram</option>
      </Select>
      <Input label="Category" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="MARKETING / UTILITY" />
      <Textarea label="Message Body" rows={4} value={bodyText} onChange={(e) => setBodyText(e.target.value)} />
      <Select label="Attach Media (optional)" value={mediaAssetId} onChange={(e) => setMediaAssetId(e.target.value)}>
        <option value="">None</option>
        {media?.map((m) => (
          <option key={m.id} value={m.id}>
            {m.label}
          </option>
        ))}
      </Select>
      <p className="text-xs text-gray-500">
        For WhatsApp, this template needs to be registered and approved in Meta Business Manager before it can be
        used for business-initiated messages outside a 24-hour reply window.
      </p>
      <Button type="button" isLoading={createTemplate.isPending} disabled={!name || !bodyText} onClick={handleSubmit} className="w-fit">
        Create Template
      </Button>
    </div>
  );
}

export function TemplatesPage() {
  const [showCreate, setShowCreate] = useState(false);
  const { data: templates, isLoading } = useTemplates();
  const deleteTemplate = useDeleteTemplate();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Message Templates</h1>
          <p className="text-sm text-gray-500">Reusable messages for the chatbot and bulk campaigns.</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>+ New Template</Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs font-medium text-gray-500">
              <tr>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Channel</th>
                <th className="px-4 py-2">Category</th>
                <th className="px-4 py-2">Body</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {templates?.map((t) => (
                <tr key={t.id}>
                  <td className="px-4 py-2 font-medium text-gray-900">{t.name}</td>
                  <td className="px-4 py-2 text-gray-600">{t.channel}</td>
                  <td className="px-4 py-2 text-gray-600">{t.category}</td>
                  <td className="max-w-xs truncate px-4 py-2 text-gray-600">{t.bodyText}</td>
                  <td className="px-4 py-2">
                    <Button variant="danger" onClick={() => deleteTemplate.mutate(t.id)}>
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="New Template">
        <CreateTemplateForm onDone={() => setShowCreate(false)} />
      </Modal>
    </div>
  );
}
