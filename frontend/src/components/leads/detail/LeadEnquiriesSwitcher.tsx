import { motion } from "framer-motion";
import clsx from "clsx";
import { Layers, Plus } from "lucide-react";
import { Card } from "../../../components/common/Card";
import { StatusBadge } from "../../../components/common/StatusBadge";
import { fadeUp } from "../../../lib/motion";
import type { LeadWithHistory } from "../../../types";
import { useNavigate, useParams } from "react-router-dom";

interface LeadEnquiriesSwitcherProps {
  lead: LeadWithHistory;
  activeEnquiryId?: string;
  setShowNewEnquiry: (val: boolean) => void;
}

export function LeadEnquiriesSwitcher({ lead, activeEnquiryId, setShowNewEnquiry }: LeadEnquiriesSwitcherProps) {
  const navigate = useNavigate();
  const { leadId } = useParams<{ leadId: string }>();
  
  if (lead.enquiries.length <= 1) return null;

  return (
    <motion.div variants={fadeUp}>
      <Card padded={false} className="overflow-hidden">
        <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3 dark:border-slate-800">
          <Layers size={16} className="text-blue-500 dark:text-blue-400" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Enquiries</h2>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600 dark:bg-slate-700/60 dark:text-slate-300">
            {lead.enquiries.length}
          </span>
          <button
            type="button"
            onClick={() => setShowNewEnquiry(true)}
            className="ml-auto inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600 transition-colors hover:border-blue-300 hover:text-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 dark:border-slate-700 dark:text-slate-300 dark:hover:border-blue-500/40 dark:hover:text-blue-400"
          >
            <Plus size={13} /> New enquiry
          </button>
        </div>
        <div className="flex gap-2 overflow-x-auto p-3 [scrollbar-width:thin]">
          {lead.enquiries.map((enq) => {
            const active = enq.id === activeEnquiryId;
            return (
              <button
                key={enq.id}
                type="button"
                onClick={() => navigate(`/leads/${leadId}/enquiries/${enq.id}`)}
                aria-current={active}
                className={clsx(
                  "flex min-w-[190px] flex-col gap-1.5 rounded-xl border p-3 text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                  active
                    ? "border-blue-300 bg-blue-50 dark:border-blue-500/40 dark:bg-blue-500/10"
                    : "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-blue-200 dark:border-slate-700 dark:bg-slate-900/40 dark:hover:border-blue-500/30"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-semibold text-slate-900 dark:text-white">{enq.carModel}</span>
                  {active && <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-blue-600 dark:text-blue-400">Viewing</span>}
                </div>
                <StatusBadge status={enq.status} />
                <span className="text-xs text-slate-400 dark:text-slate-500">
                  {new Date(enq.createdAt).toLocaleDateString()} · {enq.source.replaceAll("_", " ")}
                </span>
              </button>
            );
          })}
        </div>
      </Card>
    </motion.div>
  );
}
