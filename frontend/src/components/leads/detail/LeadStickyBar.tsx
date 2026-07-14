import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Phone, MessageCircle, Zap, Pencil, UserPlus } from "lucide-react";
import { Avatar } from "../../../components/common/Avatar";
import { StatusBadge } from "../../../components/common/StatusBadge";
import { ActionButton } from "./ActionButton";
import { Select } from "../../../components/common/Input";
import { Button } from "../../../components/common/Button";
import type { LeadWithHistory, Enquiry, User } from "../../../types";

interface LeadStickyBarProps {
  lead: LeadWithHistory;
  enquiry?: Enquiry;
  phoneDigits: string;
  canReassign: boolean;
  crTeam?: User[];
  onReassign: (userId: string) => void;
  openFollowUp: () => void;
  setShowDetailsWizard: (val: boolean) => void;
}

export function LeadStickyBar({
  lead,
  enquiry,
  phoneDigits,
  canReassign,
  crTeam,
  onReassign,
  openFollowUp,
  setShowDetailsWizard,
}: LeadStickyBarProps) {
  const [assignOpen, setAssignOpen] = useState(false);
  const [reassignTo, setReassignTo] = useState("");
  const assignRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!assignOpen) return;
    const onDown = (e: MouseEvent) => {
      if (assignRef.current && !assignRef.current.contains(e.target as Node)) setAssignOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAssignOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [assignOpen]);

  return (
    <div className="sticky top-0 z-30 -mx-4 border-b border-slate-200/70 bg-white/80 px-4 py-2.5 backdrop-blur-xl md:-mx-6 md:px-6 lg:-mx-8 lg:px-8 dark:border-slate-800/70 dark:bg-slate-950/80 before:pointer-events-none before:absolute before:inset-x-0 before:bottom-full before:h-4 before:bg-white/80 before:backdrop-blur-xl md:before:h-6 lg:before:h-8 dark:before:bg-slate-950/80">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <Link
            to="/leads"
            aria-label="Back to Leads"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-blue-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-blue-400"
          >
            <ArrowLeft size={18} />
          </Link>
          <Avatar name={lead.name} size="sm" />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold leading-tight text-slate-900 dark:text-white">{lead.name}</p>
            <div className="mt-0.5 flex items-center gap-1.5">
              {enquiry ? (
                <StatusBadge status={enquiry.status} lossReason={enquiry.lossReason} />
              ) : (
                <span className="text-xs text-slate-400 dark:text-slate-500">Loading…</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <ActionButton icon={<Phone size={16} />} label="Call" href={`tel:${lead.phoneRaw}`} tone="call" disabled={!lead.phoneRaw} />
          <ActionButton
            icon={<MessageCircle size={16} />}
            label="WhatsApp"
            href={phoneDigits ? `https://wa.me/${phoneDigits}` : undefined}
            external
            tone="whatsapp"
            disabled={!phoneDigits}
          />
          <span className="mx-0.5 hidden h-6 w-px bg-slate-200 sm:block dark:bg-slate-700" />
          <ActionButton icon={<Zap size={16} />} label="Follow-up" onClick={openFollowUp} tone="primary" disabled={!enquiry || enquiry.status === "CLOSED"} />
          <ActionButton icon={<Pencil size={16} />} label="Edit" onClick={() => setShowDetailsWizard(true)} disabled={!enquiry} />
          {canReassign && (
            <div className="relative" ref={assignRef}>
              <ActionButton icon={<UserPlus size={16} />} label="Assign" onClick={() => setAssignOpen((o) => !o)} disabled={!enquiry} />
              {assignOpen && enquiry && (
                <div className="absolute right-0 top-full z-40 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-3 shadow-xl dark:border-slate-700 dark:bg-slate-900">
                  <p className="mb-2 text-xs font-semibold text-slate-500 dark:text-slate-400">Reassign to CR</p>
                  <Select value={reassignTo} onChange={(e) => setReassignTo(e.target.value)} className="w-full text-sm">
                    <option value="">Select CR…</option>
                    {crTeam?.map((cr) => (
                      <option key={cr.id} value={cr.id}>
                        {cr.name}
                      </option>
                    ))}
                  </Select>
                  <Button
                    size="sm"
                    className="mt-2 w-full"
                    disabled={!reassignTo}
                    onClick={() => {
                      onReassign(reassignTo);
                      setReassignTo("");
                      setAssignOpen(false);
                    }}
                  >
                    Assign
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
