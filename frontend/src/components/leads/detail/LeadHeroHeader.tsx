import { motion } from "framer-motion";
import { Avatar } from "../../../components/common/Avatar";
import { StatusBadge } from "../../../components/common/StatusBadge";
import { Button } from "../../../components/common/Button";
import { ClipboardEdit, Hash, Radio, Building2 } from "lucide-react";
import { fadeUp } from "../../../lib/motion";
import type { LeadWithHistory, Enquiry } from "../../../types";

interface LeadHeroHeaderProps {
  lead: LeadWithHistory;
  enquiry?: Enquiry;
  completeDetailsNeeded: boolean;
  setShowDetailsWizard: (val: boolean) => void;
}

export function LeadHeroHeader({ lead, enquiry, completeDetailsNeeded, setShowDetailsWizard }: LeadHeroHeaderProps) {
  return (
    <motion.div
      variants={fadeUp}
      className="glass-panel relative overflow-hidden rounded-2xl p-4 sm:p-5 sm:flex sm:items-center sm:justify-between gap-4 dark:shadow-md"
    >
      <div className="pointer-events-none absolute -right-16 -top-24 h-56 w-56 rounded-full bg-blue-500/10 blur-[70px] dark:bg-blue-500/20" />
      <div className="pointer-events-none absolute -bottom-24 -left-16 h-48 w-48 rounded-full bg-indigo-500/5 blur-[70px] dark:bg-indigo-500/10" />

      <div className="relative z-10 flex min-w-0 items-center gap-3.5">
        <Avatar name={lead.name} size="md" />
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600/80 dark:text-blue-400/80">Lead Details</p>
          <h1 className="truncate text-xl font-bold text-slate-900 dark:text-white">{lead.name}</h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {enquiry && <StatusBadge status={enquiry.status} />}
            {enquiry && (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-700/60 dark:text-slate-300">
                <Hash size={10} />
                {enquiry.id.slice(-6).toUpperCase()}
              </span>
            )}
            {enquiry && (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-700/60 dark:text-slate-300">
                <Radio size={10} />
                {enquiry.source.replaceAll("_", " ")}
              </span>
            )}
            {enquiry && (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-700/60 dark:text-slate-300">
                <Building2 size={10} />
                {enquiry.branch.name}
              </span>
            )}
          </div>
        </div>
      </div>

      {completeDetailsNeeded && (
        <div className="relative z-10 flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-amber-500/20 dark:bg-amber-500/10 w-full sm:w-auto">
          <p className="flex items-center gap-2 text-sm font-medium text-amber-800 dark:text-amber-300">
            <ClipboardEdit size={16} />
            Details missing
          </p>
          <Button size="sm" icon={<ClipboardEdit size={14} />} onClick={() => setShowDetailsWizard(true)}>
            Complete
          </Button>
        </div>
      )}
    </motion.div>
  );
}
