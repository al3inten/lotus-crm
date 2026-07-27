import { Phone, Car, MapPin, UserCircle2 } from "lucide-react";
import clsx from "clsx";
import type { Enquiry } from "../../types";
import { StatusBadge } from "../common/StatusBadge";
import { AvatarWithTemperature, CategoryPill, CATEGORY_ACCENT, onOpenKeyDown } from "./leadPresentation";

/**
 * One enquiry as a card — used both as the card-grid view and as the automatic
 * mobile fallback inside the table view (a bare <table> doesn't work on a phone
 * regardless of which view the user picked).
 */
export function LeadCard({ enquiry, onOpen }: { enquiry: Enquiry; onOpen: (leadId: string) => void }) {
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Open lead ${enquiry.lead.name}`}
      onClick={() => onOpen(enquiry.leadId)}
      onKeyDown={(e) => onOpenKeyDown(e, enquiry.leadId, onOpen)}
      className={clsx(
        "flex h-full cursor-pointer flex-col rounded-2xl border-y border-r border-l-4 border-slate-200 bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-md hover:shadow-slate-900/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 active:scale-[0.99] dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-primary-500/40",
        enquiry.enquiryCategory && CATEGORY_ACCENT[enquiry.enquiryCategory]
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <AvatarWithTemperature name={enquiry.lead.name} category={enquiry.enquiryCategory} size="md" />
          <div className="min-w-0">
            <p className="truncate font-semibold text-slate-900 dark:text-white">{enquiry.lead.name}</p>
            <p className="flex items-center gap-1 truncate text-xs text-slate-500 dark:text-slate-400">
              <Phone size={11} /> {enquiry.lead.phoneRaw}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <StatusBadge status={enquiry.status} lossReason={enquiry.lossReason} />
          <CategoryPill category={enquiry.enquiryCategory} />
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3 text-xs dark:border-slate-800">
        <p className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
          <Car size={13} className="shrink-0 text-slate-400" />
          <span className="truncate">{enquiry.carModel}</span>
        </p>
        <p className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
          <MapPin size={13} className="shrink-0 text-slate-400" />
          <span className="truncate">{enquiry.location ?? "—"}</span>
        </p>
        <p className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
          <UserCircle2 size={13} className="shrink-0 text-slate-400" />
          <span className="truncate">{enquiry.assignedCr?.name ?? "Unassigned"}</span>
        </p>
        <p className="flex items-center justify-end gap-1.5 truncate text-slate-500 dark:text-slate-400">
          {enquiry.source.replaceAll("_", " ")}
        </p>
      </div>
    </div>
  );
}
