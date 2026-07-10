import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Phone,
  Mail,
  UserCircle2,
  Car,
  ClipboardEdit,
  MapPin,
  Tag,
  Briefcase,
  MessagesSquare,
  PhoneCall,
} from "lucide-react";
import { useLeadHistory } from "../hooks/useLeads";
import { useEnquiry, useReassign } from "../hooks/useEnquiry";
import { useBranchStaff } from "../hooks/useUsers";
import { useCallLogsForLead } from "../hooks/useVoice";
import { useAuth } from "../context/AuthContext";
import { useSettings } from "../hooks/useSettings";
import { StatusChangeModal } from "../components/enquiry/StatusChangeModal";
import { PipelineStepper } from "../components/enquiry/PipelineStepper";
import { FollowUpForm } from "../components/enquiry/FollowUpForm";
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
import { AddLeadWizard } from "../components/leads/AddLeadWizard";
import { DIGITAL_SOURCES } from "../types";
import type { AddLeadFormValues } from "../schemas/lead.schema";
import { UnifiedTimeline } from "../components/enquiry/UnifiedTimeline";
import { FollowUpTable } from "../components/enquiry/FollowUpTable";
import { QuickActions } from "../components/enquiry/QuickActions";
import type { EnquiryStatus } from "../types";

const REASSIGN_ROLES = ["SUPER_ADMIN", "ADMIN", "BRANCH_MANAGER"];

const toDateInput = (iso?: string | null) => (iso ? iso.slice(0, 10) : undefined);
const toDatetimeLocalInput = (iso?: string | null) => (iso ? iso.slice(0, 16) : undefined);

export function LeadDetailPage() {
  const { leadId, enquiryId: enquiryIdParam } = useParams<{ leadId: string; enquiryId?: string }>();
  const { user } = useAuth();
  
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusModalTarget, setStatusModalTarget] = useState<EnquiryStatus | undefined>();
  
  const [showDetailsWizard, setShowDetailsWizard] = useState(false);
  const [showFollowUpForm, setShowFollowUpForm] = useState(false);
  const [reassignTo, setReassignTo] = useState("");

  const { data: lead, isLoading: leadLoading } = useLeadHistory(leadId);
  const activeEnquiryId = enquiryIdParam ?? lead?.enquiries[0]?.id;
  const { data: enquiry, isLoading: enquiryLoading } = useEnquiry(activeEnquiryId);
  const reassign = useReassign(activeEnquiryId ?? "");
  const { data: crTeam } = useBranchStaff(enquiry?.branchId, "CR_TEAM");
  const { data: callLogs } = useCallLogsForLead(leadId);
  const { data: settings } = useSettings();

  if (leadLoading || !lead) {
    return (
      <div className="flex flex-col gap-4">
        <div className="h-5 w-32 animate-pulse rounded bg-gray-200" />
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <div className="h-40 animate-pulse rounded-xl bg-gray-200" />
          <div className="h-40 animate-pulse rounded-xl bg-gray-200" />
        </div>
      </div>
    );
  }

  const handleQuickActionStatus = (target?: EnquiryStatus) => {
    setStatusModalTarget(target);
    setShowStatusModal(true);
  };

  // Safe extractors for Enquiry Details section
  const extractBookingDate = () => {
    if (!enquiry?.statusHistory) return null;
    const booked = enquiry.statusHistory.find((h) => h.toStatus === "BOOKED");
    return booked ? new Date(booked.createdAt) : null;
  };

  const extractRetailDate = () => {
    if (!enquiry?.statusHistory) return null;
    const retail = enquiry.statusHistory.find((h) => h.toStatus === "RETAIL_DONE");
    return retail ? new Date(retail.createdAt) : null;
  };

  const extractTestDriveDate = () => {
    if (enquiry?.testDriveFeedbacks && enquiry.testDriveFeedbacks.length > 0) {
      const latest = enquiry.testDriveFeedbacks[0];
      return latest.completedAt ? new Date(latest.completedAt) : latest.scheduledAt ? new Date(latest.scheduledAt) : null;
    }
    return null;
  };

  const bookingDate = extractBookingDate();
  const retailDate = extractRetailDate();
  const tdDate = extractTestDriveDate();

  return (
    <div className="flex min-w-0 flex-col gap-6 max-w-7xl mx-auto pb-10">
      {/* ---------- PAGE SHELL & HEADER ---------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <Link to="/leads" className="flex w-fit items-center gap-1.5 text-sm text-gray-500 hover:text-indigo-600 transition-colors font-medium">
            <ArrowLeft size={16} />
            Back to Leads
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">Lead Details</h1>
            {enquiry && <StatusBadge status={enquiry.status} />}
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          {enquiry && DIGITAL_SOURCES.includes(enquiry.source) && (!enquiry.department || !enquiry.enquiryCategory) && (
            <Button
              variant="secondary"
              size="sm"
              icon={<ClipboardEdit size={14} />}
              onClick={() => setShowDetailsWizard(true)}
            >
              Complete Details
            </Button>
          )}
          
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowDetailsWizard(true)}
          >
            Edit Lead
          </Button>

          {user && REASSIGN_ROLES.includes(user.role) && crTeam && (
            <div className="flex items-center gap-2 rounded-lg bg-white border border-gray-200 p-1 shadow-sm">
              <span className="pl-2 text-xs font-medium text-gray-500">Reassign</span>
              <Select value={reassignTo} onChange={(e) => setReassignTo(e.target.value)} className="w-40 py-1 text-sm border-none shadow-none focus:ring-0">
                <option value="">Select CR…</option>
                {crTeam.map((cr) => (
                  <option key={cr.id} value={cr.id}>{cr.name}</option>
                ))}
              </Select>
              <Button
                size="sm"
                disabled={!reassignTo}
                onClick={() => {
                  reassign.mutate({ toUserId: reassignTo });
                  setReassignTo("");
                }}
              >
                Go
              </Button>
            </div>
          )}
        </div>
      </div>

      {enquiryLoading || !enquiry ? (
        <div className="h-64 animate-pulse rounded-xl bg-gray-200" />
      ) : (
        <>
          {/* ---------- SECTION 1: INFORMATION CARDS ---------- */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Customer Information Card */}
            <Card className="flex flex-col h-full shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3 mb-4">Customer Information</h2>
              <div className="flex items-center gap-4 mb-6">
                <Avatar name={lead.name} size="lg" />
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{lead.name}</h3>
                  <p className="text-sm text-gray-500 font-medium">Customer</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-sm">
                <div>
                  <p className="text-gray-500 mb-1 flex items-center gap-1.5"><Phone size={14}/> Mobile Number</p>
                  <p className="font-medium text-gray-900">{lead.phoneRaw}</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1 flex items-center gap-1.5"><Mail size={14}/> Email</p>
                  <p className="font-medium text-gray-900">{lead.email || "—"}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-gray-500 mb-1 flex items-center gap-1.5"><MapPin size={14}/> Address</p>
                  <p className="font-medium text-gray-900">{lead.address ? `${lead.address}${lead.pincode ? `, ${lead.pincode}` : ''}` : "—"}</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1 flex items-center gap-1.5"><Car size={14}/> Interested Vehicle</p>
                  <p className="font-medium text-gray-900">{enquiry.carModel}</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1 flex items-center gap-1.5"><Tag size={14}/> Customer Category</p>
                  <p className="font-medium text-gray-900">{enquiry.enquiryCategory || "—"}</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1 flex items-center gap-1.5"><Briefcase size={14}/> Profession</p>
                  <p className="font-medium text-gray-900">{lead.profession || "—"}</p>
                </div>
              </div>
            </Card>

            {/* Enquiry Summary Card */}
            <Card className="flex flex-col h-full shadow-sm bg-gray-50/50">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
                <h2 className="text-lg font-bold text-gray-900">Enquiry Summary</h2>
                <span className="text-xs font-medium bg-gray-200 text-gray-700 px-2.5 py-1 rounded-full">
                  #{enquiry.id.slice(-6).toUpperCase()}
                </span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-6 text-sm">
                <div>
                  <p className="text-gray-500 mb-1">Branch</p>
                  <p className="font-semibold text-gray-900">{enquiry.branch.name}</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Source</p>
                  <p className="font-medium text-gray-900">{enquiry.source.replaceAll("_", " ")}</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Enquiry Date</p>
                  <p className="font-medium text-gray-900">{new Date(enquiry.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Current Stage</p>
                  <p className="font-medium text-gray-900">{enquiry.status.replaceAll("_", " ")}</p>
                </div>
                <div className="sm:col-span-2 border-t border-gray-100 pt-4 mt-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <p className="text-gray-500 mb-1 flex items-center gap-1.5"><UserCircle2 size={14}/> Sales Consultant (CR)</p>
                      <p className="font-medium text-gray-900">{enquiry.assignedCr?.name ?? "Unassigned"}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-1 flex items-center gap-1.5"><UserCircle2 size={14}/> Showroom Consultant</p>
                      <p className="font-medium text-gray-900">{enquiry.consultant?.name ?? "—"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* ---------- SECTION 2: STAGE PROGRESS BAR ---------- */}
          <Card className="shadow-sm">
            <h2 className="text-base font-bold text-gray-900 mb-6 hidden">Pipeline Progress</h2>
            <PipelineStepper status={enquiry.status} lossReason={enquiry.lossReason} />
          </Card>

          {/* ---------- SECTION 6: QUICK ACTIONS ---------- */}
          {enquiry.status !== "CLOSED" && (
            <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-indigo-900 text-sm">Suggested Actions</h3>
                <p className="text-xs text-indigo-700/80 mt-0.5">Move this deal forward based on current stage.</p>
              </div>
              <QuickActions 
                status={enquiry.status} 
                onAddFollowUp={() => setShowFollowUpForm(true)} 
                onChangeStatus={handleQuickActionStatus} 
              />
            </div>
          )}

          {/* ---------- FORMS SECTION (CONDITIONAL) ---------- */}
          <div className="flex flex-col gap-4">
            {showFollowUpForm && (
              <FollowUpForm enquiryId={enquiry.id} onSuccess={() => setShowFollowUpForm(false)} onCancel={() => setShowFollowUpForm(false)} />
            )}

            {enquiry.status === "APPOINTMENT_FIXED" ||
            enquiry.status === "TEST_DRIVE" ||
            (enquiry.testDriveFeedbacks?.length ?? 0) > 0 ? (
              <TestDriveForm enquiryId={enquiry.id} branchId={enquiry.branchId} existing={enquiry.testDriveFeedbacks} />
            ) : null}

            {settings?.quotationEnabled !== false &&
              (["TEST_DRIVE", "BOOKED", "RETAIL_DONE"].includes(enquiry.status) || enquiry.quotation) ? (
              <QuotationForm enquiryId={enquiry.id} branchId={enquiry.branchId} existing={enquiry.quotation} />
            ) : null}

            {enquiry.status === "BOOKED" || enquiry.exchangeEvaluation ? (
              <ExchangeForm enquiryId={enquiry.id} branchId={enquiry.branchId} existing={enquiry.exchangeEvaluation} />
            ) : null}

            {enquiry.status === "BOOKED" || enquiry.financeApplication ? (
              <FinanceForm enquiryId={enquiry.id} existing={enquiry.financeApplication} />
            ) : null}

            {enquiry.status === "RETAIL_DONE" || enquiry.deliveryDetails ? (
              <DeliveryForm enquiryId={enquiry.id} existing={enquiry.deliveryDetails} />
            ) : null}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 flex flex-col gap-6">
              {/* ---------- SECTION 5: FOLLOW-UP HISTORY ---------- */}
              <FollowUpTable 
                followUps={enquiry.followUps || []} 
                onAddClick={() => setShowFollowUpForm(true)} 
                canAdd={enquiry.status !== "CLOSED"} 
              />

              {/* ---------- SECTION 4: ACTIVITY TIMELINE ---------- */}
              <Card className="shadow-sm">
                <CardHeader
                  icon={<MessagesSquare size={18} />}
                  iconClassName="bg-blue-50 text-blue-600"
                  title="Activity Timeline"
                  subtitle="Complete audit history of stage changes and follow-ups"
                />
                <UnifiedTimeline enquiryId={enquiry.id} statusHistory={enquiry.statusHistory || []} followUps={enquiry.followUps || []} />
              </Card>
            </div>

            <div className="flex flex-col gap-6">
              {/* ---------- SECTION 3: ENQUIRY DETAILS (DATES) ---------- */}
              <Card className="shadow-sm">
                <h2 className="text-base font-bold text-gray-900 mb-4 border-b border-gray-100 pb-3">Key Dates</h2>
                <div className="flex flex-col gap-3 text-sm">
                  <div className="flex justify-between items-center py-1">
                    <span className="text-gray-500">Enquiry Date</span>
                    <span className="font-medium text-gray-900">{new Date(enquiry.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-gray-500">Appointment Date</span>
                    <span className="font-medium text-gray-900">{enquiry.appointmentAt ? new Date(enquiry.appointmentAt).toLocaleDateString() : "—"}</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-gray-500">Test Drive Date</span>
                    <span className="font-medium text-gray-900">{tdDate ? tdDate.toLocaleDateString() : "—"}</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-gray-500">Booking Date</span>
                    <span className="font-medium text-gray-900">{bookingDate ? bookingDate.toLocaleDateString() : "—"}</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-gray-500">Retail Date</span>
                    <span className="font-medium text-gray-900">{retailDate ? retailDate.toLocaleDateString() : "—"}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 mt-2 pt-3 border-t border-gray-100 bg-indigo-50/30 -mx-4 px-4 rounded-b-lg">
                    <span className="text-indigo-900 font-medium">Next Follow-up</span>
                    <span className="font-bold text-indigo-700">
                      {enquiry.followUpDueAt ? new Date(enquiry.followUpDueAt).toLocaleDateString() : "—"}
                    </span>
                  </div>
                </div>
              </Card>

              {/* ---------- ADDITIONAL HISTORY (PRESERVED) ---------- */}
              <Card className="shadow-sm">
                <CardHeader
                  icon={<MessagesSquare size={16} />}
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
                  {lead.touches.slice(0, 4).map((touch) => (
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

              {callLogs && callLogs.length > 0 && (
                <Card className="shadow-sm">
                  <CardHeader
                    icon={<PhoneCall size={16} />}
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
          </div>

          <StatusChangeModal
            enquiryId={enquiry.id}
            branchId={enquiry.branchId}
            currentStatus={enquiry.status}
            isOpen={showStatusModal}
            onClose={() => setShowStatusModal(false)}
            initialTargetStatus={statusModalTarget}
          />

          <AddLeadWizard
            isOpen={showDetailsWizard}
            onClose={() => setShowDetailsWizard(false)}
            mode="complete"
            enquiryId={enquiry.id}
            contextLabel={`${enquiry.branch.name} · ${enquiry.source.replaceAll("_", " ")}`}
            initialValues={
              {
                name: lead.name,
                phone: lead.phoneRaw,
                email: lead.email ?? undefined,
                carModel: enquiry.carModel,
                enquiryType: enquiry.enquiryType,
                location: enquiry.location ?? undefined,
                branchId: enquiry.branchId,
                alternateMobile: lead.alternateMobile ?? undefined,
                dob: toDateInput(lead.dob),
                profession: lead.profession ?? undefined,
                pincode: lead.pincode ?? undefined,
                address: lead.address ?? undefined,
                department: enquiry.department ?? undefined,
                sourceCategory: enquiry.sourceCategory ?? undefined,
                subsource: enquiry.subsource ?? undefined,
                variant: enquiry.variant ?? undefined,
                enquiryCategory: enquiry.enquiryCategory ?? undefined,
                financeRequired: enquiry.financeRequired ?? false,
                financeRemarks: enquiry.financeRemarks ?? undefined,
                appointmentScheduled: enquiry.appointmentScheduled,
                appointmentAt: toDatetimeLocalInput(enquiry.appointmentAt),
                testDriveInterested: enquiry.testDriveInterested,
                testDriveCount: enquiry.testDriveCount ?? undefined,
                exchangeCarModel: enquiry.exchangeCarModel ?? undefined,
                exchangeCarYear: enquiry.exchangeCarYear ?? undefined,
                exchangeCarKms: enquiry.exchangeCarKms ?? undefined,
                exchangeCarOwners: enquiry.exchangeCarOwners ?? undefined,
                calledDate: toDateInput(enquiry.calledDate),
                remarks: enquiry.remarks ?? undefined,
              } as Partial<AddLeadFormValues>
            }
          />
        </>
      )}
    </div>
  );
}
