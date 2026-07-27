import { memo } from "react";
import { Link } from "react-router-dom";
import { UserPlus } from "lucide-react";
import type { useLeads } from "../../hooks/useLeads";
import { Avatar } from "../common/Avatar";
import { StatusBadge } from "../common/StatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { timeAgo } from "./DashboardPrimitives";

/* ── Pipeline rows (shared between both role views) ─────────────────────── */

function PipelineRowsImpl({ data }: { data: ReturnType<typeof useLeads>["data"] }) {
  if (!data) {
    return (
      <>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-5 py-3.5">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-1/3" />
              <Skeleton className="h-3 w-1/4" />
            </div>
          </div>
        ))}
      </>
    );
  }
  if (data.items.length === 0) {
    return (
      <div className="px-5 py-12 text-center">
        <p className="text-[13px] font-medium text-slate-900 dark:text-slate-200">No leads yet</p>
        <p className="mt-1 text-[12px] text-slate-500 dark:text-slate-400">
          Add your first lead to start tracking the pipeline.
        </p>
        <Link
          to="/leads"
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-[12px] font-medium text-white transition-colors hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
        >
          <UserPlus size={13} /> New lead
        </Link>
      </div>
    );
  }
  return (
    <>
      {data.items.slice(0, 5).map((enquiry) => (
        <Link
          key={enquiry.id}
          to={`/leads/${enquiry.leadId}`}
          className="group grid grid-cols-[auto_1fr_auto_auto] items-center gap-3 px-5 py-3.5 transition-colors hover:bg-slate-50/60 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary-500 dark:hover:bg-white/[0.02]"
        >
          <Avatar name={enquiry.lead.name} size="sm" />
          <div className="min-w-0">
            <p className="truncate text-[13px] font-medium text-slate-900 dark:text-slate-200">
              {enquiry.lead.name}
            </p>
            <p className="truncate text-[12px] text-slate-500 dark:text-slate-400">
              {enquiry.carModel} · {enquiry.branch.name}
            </p>
          </div>
          <StatusBadge status={enquiry.status} />
          <span className="hidden w-12 text-right text-[12px] tabular-nums text-slate-400 dark:text-slate-500 sm:block">
            {timeAgo(enquiry.createdAt)}
          </span>
        </Link>
      ))}
    </>
  );
}

export const PipelineRows = memo(PipelineRowsImpl);
