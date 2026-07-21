import { useEffect, useState } from "react";
import {
  useCallCampaigns,
  useCreateCallCampaign,
  useStartCallCampaign,
  usePauseCallCampaign,
  useCallLogs,
} from "../hooks/useVoice";
import { useLeads } from "../hooks/useLeads";
import { Button } from "../components/common/Button";
import { DatePickerField } from "../components/common/DateTimePicker";
import { Input, Select } from "../components/common/Input";
import { Modal } from "../components/common/Modal";
import { LeadFilters } from "../components/leads/LeadFilters";
import type { LeadFilters as LeadFiltersType } from "../api/leads.api";
import type { CallStatus, GlobalCallLog, ListCallLogsFilters } from "../api/voice.api";

const CALL_STATUSES: CallStatus[] = ["QUEUED", "DIALING", "IN_PROGRESS", "COMPLETED", "NO_ANSWER", "FAILED"];

function formatDuration(seconds?: number | null) {
  if (!seconds) return "—";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return mins > 0 ? `${mins} min ${secs} sec` : `${secs} sec`;
}

function CallDetailModal({
  log,
  field,
  onClose,
}: {
  log: GlobalCallLog | null;
  field: "transcript" | "insights";
  onClose: () => void;
}) {
  if (!log) return null;
  const content =
    field === "transcript"
      ? log.transcript ?? "No transcript available."
      : log.insights
        ? JSON.stringify(log.insights, null, 2)
        : "No insights available.";

  return (
    <Modal isOpen={!!log} onClose={onClose} title={field === "transcript" ? "Call Transcript" : "Call Insights"}>
      <pre className="max-h-[60vh] overflow-y-auto whitespace-pre-wrap break-words rounded-md bg-gray-50 p-3 text-xs text-gray-700">
        {content}
      </pre>
    </Modal>
  );
}

function CallLogTable() {
  const [filters, setFilters] = useState<ListCallLogsFilters>({ page: 1, pageSize: 20 });
  const [phoneInput, setPhoneInput] = useState("");
  const { data, isLoading } = useCallLogs(filters);
  const [detail, setDetail] = useState<{ log: GlobalCallLog; field: "transcript" | "insights" } | null>(null);

  useEffect(() => {
    const next = phoneInput || undefined;
    if (next === filters.phoneNumber) return;
    const t = setTimeout(() => setFilters((f) => ({ ...f, phoneNumber: next, page: 1 })), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phoneInput]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 bg-white p-4">
        <Input
          label="Phone Number"
          value={phoneInput}
          onChange={(e) => setPhoneInput(e.target.value)}
          placeholder="Search by phone"
        />
        <Select
          label="Status"
          value={filters.status ?? ""}
          onChange={(e) => setFilters((f) => ({ ...f, status: (e.target.value || undefined) as CallStatus, page: 1 }))}
        >
          <option value="">All</option>
          {CALL_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
        <DatePickerField
          label="From"
          value={filters.dateFrom ?? undefined}
          onChange={(value) => setFilters((f) => ({ ...f, dateFrom: value || undefined, page: 1 }))}
        />
        <DatePickerField
          label="To"
          value={filters.dateTo ?? undefined}
          onChange={(value) => setFilters((f) => ({ ...f, dateTo: value || undefined, page: 1 }))}
        />
        <Button
          variant="secondary"
          onClick={() => {
            setPhoneInput("");
            setFilters({ page: 1, pageSize: 20 });
          }}
        >
          Reset
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs font-medium text-gray-500">
            <tr>
              <th className="px-4 py-2">Time</th>
              <th className="px-4 py-2">To Phone Number</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Duration</th>
              <th className="px-4 py-2">Recording</th>
              <th className="px-4 py-2">Transcript</th>
              <th className="px-4 py-2">Insights</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-gray-500">
                  Loading…
                </td>
              </tr>
            ) : data?.items.length ? (
              data.items.map((log) => (
                <tr key={log.id}>
                  <td className="whitespace-nowrap px-4 py-2 text-gray-600">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-2 text-gray-900">{log.toNumber}</td>
                  <td className="px-4 py-2 text-xs">{log.status}</td>
                  <td className="px-4 py-2 text-gray-600">{formatDuration(log.durationSeconds)}</td>
                  <td className="px-4 py-2">
                    {log.recordingUrl ? <audio controls src={log.recordingUrl} className="h-8" /> : "—"}
                  </td>
                  <td className="px-4 py-2">
                    <button
                      className="text-blue-600 hover:underline disabled:text-gray-300 disabled:no-underline"
                      disabled={!log.transcript}
                      onClick={() => setDetail({ log, field: "transcript" })}
                    >
                      View
                    </button>
                  </td>
                  <td className="px-4 py-2">
                    <button
                      className="text-blue-600 hover:underline disabled:text-gray-300 disabled:no-underline"
                      disabled={!log.insights}
                      onClick={() => setDetail({ log, field: "insights" })}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-gray-500">
                  No calls found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {data && data.total > data.pageSize && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>
            Showing {(data.page - 1) * data.pageSize + 1} to {Math.min(data.page * data.pageSize, data.total)} of{" "}
            {data.total} results
          </span>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              disabled={data.page <= 1}
              onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) - 1 }))}
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              disabled={data.page * data.pageSize >= data.total}
              onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) + 1 }))}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {detail && <CallDetailModal log={detail.log} field={detail.field} onClose={() => setDetail(null)} />}
    </div>
  );
}


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
  const [tab, setTab] = useState<"campaigns" | "call-log">("campaigns");
  const [showCreate, setShowCreate] = useState(false);
  const { data: campaigns, isLoading } = useCallCampaigns();
  const startCampaign = useStartCallCampaign();
  const pauseCampaign = usePauseCallCampaign();

  return (
    <div className="mx-auto w-full max-w-7xl flex flex-col gap-6">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 px-6 py-8 shadow-xl dark:bg-slate-950 sm:px-8 sm:py-10">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-[10%] -top-[50%] h-[200%] w-[50%] rounded-full bg-indigo-600/30 blur-[100px] dark:bg-indigo-600/20" />
          <div className="absolute -right-[20%] top-[-20%] h-[150%] w-[60%] rounded-full bg-violet-500/20 blur-[120px] dark:bg-violet-500/10" />
        </div>

        <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <span className="inline-flex items-center rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-xs sm:text-sm font-medium text-indigo-300 ring-1 ring-inset ring-indigo-500/20 backdrop-blur-md">
              Voice Outbound
            </span>
            <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              Call Campaigns
            </h1>
            <p className="mt-2 text-sm sm:text-base text-slate-300">
              Queue leads for the AI voice agent to call. Requires the Voice agent to be active.
            </p>
          </div>
            {tab === "campaigns" && (
              <div className="shrink-0">
                <Button onClick={() => setShowCreate(true)}>
                  + New Campaign
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-1 rounded-xl border border-slate-200/60 bg-white p-1.5 shadow-sm w-fit overflow-x-auto">
          <button
            className={`flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              tab === "campaigns"
                ? "bg-blue-600 text-white shadow-md"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
            onClick={() => setTab("campaigns")}
          >
            Campaigns
          </button>
          <button
            className={`flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              tab === "call-log"
                ? "bg-blue-600 text-white shadow-md"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
            onClick={() => setTab("call-log")}
          >
            Call Log
          </button>
        </div>

      {tab === "call-log" ? (
        <CallLogTable />
      ) : isLoading ? (
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
