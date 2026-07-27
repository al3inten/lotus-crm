import { useState } from "react";
import { useMessageCampaigns, useCreateMessageCampaign, useSegmentPreview, useRunMessageCampaign } from "../hooks/useCampaigns";
import { useTemplates } from "../hooks/useTemplates";
import { useBranches } from "../hooks/useBranches";
import { Button } from "../components/common/Button";
import { Input, Select } from "../components/common/Input";
import { Modal } from "../components/common/Modal";
import { ENQUIRY_STATUSES, LEAD_SOURCES } from "../types";
import type { SegmentFilters } from "../api/campaigns.api";

function CreateCampaignModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [name, setName] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [filters, setFilters] = useState<SegmentFilters>({});
  const { data: templates } = useTemplates();
  const { data: branches } = useBranches();
  const { data: count } = useSegmentPreview(filters, Object.values(filters).some(Boolean));
  const createCampaign = useCreateMessageCampaign();

  const handleSubmit = async () => {
    if (!name || !templateId) return;
    await createCampaign.mutateAsync({ name, templateId, segmentFilters: filters });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Bulk Message Campaign">
      <div className="flex flex-col gap-3">
        <Input label="Campaign Name" value={name} onChange={(e) => setName(e.target.value)} />
        <Select label="Template" value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
          <option value="">Select template</option>
          {templates?.filter((t) => t.channel === "WHATSAPP").map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </Select>
        <Select label="Branch" value={filters.branchId ?? ""} onChange={(e) => setFilters((f) => ({ ...f, branchId: e.target.value || undefined }))}>
          <option value="">All branches</option>
          {branches?.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </Select>
        <Select label="Status" value={filters.status ?? ""} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value || undefined }))}>
          <option value="">Any status</option>
          {ENQUIRY_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.replaceAll("_", " ")}
            </option>
          ))}
        </Select>
        <Select label="Source" value={filters.source ?? ""} onChange={(e) => setFilters((f) => ({ ...f, source: e.target.value || undefined }))}>
          <option value="">Any source</option>
          {LEAD_SOURCES.map((s) => (
            <option key={s} value={s}>
              {s.replaceAll("_", " ")}
            </option>
          ))}
        </Select>
        {count !== undefined && <p className="text-sm text-gray-600">{count} lead(s) match this segment.</p>}
        <Button type="button" isLoading={createCampaign.isPending} disabled={!name || !templateId} onClick={handleSubmit} className="w-fit">
          Create Campaign
        </Button>
      </div>
    </Modal>
  );
}

export function BulkMessagesPage() {
  const [showCreate, setShowCreate] = useState(false);
  const { data: campaigns, isLoading } = useMessageCampaigns();
  const runCampaign = useRunMessageCampaign();

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
              Broadcast Center
            </span>
            <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              Bulk Messages
            </h1>
            <p className="mt-2 text-sm sm:text-base text-slate-300">
              Send a WhatsApp template message to a segment of leads. Sends are paced automatically to stay within rate limits.
            </p>
          </div>
            <div className="shrink-0">
              <Button onClick={() => setShowCreate(true)}>
                + New Campaign
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
                <th className="px-4 py-2">Template</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {campaigns?.map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-2 font-medium text-gray-900">{c.name}</td>
                  <td className="px-4 py-2 text-gray-600">{c.template.name}</td>
                  <td className="px-4 py-2 text-gray-600">{c.status}</td>
                  <td className="px-4 py-2">
                    {c.status === "DRAFT" && (
                      <Button variant="secondary" onClick={() => runCampaign.mutate(c.id)}>
                        Send Now
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CreateCampaignModal isOpen={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  );
}
