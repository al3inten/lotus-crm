import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import clsx from "clsx";
import { Layers, Plus } from "lucide-react";

import { Card } from "../../../components/common/Card";
import { StatusBadge } from "../../../components/common/StatusBadge";
import { fadeUp } from "../../../lib/motion";
import type { Enquiry } from "../../../types";

interface LeadEnquiriesSwitcherProps {
  leadId: string;
  enquiries: Enquiry[];
  activeEnquiryId?: string;
  setShowNewEnquiry: (v: boolean) => void;
}

export function LeadEnquiriesSwitcher({
  leadId,
  enquiries,
  activeEnquiryId,
  setShowNewEnquiry,
}: LeadEnquiriesSwitcherProps) {
  const navigate = useNavigate();
  const [enquiriesExpanded, setEnquiriesExpanded] = useState(false);

  if (enquiries.length <= 1) return null;

  const COLLAPSED = 4;
  const many = enquiries.length > COLLAPSED;
  let visible = enquiries;
  if (many && !enquiriesExpanded) {
    visible = enquiries.slice(0, COLLAPSED);
    if (!visible.some((e) => e.id === activeEnquiryId)) {
      const act = enquiries.find((e) => e.id === activeEnquiryId);
      if (act) visible = [act, ...enquiries.filter((e) => e.id !== act.id).slice(0, COLLAPSED - 1)];
    }
  }

  return (
    <motion.div variants={fadeUp}>
      <Card padded={false} className="overflow-hidden">
        <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-2.5 dark:border-slate-800">
          <Layers size={15} className="text-primary-500 dark:text-primary-400" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Enquiries</h2>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600 dark:bg-slate-700/60 dark:text-slate-300">
            {enquiries.length}
          </span>
          <button
            type="button"
            onClick={() => setShowNewEnquiry(true)}
            className="ml-auto inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600 transition-colors hover:border-primary-300 hover:text-primary-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50 dark:border-slate-700 dark:text-slate-300 dark:hover:border-primary-500/40 dark:hover:text-primary-400"
          >
            <Plus size={13} /> New enquiry
          </button>
        </div>
        <div className="flex gap-2 overflow-x-auto p-2.5 [scrollbar-width:thin]">
          {visible.map((enq) => {
            const active = enq.id === activeEnquiryId;
            return (
              <button
                key={enq.id}
                type="button"
                onClick={() => navigate(`/leads/${leadId}/enquiries/${enq.id}`)}
                aria-current={active}
                className={clsx(
                  "flex min-w-[150px] max-w-[210px] flex-col gap-1 rounded-lg border p-2.5 text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500",
                  active
                    ? "border-primary-300 bg-primary-50 dark:border-primary-500/40 dark:bg-primary-500/10"
                    : "border-slate-200 bg-white hover:border-primary-200 dark:border-slate-700 dark:bg-slate-900/40 dark:hover:border-primary-500/30"
                )}
              >
                <div className="flex items-center gap-1.5">
                  {active && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary-500" />}
                  <span className="truncate text-xs font-semibold text-slate-900 dark:text-white">{enq.carModel}</span>
                </div>
                <StatusBadge status={enq.status} lossReason={enq.lossReason} />
                <span className="text-[10px] text-slate-400 dark:text-slate-500">
                  {new Date(enq.createdAt).toLocaleDateString()} · {enq.source.replaceAll("_", " ")}
                </span>
              </button>
            );
          })}
          {many && (
            <button
              type="button"
              onClick={() => setEnquiriesExpanded((v) => !v)}
              className="flex min-w-[64px] shrink-0 flex-col items-center justify-center gap-0.5 rounded-lg border border-dashed border-slate-300 px-3 text-xs font-semibold text-slate-500 transition-colors hover:border-primary-300 hover:text-primary-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50 dark:border-slate-700 dark:text-slate-400 dark:hover:border-primary-500/40 dark:hover:text-primary-400"
            >
              {enquiriesExpanded ? "Show less" : `+${enquiries.length - COLLAPSED}`}
              <span className="text-[9px] font-medium uppercase tracking-wide">{enquiriesExpanded ? "" : "more"}</span>
            </button>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
