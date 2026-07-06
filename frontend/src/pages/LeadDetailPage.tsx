import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Phone,
  Mail,
  UserCircle2,
  Car,
  History,
  MessagesSquare,
  PhoneCall,
  ArrowRightCircle,
  UserCog,
} from "lucide-react";
import { useLeadHistory } from "../hooks/useLeads";
import { useEnquiry, useReassign } from "../hooks/useEnquiry";
import { useBranchStaff } from "../hooks/useUsers";
import { useCallLogsForLead } from "../hooks/useVoice";
import { useAuth } from "../context/AuthContext";
import { EnquiryHistoryList } from "../components/leads/EnquiryHistoryList";
import { StatusTimeline } from "../components/enquiry/StatusTimeline";
import { StatusChangeModal } from "../components/enquiry/StatusChangeModal";
import { PipelineStepper } from "../components/enquiry/PipelineStepper";
import { TestDriveForm } from "../components/enquiry/TestDriveForm";
import { QuotationForm } from "../components/enquiry/QuotationForm";
import { ExchangeForm } from "../components/enquiry/ExchangeForm";
import { FinanceForm } from "../components/enquiry/FinanceForm";
import { DeliveryForm } from "../components/enquiry/DeliveryForm";
import { StatusBadge } from "../components/common/StatusBadge";
import { Avatar } from "../components/common/Avatar";
import { Button } from "../components/common/Button";
import { Card, CardHeader } from "../components/common/Card";
import { Select } from "../components/common/Input";

const REASSIGN_ROLES = ["SUPER_ADMIN", "ADMIN", "BRANCH_MANAGER"];

export function LeadDetailPage() {
  const { leadId, enquiryId: enquiryIdParam } = useParams<{ leadId: string; enquiryId?: string }>();
  const { user } = useAuth();
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [reassignTo, setReassignTo] = useState("");

  const { data: lead, isLoading: leadLoading } = useLeadHistory(leadId);
  const activeEnquiryId = enquiryIdParam ?? lead?.enquiries[0]?.id;
  const { data: enquiry, isLoading: enquiryLoading } = useEnquiry(activeEnquiryId);
  const reassign = useReassign(activeEnquiryId ?? "");
  const { data: crTeam } = useBranchStaff(enquiry?.branchId, "CR_TEAM");
  const { data: callLogs } = useCallLogsForLead(leadId);

  if (leadLoading || !lead) {
    return (
      <div className="flex flex-col gap-4">
        <div className="h-5 w-32 animate-pulse rounded bg-gray-200" />
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[340px_1fr]">
          <div className="h-40 animate-pulse rounded-xl bg-gray-200" />
          <div className="h-64 animate-pulse rounded-xl bg-gray-200" />
        </div>
      </div>
    );
  }

  const totalContacts = Math.max(lead.touches.length, lead.enquiries.length);

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <Link to="/leads" className="flex w-fit items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800">
        <ArrowLeft size={15} />
        Back to Leads
      </Link>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[340px_1fr]">
        {/* ---------- Left rail: customer profile ---------- */}
        <div className="flex min-w-0 flex-col gap-4">
          <Card>
            <div className="flex items-center gap-3">
              <Avatar name={lead.name} size="lg" />
              <div className="min-w-0">
                <h1 className="truncate text-lg font-bold text-gray-900">{lead.name}</h1>
                <p className="flex items-center gap-1.5 text-sm text-gray-500">
                  <Phone size={13} className="shrink-0" /> <span className="truncate">{lead.phoneRaw}</span>
                </p>
                {lead.email && (
                  <p className="flex items-center gap-1.5 text-sm text-gray-500">
                    <Mail size={13} className="shrink-0" /> <span className="truncate">{lead.email}</span>
                  </p>
                )}
              </div>
            </div>
            {totalContacts > 1 && (
              <p className="mt-3 w-fit rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
                Repeat customer · {totalContacts} contacts
              </p>
            )}
          </Card>

          <Card>
            <CardHeader
              icon={<MessagesSquare size={18} />}
              iconClassName="bg-fuchsia-50 text-fuchsia-600"
              title="Contact History"
              subtitle="Every way they've reached us"
            />
            <div className="mb-3 flex flex-wrap gap-1.5">
              {Object.entries(lead.touchesBySource).map(([source, count]) => (
                <span key={source} className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                  {source.replaceAll("_", " ")} ×{count}
                </span>
              ))}
              {Object.entries(lead.messagesByChannel).map(([channel, count]) => (
                <span key={channel} className="rounded-full bg-fuchsia-50 px-2.5 py-1 text-xs font-medium text-fuchsia-700">
                  {channel} msgs: {count}
                </span>
              ))}
            </div>
            <ul className="flex flex-col gap-1.5">
              {lead.touches.slice(0, 6).map((touch) => (
                <li key={touch.id} className="rounded-md bg-gray-50 px-3 py-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-800">{touch.source.replaceAll("_", " ")}</span>
                    <span className="text-gray-400">{new Date(touch.createdAt).toLocaleDateString()}</span>
                  </div>
                  {touch.note && <p className="mt-0.5 text-gray-500">{touch.note}</p>}
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <CardHeader
              icon={<History size={18} />}
              iconClassName="bg-sky-50 text-sky-600"
              title="Enquiries"
              subtitle={`${lead.enquiries.length} buying journey(s)`}
            />
            <EnquiryHistoryList enquiries={lead.enquiries} activeEnquiryId={activeEnquiryId ?? ""} />
          </Card>

          {callLogs && callLogs.length > 0 && (
            <Card>
              <CardHeader
                icon={<PhoneCall size={18} />}
                iconClassName="bg-emerald-50 text-emerald-600"
                title="AI Call History"
              />
              <ul className="flex flex-col gap-2">
                {callLogs.map((call) => (
                  <li key={call.id} className="rounded-md bg-gray-50 p-2.5 text-sm">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-gray-800">{call.status.replaceAll("_", " ")}</span>
                      <span className="text-gray-400">{new Date(call.createdAt).toLocaleString()}</span>
                    </div>
                    {call.recordingUrl && <audio controls src={call.recordingUrl} className="mt-1.5 h-8 w-full" />}
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>

        {/* ---------- Right: enquiry pipeline ---------- */}
        <div className="flex min-w-0 flex-col gap-4">
          {enquiryLoading || !enquiry ? (
            <div className="flex flex-col gap-4">
              <div className="h-52 animate-pulse rounded-xl bg-gray-200" />
              <div className="h-40 animate-pulse rounded-xl bg-gray-200" />
            </div>
          ) : (
            <>
              <Card>
                <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                      <Car size={22} />
                    </span>
                    <div className="min-w-0">
                      <h2 className="truncate text-lg font-bold text-gray-900">{enquiry.carModel}</h2>
                      <p className="truncate text-xs text-gray-500">
                        {enquiry.branch.name} · {enquiry.source.replaceAll("_", " ")} ·{" "}
                        {new Date(enquiry.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={enquiry.status} />
                </div>

                <PipelineStepper status={enquiry.status} />

                <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-gray-100 pt-4 text-sm">
                  <span className="flex items-center gap-1.5 text-gray-600">
                    <UserCircle2 size={15} className="shrink-0 text-gray-400" />
                    CR: <strong className="text-gray-900">{enquiry.assignedCr?.name ?? "Unassigned"}</strong>
                  </span>
                  <span className="flex items-center gap-1.5 text-gray-600">
                    <UserCog size={15} className="shrink-0 text-gray-400" />
                    Consultant: <strong className="text-gray-900">{enquiry.consultant?.name ?? "—"}</strong>
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4">
                  <Button icon={<ArrowRightCircle size={15} />} onClick={() => setShowStatusModal(true)}>
                    Move to Next Stage
                  </Button>
                  {user && REASSIGN_ROLES.includes(user.role) && (
                    <div className="flex flex-wrap items-center gap-2 rounded-lg bg-gray-50 p-2">
                      <span className="pl-1 text-xs font-medium text-gray-500">Reassign CR</span>
                      <Select value={reassignTo} onChange={(e) => setReassignTo(e.target.value)} className="w-40">
                        <option value="">Select CR…</option>
                        {crTeam?.map((cr) => (
                          <option key={cr.id} value={cr.id}>
                            {cr.name}
                          </option>
                        ))}
                      </Select>
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={!reassignTo}
                        onClick={() => {
                          reassign.mutate({ toUserId: reassignTo });
                          setReassignTo("");
                        }}
                      >
                        Reassign
                      </Button>
                    </div>
                  )}
                </div>
              </Card>

              {enquiry.status === "APPOINTMENT_SCHEDULED" ||
              enquiry.status === "TEST_DRIVE_DONE" ||
              (enquiry.testDriveFeedbacks?.length ?? 0) > 0 ? (
                <TestDriveForm enquiryId={enquiry.id} branchId={enquiry.branchId} existing={enquiry.testDriveFeedbacks} />
              ) : null}

              {["FEEDBACK_COLLECTED", "QUOTATION_SHARED", "NEGOTIATION"].includes(enquiry.status) || enquiry.quotation ? (
                <QuotationForm enquiryId={enquiry.id} branchId={enquiry.branchId} existing={enquiry.quotation} />
              ) : null}

              {enquiry.status === "EXCHANGE_IN_PROGRESS" || enquiry.exchangeEvaluation ? (
                <ExchangeForm enquiryId={enquiry.id} branchId={enquiry.branchId} existing={enquiry.exchangeEvaluation} />
              ) : null}

              {enquiry.status === "FINANCE_IN_PROGRESS" || enquiry.financeApplication ? (
                <FinanceForm enquiryId={enquiry.id} existing={enquiry.financeApplication} />
              ) : null}

              {["DELIVERY_IN_PROGRESS", "DELIVERED"].includes(enquiry.status) || enquiry.deliveryDetails ? (
                <DeliveryForm enquiryId={enquiry.id} existing={enquiry.deliveryDetails} />
              ) : null}

              <Card>
                <CardHeader
                  icon={<History size={18} />}
                  iconClassName="bg-gray-100 text-gray-600"
                  title="Activity Timeline"
                  subtitle="Every status change and contact, newest last"
                />
                <StatusTimeline history={enquiry.statusHistory ?? []} />
              </Card>

              <StatusChangeModal
                enquiryId={enquiry.id}
                branchId={enquiry.branchId}
                currentStatus={enquiry.status}
                isOpen={showStatusModal}
                onClose={() => setShowStatusModal(false)}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
