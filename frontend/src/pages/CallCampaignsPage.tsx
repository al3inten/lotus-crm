import { useState } from "react";
import { useCallCampaigns, useCreateCallCampaign, useStartCallCampaign, usePauseCallCampaign } from "../hooks/useVoice";
import { useLeads } from "../hooks/useLeads";
import { Button } from "../components/common/Button";
import { Input } from "../components/common/Input";
import { Modal } from "../components/common/Modal";
import { LeadFilters } from "../components/leads/LeadFilters";
import type { LeadFilters as LeadFiltersType } from "../api/leads.api";

function CreateCampaignModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [name, setName] = useState("");
  const [filters, setFilters] = useState<LeadFiltersType>({ page: 1, pageSize: 20 });
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const { data } = useLeads(filters);
  const createCampaign = useCreateCallCampaign();

  const toggle = (enquiryId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(enquiryId)) next.delete(enquiryId);
      else next.add(enquiryId);
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!name || selected.size === 0) return;
    await createCampaign.mutateAsync({ name, enquiryIds: Array.from(selected) });
    setSelected(new Set());
    setName("");
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Call Campaign">
      <div className="flex flex-col gap-3">
        <Input label="Campaign Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Follow-up calls - week of..." />
        <LeadFilters filters={filters} onChange={setFilters} />
        <div className="max-h-64 overflow-y-auto rounded-md border border-gray-200">
          {data?.items.map((enquiry) => (
            <label key={enquiry.id} className="flex items-center gap-2 border-b border-gray-100 p-2 text-sm last:border-0">
              <input type="checkbox" checked={selected.has(enquiry.id)} onChange={() => toggle(enquiry.id)} />
              <span className="font-medium text-gray-900">{enquiry.lead.name}</span>
              <span className="text-gray-500">{enquiry.lead.phoneRaw}</span>
              <span className="text-gray-500">· {enquiry.carModel}</span>
            </label>
          ))}
        </div>
        <p className="text-xs text-gray-500">{selected.size} selected</p>
        <Button type="button" isLoading={createCampaign.isPending} disabled={!name || selected.size === 0} onClick={handleSubmit} className="w-fit">
          Create Campaign
        </Button>
      </div>
    </Modal>
  );
}

export function CallCampaignsPage() {
  const [showCreate, setShowCreate] = useState(false);
  const { data: campaigns, isLoading } = useCallCampaigns();
  const startCampaign = useStartCallCampaign();
  const pauseCampaign = usePauseCallCampaign();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Call Campaigns</h1>
          <p className="text-sm text-gray-500">Queue leads for the AI voice agent to call. Requires the Voice agent to be active.</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>+ New Campaign</Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : (
        <div className="flex flex-col gap-4">
          {campaigns?.map((campaign) => (
            <div key={campaign.id} className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">{campaign.name}</h3>
                  <p className="text-xs text-gray-500">{campaign.tasks.length} calls · {campaign.status}</p>
                </div>
                <div className="flex gap-2">
                  {campaign.status !== "RUNNING" && (
                    <Button variant="secondary" onClick={() => startCampaign.mutate(campaign.id)}>
                      Start
                    </Button>
                  )}
                  {campaign.status === "RUNNING" && (
                    <Button variant="secondary" onClick={() => pauseCampaign.mutate(campaign.id)}>
                      Pause
                    </Button>
                  )}
                </div>
              </div>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-xs font-medium text-gray-500">
                    <tr>
                      <th className="py-1 pr-4">Lead</th>
                      <th className="py-1 pr-4">Phone</th>
                      <th className="py-1 pr-4">Status</th>
                      <th className="py-1 pr-4">Duration</th>
                      <th className="py-1 pr-4">Recording</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {campaign.tasks.map((task) => (
                      <tr key={task.id}>
                        <td className="py-1 pr-4 text-gray-900">{task.enquiry.lead.name}</td>
                        <td className="py-1 pr-4 text-gray-600">{task.phoneNumber}</td>
                        <td className="py-1 pr-4">
                          <span className="text-xs">{task.status}</span>
                        </td>
                        <td className="py-1 pr-4 text-gray-600">
                          {task.callLog?.durationSeconds ? `${task.callLog.durationSeconds}s` : "—"}
                        </td>
                        <td className="py-1 pr-4">
                          {task.callLog?.recordingUrl ? (
                            <audio controls src={task.callLog.recordingUrl} className="h-8" />
                          ) : (
                            "—"
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      <CreateCampaignModal isOpen={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  );
}
