import { Modal } from "../../../components/common/Modal";
import { FollowUpForm } from "../../../components/enquiry/FollowUpForm";
import { FollowUpTable } from "../../../components/enquiry/FollowUpTable";
import { UnifiedTimeline } from "../../../components/enquiry/UnifiedTimeline";
import { InfoField } from "./InfoField";
import { CopyButton } from "../../../components/common/CopyButton";
import { UserCircle2, Phone, Mail, CalendarDays, Briefcase, MapPin, Car, Tag, Building2, Radio, ClipboardEdit } from "lucide-react";

import type { LeadWithHistory, Enquiry } from "../../../types";
import type { CallLog } from "../../../api/voice.api";

interface LeadModalsProps {
  lead: LeadWithHistory;
  enquiry?: Enquiry;
  callLogs?: CallLog[];
  showCustomerView: boolean;
  setShowCustomerView: (v: boolean) => void;
  showFollowUpForm: boolean;
  setShowFollowUpForm: (v: boolean) => void;
  showFollowUpsModal: boolean;
  setShowFollowUpsModal: (v: boolean) => void;
  showTimelineModal: boolean;
  setShowTimelineModal: (v: boolean) => void;
  showContactHistoryModal: boolean;
  setShowContactHistoryModal: (v: boolean) => void;
  showCallHistoryModal: boolean;
  setShowCallHistoryModal: (v: boolean) => void;
  openFollowUp: () => void;
}

export function LeadModals({
  lead,
  enquiry,
  callLogs,
  showCustomerView,
  setShowCustomerView,
  showFollowUpForm,
  setShowFollowUpForm,
  showFollowUpsModal,
  setShowFollowUpsModal,
  showTimelineModal,
  setShowTimelineModal,
  showContactHistoryModal,
  setShowContactHistoryModal,
  showCallHistoryModal,
  setShowCallHistoryModal,
  openFollowUp,
}: LeadModalsProps) {
  return (
    <>
      {enquiry && (
        <Modal
          isOpen={showCustomerView}
          onClose={() => setShowCustomerView(false)}
          title="Customer Details"
          maxWidth="max-w-xl"
        >
          <div className="grid grid-cols-1 gap-x-6 gap-y-4 text-sm sm:grid-cols-2">
            <InfoField icon={<UserCircle2 size={13} />} label="Name" value={lead.name} />
            <InfoField
              icon={<Phone size={13} />}
              label="Mobile Number"
              value={
                <span className="inline-flex items-center gap-1.5">
                  {lead.phoneRaw}
                  <CopyButton value={lead.phoneRaw} label="Copy phone number" />
                </span>
              }
            />
            <InfoField icon={<Phone size={13} />} label="Alternate Mobile" value={lead.alternateMobile || "—"} />
            <InfoField
              icon={<Mail size={13} />}
              label="Email"
              value={
                <span className="inline-flex items-center gap-1.5">
                  {lead.email || "—"}
                  {lead.email && <CopyButton value={lead.email} label="Copy email" />}
                </span>
              }
            />
            <InfoField icon={<CalendarDays size={13} />} label="Date of Birth" value={lead.dob ? new Date(lead.dob).toLocaleDateString() : "—"} />
            <InfoField icon={<Briefcase size={13} />} label="Profession" value={lead.profession || "—"} />
            <InfoField icon={<MapPin size={13} />} label="Pincode" value={lead.pincode || "—"} />
            <InfoField icon={<MapPin size={13} />} label="Address" className="sm:col-span-2" value={lead.address || "—"} />
            <InfoField icon={<Car size={13} />} label="Interested Vehicle" value={enquiry.carModel} />
            <InfoField icon={<Car size={13} />} label="Variant" value={enquiry.variant || "—"} />
            <InfoField icon={<Tag size={13} />} label="Customer Category" value={enquiry.enquiryCategory || "—"} />
            <InfoField icon={<Tag size={13} />} label="Enquiry Type" value={enquiry.enquiryType.replaceAll("_", " ")} />
            <InfoField icon={<MapPin size={13} />} label="Location" value={enquiry.location || "—"} />
            <div className="col-span-full mt-1 grid grid-cols-1 gap-x-6 gap-y-4 border-t border-slate-100 pt-4 sm:grid-cols-2 dark:border-slate-700/60">
              <InfoField icon={<Building2 size={13} />} label="Branch" value={enquiry.branch.name} />
              <InfoField icon={<Radio size={13} />} label="Source" value={enquiry.source.replaceAll("_", " ")} />
              <InfoField icon={<UserCircle2 size={13} />} label="Sales Consultant (CR)" value={enquiry.assignedCr?.name ?? "Unassigned"} />
              <InfoField icon={<UserCircle2 size={13} />} label="Showroom Consultant" value={enquiry.consultant?.name ?? "—"} />
            </div>
            {enquiry.remarks && (
              <div className="col-span-full border-t border-slate-100 pt-4 dark:border-slate-700/60">
                <InfoField
                  icon={<ClipboardEdit size={13} />}
                  label="Remarks"
                  value={<span className="font-normal whitespace-pre-wrap">{enquiry.remarks}</span>}
                />
              </div>
            )}
          </div>
        </Modal>
      )}

      {enquiry && (
        <Modal isOpen={showFollowUpForm} onClose={() => setShowFollowUpForm(false)} title="Add Follow-up" maxWidth="max-w-2xl">
          <FollowUpForm enquiryId={enquiry.id} onSuccess={() => setShowFollowUpForm(false)} onCancel={() => setShowFollowUpForm(false)} />
        </Modal>
      )}

      {enquiry && (
        <Modal isOpen={showFollowUpsModal} onClose={() => setShowFollowUpsModal(false)} title="Follow-up History" maxWidth="max-w-4xl">
          <FollowUpTable followUps={enquiry.followUps || []} onAddClick={openFollowUp} canAdd={false} hideHeader />
        </Modal>
      )}

      {enquiry && (
        <Modal isOpen={showTimelineModal} onClose={() => setShowTimelineModal(false)} title="Activity Timeline" maxWidth="max-w-2xl">
          <UnifiedTimeline enquiryId={enquiry.id} statusHistory={enquiry.statusHistory || []} followUps={enquiry.followUps || []} />
        </Modal>
      )}

      <Modal isOpen={showContactHistoryModal} onClose={() => setShowContactHistoryModal(false)} title="Contact History" maxWidth="max-w-lg">
        <ul className="flex flex-col gap-1.5">
          {lead.touches.map((touch) => (
            <li key={touch.id} className="rounded-lg bg-slate-50 px-3 py-2 text-xs dark:bg-slate-800/60">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800 dark:text-slate-200">{touch.source.replaceAll("_", " ")}</span>
                <span className="text-slate-400 dark:text-slate-500">{new Date(touch.createdAt).toLocaleDateString()}</span>
              </div>
              {touch.note && <p className="mt-0.5 text-slate-500 dark:text-slate-400">{touch.note}</p>}
            </li>
          ))}
        </ul>
      </Modal>

      <Modal isOpen={showCallHistoryModal} onClose={() => setShowCallHistoryModal(false)} title="AI Call History" maxWidth="max-w-lg">
        <ul className="flex flex-col gap-2">
          {callLogs?.map((call) => (
            <li key={call.id} className="rounded-lg bg-slate-50 p-2.5 text-sm dark:bg-slate-800/60">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-800 dark:text-slate-200">{call.status.replaceAll("_", " ")}</span>
                <span className="text-slate-400 dark:text-slate-500">{new Date(call.createdAt).toLocaleString()}</span>
              </div>
              {call.recordingUrl && <audio controls src={call.recordingUrl} className="mt-1.5 h-8 w-full" />}
            </li>
          ))}
        </ul>
      </Modal>
    </>
  );
}
