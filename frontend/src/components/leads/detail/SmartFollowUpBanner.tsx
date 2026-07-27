import { motion } from "framer-motion";
import { Zap, ArrowRightLeft, CalendarPlus } from "lucide-react";
import { QuickActions } from "../../../components/enquiry/QuickActions";
import { fadeUp } from "../../../lib/motion";
import type { Enquiry, EnquiryStatus } from "../../../types";

interface SmartFollowUpBannerProps {
  enquiry: Enquiry;
  followUpUrgency: "overdue" | "today" | "future" | null;
  openFollowUp: () => void;
  handleQuickActionStatus: (status?: EnquiryStatus) => void;
}

export function SmartFollowUpBanner({ enquiry, followUpUrgency, openFollowUp, handleQuickActionStatus }: SmartFollowUpBannerProps) {
  if (enquiry.status === "CLOSED") return null;

  return (
    <motion.div
      variants={fadeUp}
      className="flex flex-col gap-4 rounded-2xl border border-primary-100 bg-primary-50/60 p-5 lg:flex-row lg:items-center lg:justify-between dark:border-primary-500/20 dark:bg-primary-500/10"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-600/10 text-primary-600 dark:bg-primary-500/20 dark:text-primary-300">
          <Zap size={18} />
        </span>
        <div>
          <h3 className="text-sm font-bold text-primary-900 dark:text-primary-200">Smart next step</h3>
          <p className="mt-0.5 text-xs text-primary-700/80 dark:text-primary-300/70">
            {followUpUrgency === "overdue"
              ? "Follow-up is overdue — reconnect with this lead now."
              : followUpUrgency === "today"
                ? "A follow-up is due today. Keep the conversation moving."
                : enquiry.followUpDueAt
                  ? `Next follow-up on ${new Date(enquiry.followUpDueAt).toLocaleDateString()}.`
                  : "No follow-up scheduled yet — add one to keep momentum."}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <QuickActions status={enquiry.status} onChangeStatus={handleQuickActionStatus} />
        <button
          type="button"
          onClick={openFollowUp}
          className="inline-flex items-center gap-1.5 rounded-lg border border-primary-200 bg-white/70 px-3 py-1.5 text-sm font-semibold text-primary-700 transition-colors hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50 dark:border-primary-500/30 dark:bg-primary-500/10 dark:text-primary-300 dark:hover:bg-primary-500/20"
        >
          <CalendarPlus size={14} />
          Add follow-up
        </button>
        <button
          type="button"
          onClick={() => handleQuickActionStatus(undefined)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-primary-200 bg-white/70 px-3 py-1.5 text-sm font-semibold text-primary-700 transition-colors hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50 dark:border-primary-500/30 dark:bg-primary-500/10 dark:text-primary-300 dark:hover:bg-primary-500/20"
        >
          <ArrowRightLeft size={14} />
          Change status
        </button>
      </div>
    </motion.div>
  );
}
