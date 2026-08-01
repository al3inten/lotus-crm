import { useState, type ReactNode } from "react";
import { CallHistoryModal } from "./CallHistoryModal";

/**
 * Wraps a lead's phone number so clicking it opens the call recordings/transcripts/notes
 * modal (CallHistoryModal) instead of (or in addition to) a tel: link. Self-contained —
 * owns its own modal open state, so it can drop into the detail page, the leads table, or
 * cards without any state lifting.
 */
export function ClickablePhone({
  phone,
  leadId,
  enquiryId,
  children,
  className,
}: {
  phone: string;
  leadId: string;
  enquiryId?: string;
  children: ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        title="View call recordings, transcripts & notes"
        className={className ?? "underline decoration-dotted underline-offset-2 hover:text-primary-600 dark:hover:text-primary-400"}
      >
        {children}
      </button>
      {open && (
        <CallHistoryModal isOpen={open} onClose={() => setOpen(false)} leadId={leadId} enquiryId={enquiryId} phone={phone} />
      )}
    </>
  );
}
