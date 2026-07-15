import { Inbox, Plus } from "lucide-react";
import type { Enquiry } from "../../types";
import { LeadCard } from "./LeadCard";
import { Button } from "../common/Button";
import { useLeadOpener } from "./leadPresentation";

export function LeadCardGrid({ enquiries, onAddLead }: { enquiries: Enquiry[]; onAddLead?: () => void }) {
  const open = useLeadOpener(enquiries);

  if (enquiries.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-14 text-slate-400 dark:text-slate-500">
        <Inbox size={28} />
        <p className="text-sm">No leads match these filters.</p>
        {onAddLead && (
          <Button size="sm" icon={<Plus size={14} />} onClick={onAddLead}>
            Add Lead
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
      {enquiries.map((enquiry) => (
        <LeadCard key={enquiry.id} enquiry={enquiry} onOpen={open} />
      ))}
    </div>
  );
}
