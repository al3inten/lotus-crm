import { useState } from "react";
import { ClipboardEdit, Plus, Building2, Radio, CalendarDays, Tag, UserCircle2, Check, X } from "lucide-react";
import { Card, CardHeader } from "../../../components/common/Card";
import { InfoField } from "./InfoField";
import { Select } from "../../../components/common/Input";
import type { Enquiry, User } from "../../../types";

interface EnquirySummaryCardProps {
  enquiry: Enquiry;
  canReassign: boolean;
  consultants?: User[];
  isUpdatingConsultant: boolean;
  onUpdateConsultant: (id: string) => void;
  setShowNewEnquiry: (val: boolean) => void;
}

export function EnquirySummaryCard({ enquiry, canReassign, consultants, isUpdatingConsultant, onUpdateConsultant, setShowNewEnquiry }: EnquirySummaryCardProps) {
  const [consultantEdit, setConsultantEdit] = useState(false);
  const [consultantValue, setConsultantValue] = useState("");

  return (
    <Card className="flex h-full flex-col">
      <CardHeader
        icon={<ClipboardEdit size={18} />}
        iconClassName="bg-violet-50 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400"
        title="Enquiry Summary"
        subtitle="Deal snapshot"
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowNewEnquiry(true)}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600 transition-colors hover:border-primary-300 hover:text-primary-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50 dark:border-slate-700 dark:text-slate-300 dark:hover:border-primary-500/40 dark:hover:text-primary-400"
            >
              <Plus size={13} /> New enquiry
            </button>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-slate-700/60 dark:text-slate-300">
              #{enquiry.id.slice(-6).toUpperCase()}
            </span>
          </div>
        }
      />
      <div className="grid grid-cols-1 gap-x-6 gap-y-4 text-sm sm:grid-cols-2">
        <InfoField icon={<Building2 size={13} />} label="Branch" value={enquiry.branch.name} />
        <InfoField icon={<Radio size={13} />} label="Source" value={enquiry.source.replaceAll("_", " ")} />
        <InfoField icon={<CalendarDays size={13} />} label="Enquiry Date" value={new Date(enquiry.createdAt).toLocaleDateString()} />
        <InfoField icon={<Tag size={13} />} label="Current Stage" value={enquiry.status.replaceAll("_", " ")} />
        <div className="mt-1 grid grid-cols-1 gap-x-6 gap-y-4 border-t border-slate-100 pt-4 sm:col-span-2 sm:grid-cols-2 dark:border-slate-700/60">
          <InfoField icon={<UserCircle2 size={13} />} label="Sales Consultant (CR)" value={enquiry.assignedCr?.name ?? "Unassigned"} />
          <div>
            <p className="mb-1 flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
              <UserCircle2 size={13} /> Showroom Consultant
            </p>
            {consultantEdit ? (
              <div className="flex items-center gap-1.5">
                <Select value={consultantValue} onChange={(e) => setConsultantValue(e.target.value)} className="w-full text-sm">
                  <option value="">Select consultant…</option>
                  {consultants?.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
                <button
                  type="button"
                  aria-label="Save consultant"
                  disabled={!consultantValue || isUpdatingConsultant}
                  onClick={() => {
                    onUpdateConsultant(consultantValue);
                    setConsultantEdit(false);
                  }}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-600 text-white transition-colors hover:bg-primary-500 disabled:opacity-40"
                >
                  <Check size={15} />
                </button>
                <button
                  type="button"
                  aria-label="Cancel"
                  onClick={() => setConsultantEdit(false)}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                >
                  <X size={15} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{enquiry.consultant?.name ?? "—"}</p>
                {canReassign && (
                  <button
                    type="button"
                    onClick={() => {
                      setConsultantValue(enquiry.consultantId ?? "");
                      setConsultantEdit(true);
                    }}
                    className="text-xs font-semibold text-primary-600 transition-colors hover:underline dark:text-primary-400"
                  >
                    Change
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
