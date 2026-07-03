import { useState } from "react";
import { useParams } from "react-router-dom";
import { useLeadHistory } from "../hooks/useLeads";
import { useEnquiry, useReassign } from "../hooks/useEnquiry";
import { useBranchStaff } from "../hooks/useUsers";
import { useCallLogsForLead } from "../hooks/useVoice";
import { useAuth } from "../context/AuthContext";
import { EnquiryHistoryList } from "../components/leads/EnquiryHistoryList";
import { StatusTimeline } from "../components/enquiry/StatusTimeline";
import { StatusChangeModal } from "../components/enquiry/StatusChangeModal";
import { TestDriveForm } from "../components/enquiry/TestDriveForm";
import { QuotationForm } from "../components/enquiry/QuotationForm";
import { ExchangeForm } from "../components/enquiry/ExchangeForm";
import { FinanceForm } from "../components/enquiry/FinanceForm";
import { DeliveryForm } from "../components/enquiry/DeliveryForm";
import { StatusBadge } from "../components/common/StatusBadge";
import { Button } from "../components/common/Button";
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

  if (leadLoading || !lead) return <p className="text-sm text-gray-500">Loading…</p>;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-1">
        <h2 className="mb-1 text-lg font-semibold text-gray-900">{lead.name}</h2>
        <p className="mb-3 text-sm text-gray-500">{lead.phoneRaw}</p>
        {lead.enquiries.length > 1 && (
          <p className="mb-3 w-fit rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
            Repeat Customer — {lead.enquiries.length} enquiries
          </p>
        )}
        <h3 className="mb-2 text-xs font-semibold uppercase text-gray-400">Enquiry History</h3>
        <EnquiryHistoryList enquiries={lead.enquiries} activeEnquiryId={activeEnquiryId ?? ""} />

        {callLogs && callLogs.length > 0 && (
          <>
            <h3 className="mb-2 mt-4 text-xs font-semibold uppercase text-gray-400">Call History</h3>
            <ul className="flex flex-col gap-2">
              {callLogs.map((call) => (
                <li key={call.id} className="rounded-md border border-gray-200 bg-white p-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-900">{call.status}</span>
                    <span className="text-xs text-gray-400">{new Date(call.createdAt).toLocaleString()}</span>
                  </div>
                  {call.durationSeconds != null && <p className="text-xs text-gray-500">{call.durationSeconds}s</p>}
                  {call.recordingUrl && <audio controls src={call.recordingUrl} className="mt-1 h-8 w-full" />}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <div className="flex flex-col gap-6 lg:col-span-2">
        {enquiryLoading || !enquiry ? (
          <p className="text-sm text-gray-500">Loading enquiry…</p>
        ) : (
          <>
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">{enquiry.carModel}</h3>
                  <p className="text-xs text-gray-500">
                    {enquiry.branch.name} · {enquiry.source.replaceAll("_", " ")} ·{" "}
                    {new Date(enquiry.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <StatusBadge status={enquiry.status} />
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-gray-600">
                <span>Assigned CR: {enquiry.assignedCr?.name ?? "Unassigned"}</span>
                <span>Consultant: {enquiry.consultant?.name ?? "—"}</span>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Button onClick={() => setShowStatusModal(true)}>Update Status</Button>

                {user && REASSIGN_ROLES.includes(user.role) && (
                  <div className="flex items-center gap-2">
                    <Select value={reassignTo} onChange={(e) => setReassignTo(e.target.value)}>
                      <option value="">Reassign to…</option>
                      {crTeam?.map((cr) => (
                        <option key={cr.id} value={cr.id}>
                          {cr.name}
                        </option>
                      ))}
                    </Select>
                    <Button
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
            </div>

            {enquiry.status === "APPOINTMENT_SCHEDULED" || enquiry.status === "TEST_DRIVE_DONE" || enquiry.testDriveFeedback ? (
              <TestDriveForm enquiryId={enquiry.id} branchId={enquiry.branchId} existing={enquiry.testDriveFeedback} />
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

            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase text-gray-400">Status Timeline</h3>
              <StatusTimeline history={enquiry.statusHistory ?? []} />
            </div>

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
  );
}
