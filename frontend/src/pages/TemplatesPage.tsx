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
    <div className="mx-auto w-full max-w-7xl flex flex-col gap-6">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 px-6 py-8 shadow-xl dark:bg-slate-950 sm:px-8 sm:py-10">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-[10%] -top-[50%] h-[200%] w-[50%] rounded-full bg-emerald-600/30 blur-[100px] dark:bg-emerald-600/20" />
          <div className="absolute -right-[20%] top-[-20%] h-[150%] w-[60%] rounded-full bg-teal-500/20 blur-[120px] dark:bg-teal-500/10" />
        </div>

        <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs sm:text-sm font-medium text-emerald-300 ring-1 ring-inset ring-emerald-500/20 backdrop-blur-md">
              Message Studio
            </span>
            <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              Templates
            </h1>
            <p className="mt-2 text-sm sm:text-base text-slate-300">
              Design reusable messages for chatbots and bulk marketing campaigns.
            </p>
          </div>
            <div className="shrink-0">
              <Button onClick={() => setShowCreate(true)}>
                + New Template
              </Button>
            </div>
          </div>
        </div>

      {isLoading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200/60 bg-white shadow-sm">
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
