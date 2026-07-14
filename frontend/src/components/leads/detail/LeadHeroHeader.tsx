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
      className="relative overflow-hidden rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 shadow-2xl shadow-blue-900/10 ring-1 ring-white/10 dark:ring-white/5"
    >
      {/* Premium Background Image with Overlay */}
      <img
        src="/premium-lead-bg.png"
        alt=""
        className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-90"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-slate-900/90 backdrop-blur-[4px] dark:from-slate-950/95 dark:via-slate-950/80 dark:to-slate-950/95" />

      <div className="relative z-10 flex min-w-0 items-center gap-4 sm:gap-5">
        <div className="rounded-full ring-4 ring-white/10 shadow-xl shadow-black/50">
          <Avatar name={lead.name} size="lg" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-300/90 mb-1">Lead Details</p>
          <h1 className="truncate text-2xl sm:text-3xl font-bold text-white tracking-tight drop-shadow-md">{lead.name}</h1>
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            {enquiry && <StatusBadge status={enquiry.status} lossReason={enquiry.lossReason} />}
            {enquiry && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-medium text-blue-100 backdrop-blur-md ring-1 ring-white/20 shadow-sm">
                <Hash size={12} className="opacity-70" />
                {enquiry.id.slice(-6).toUpperCase()}
              </span>
            )}
            {enquiry && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-medium text-emerald-100 backdrop-blur-md ring-1 ring-white/20 shadow-sm">
                <Radio size={12} className="opacity-70" />
                {enquiry.source.replaceAll("_", " ")}
              </span>
            )}
            {enquiry && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-medium text-purple-100 backdrop-blur-md ring-1 ring-white/20 shadow-sm">
                <Building2 size={12} className="opacity-70" />
                {enquiry.branch.name}
              </span>
            )}
          </div>
        </div>
      </div>

      {completeDetailsNeeded && (
        <div className="relative z-10 flex flex-col gap-3 rounded-2xl border border-amber-400/30 bg-amber-500/10 p-4 sm:flex-row sm:items-center sm:justify-between w-full sm:w-auto backdrop-blur-md shadow-lg shadow-amber-900/20">
          <p className="flex items-center gap-2 text-sm font-medium text-amber-200">
            <ClipboardEdit size={16} />
            Details missing
          </p>
          <Button size="sm" icon={<ClipboardEdit size={14} />} onClick={() => setShowDetailsWizard(true)} className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-50 border-amber-500/30">
            Complete
          </Button>
        </div>
      )}
    </motion.div>
  );
}
