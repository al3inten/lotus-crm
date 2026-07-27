import { ChevronRight, Clock, Inbox, Phone, Plus } from "lucide-react";
import clsx from "clsx";
import type { Enquiry } from "../../types";
import { StatusBadge } from "../common/StatusBadge";
import { Button } from "../common/Button";
import { LeadCard } from "./LeadCard";
import {
  AvatarWithTemperature,
  CategoryPill,
  contactsBadge,
  getFollowUpUrgency,
  onOpenKeyDown,
  useLeadOpener,
} from "./leadPresentation";

const URGENCY_STYLES: Record<"overdue" | "today" | "future", string> = {
  overdue: "bg-primary-600 text-white dark:bg-primary-500 dark:text-white",
  today: "bg-primary-100 text-primary-700 dark:bg-primary-500/20 dark:text-primary-300",
  future: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
};

/** Small "follow-up due" chip under the status badge — silent unless a date is set. */
function FollowUpChip({ enquiry }: { enquiry: Enquiry }) {
  const urgency = getFollowUpUrgency(enquiry.followUpDueAt);
  if (!urgency || !enquiry.followUpDueAt) return null;
  const label =
    urgency === "overdue"
      ? "Overdue"
      : urgency === "today"
        ? "Due today"
        : new Date(enquiry.followUpDueAt).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  return (
    <span className={clsx("mt-1 flex w-fit items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold", URGENCY_STYLES[urgency])}>
      <Clock size={10} />
      {label}
    </span>
  );
}

export function LeadTable({ enquiries, onAddLead }: { enquiries: Enquiry[]; onAddLead?: () => void }) {
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
    <>
      {/* ---------- DESKTOP TABLE (md+) ---------- */}
      {/* Lower-priority columns hide progressively by breakpoint instead of forcing a
          horizontal scrollbar — the core columns (name/contact/car/category/status) always fit.
          Rows use border-separate + spacing so each one reads as its own soft "card" that
          lifts on hover, rather than a flat spreadsheet grid. */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full border-separate border-spacing-0 text-sm">
          <thead className="sticky top-0 z-10 bg-white/95 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400 backdrop-blur-sm dark:bg-slate-900/95 dark:text-slate-500">
            <tr>
              <th className="border-b border-slate-100 px-4 py-3.5 dark:border-slate-800">Lead Name</th>
              <th className="border-b border-slate-100 px-4 py-3.5 dark:border-slate-800">Contact</th>
              <th className="border-b border-slate-100 px-4 py-3.5 dark:border-slate-800">Car</th>
              <th className="hidden border-b border-slate-100 px-4 py-3.5 xl:table-cell dark:border-slate-800">Source</th>
              <th className="hidden border-b border-slate-100 px-4 py-3.5 xl:table-cell dark:border-slate-800">Enquiry Type</th>
              <th className="hidden border-b border-slate-100 px-4 py-3.5 lg:table-cell dark:border-slate-800">Enquiries</th>
              <th className="border-b border-slate-100 px-4 py-3.5 dark:border-slate-800">Category</th>
              <th className="hidden border-b border-slate-100 px-4 py-3.5 lg:table-cell dark:border-slate-800">Location</th>
              <th className="hidden border-b border-slate-100 px-4 py-3.5 xl:table-cell dark:border-slate-800">Created</th>
              <th className="border-b border-slate-100 px-4 py-3.5 dark:border-slate-800">Status</th>
              <th className="hidden border-b border-slate-100 px-4 py-3.5 lg:table-cell dark:border-slate-800">Assigned Rep</th>
              <th className="hidden border-b border-slate-100 px-4 py-3.5 xl:table-cell dark:border-slate-800">Branch</th>
              <th className="border-b border-slate-100 px-4 py-3.5 dark:border-slate-800" />
            </tr>
          </thead>
          <tbody>
            {enquiries.map((enquiry) => (
              <tr
                key={enquiry.id}
                role="button"
                tabIndex={0}
                aria-label={`Open lead ${enquiry.lead.name}`}
                className="group cursor-pointer align-middle focus:outline-none"
                onClick={() => open(enquiry.leadId)}
                onKeyDown={(e) => onOpenKeyDown(e, enquiry.leadId, open)}
              >
                <td className="border-b border-slate-100 px-4 py-3 transition-colors group-hover:bg-primary-50/60 group-focus-visible:bg-primary-50/60 dark:border-slate-800/80 dark:group-hover:bg-primary-500/[0.06]">
                  <div className="flex items-center gap-2.5">
                    <AvatarWithTemperature name={enquiry.lead.name} category={enquiry.enquiryCategory} size="sm" />
                    <span className="font-medium text-slate-900 dark:text-slate-200">{enquiry.lead.name}</span>
                  </div>
                </td>
                <td className="border-b border-slate-100 px-4 py-3 text-slate-600 transition-colors group-hover:bg-primary-50/60 dark:border-slate-800/80 dark:text-slate-300 dark:group-hover:bg-primary-500/[0.06]">
                  <span className="flex items-center gap-1.5">
                    <Phone size={12} className="shrink-0 text-slate-400 dark:text-slate-500" />
                    {enquiry.lead.phoneRaw}
                  </span>
                </td>
                <td className="border-b border-slate-100 px-4 py-3 text-slate-900 transition-colors group-hover:bg-primary-50/60 dark:border-slate-800/80 dark:text-slate-200 dark:group-hover:bg-primary-500/[0.06]">
                  <p className="truncate font-medium">{enquiry.carModel}</p>
                  {enquiry.variant && <p className="truncate text-xs font-normal text-slate-400 dark:text-slate-500">{enquiry.variant}</p>}
                </td>
                <td className="hidden border-b border-slate-100 px-4 py-3 text-slate-600 transition-colors group-hover:bg-primary-50/60 xl:table-cell dark:border-slate-800/80 dark:text-slate-300 dark:group-hover:bg-primary-500/[0.06]">
                  {enquiry.source.replaceAll("_", " ")}
                </td>
                <td className="hidden border-b border-slate-100 px-4 py-3 text-slate-600 transition-colors group-hover:bg-primary-50/60 xl:table-cell dark:border-slate-800/80 dark:text-slate-300 dark:group-hover:bg-primary-500/[0.06]">
                  {enquiry.enquiryType.replaceAll("_", " ")}
                </td>
                <td className="hidden border-b border-slate-100 px-4 py-3 transition-colors group-hover:bg-primary-50/60 lg:table-cell dark:border-slate-800/80 dark:group-hover:bg-primary-500/[0.06]">
                  {contactsBadge(enquiry)}
                </td>
                <td className="border-b border-slate-100 px-4 py-3 transition-colors group-hover:bg-primary-50/60 dark:border-slate-800/80 dark:group-hover:bg-primary-500/[0.06]">
                  <CategoryPill category={enquiry.enquiryCategory} />
                </td>
                <td className="hidden border-b border-slate-100 px-4 py-3 text-slate-600 transition-colors group-hover:bg-primary-50/60 lg:table-cell dark:border-slate-800/80 dark:text-slate-300 dark:group-hover:bg-primary-500/[0.06]">
                  {enquiry.location ?? "—"}
                </td>
                <td className="hidden border-b border-slate-100 px-4 py-3 text-slate-600 transition-colors group-hover:bg-primary-50/60 xl:table-cell dark:border-slate-800/80 dark:text-slate-300 dark:group-hover:bg-primary-500/[0.06]">
                  {new Date(enquiry.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                </td>
                <td className="border-b border-slate-100 px-4 py-3 transition-colors group-hover:bg-primary-50/60 dark:border-slate-800/80 dark:group-hover:bg-primary-500/[0.06]">
                  <div className="flex flex-col items-start">
                    <StatusBadge status={enquiry.status} lossReason={enquiry.lossReason} />
                    <FollowUpChip enquiry={enquiry} />
                  </div>
                </td>
                <td className="hidden border-b border-slate-100 px-4 py-3 text-slate-600 transition-colors group-hover:bg-primary-50/60 lg:table-cell dark:border-slate-800/80 dark:text-slate-300 dark:group-hover:bg-primary-500/[0.06]">
                  {enquiry.assignedCr?.name ?? <span className="text-slate-400 dark:text-slate-500">Unassigned</span>}
                </td>
                <td className="hidden border-b border-slate-100 px-4 py-3 text-slate-600 transition-colors group-hover:bg-primary-50/60 xl:table-cell dark:border-slate-800/80 dark:text-slate-300 dark:group-hover:bg-primary-500/[0.06]">
                  {enquiry.branch.name}
                </td>
                <td className="border-b border-slate-100 px-4 py-3 transition-colors group-hover:bg-primary-50/60 dark:border-slate-800/80 dark:group-hover:bg-primary-500/[0.06]">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full text-slate-300 transition-all group-hover:translate-x-0.5 group-hover:bg-primary-100 group-hover:text-primary-600 dark:text-slate-600 dark:group-hover:bg-primary-500/15 dark:group-hover:text-primary-400">
                    <ChevronRight size={16} />
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ---------- MOBILE CARDS (< md) ---------- */}
      {/* A 12-column table doesn't work on a phone regardless of the view the user picked,
          so this reuses the same LeadCard the explicit card-grid view renders. */}
      <ul className="flex flex-col gap-3 p-3 md:hidden">
        {enquiries.map((enquiry) => (
          <li key={enquiry.id}>
            <LeadCard enquiry={enquiry} onOpen={open} />
          </li>
        ))}
      </ul>
    </>
  );
}
