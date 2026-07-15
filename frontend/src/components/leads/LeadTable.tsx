import { ChevronRight, Inbox, Plus } from "lucide-react";
import clsx from "clsx";
import type { Enquiry } from "../../types";
import { StatusBadge } from "../common/StatusBadge";
import { Button } from "../common/Button";
import { LeadCard } from "./LeadCard";
import { AvatarWithTemperature, CategoryPill, contactsBadge, onOpenKeyDown, useLeadOpener } from "./leadPresentation";

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
          horizontal scrollbar — the core columns (name/contact/car/category/status) always fit. */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
            <tr>
              <th className="px-4 py-3">Lead Name</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Car</th>
              <th className="hidden px-4 py-3 xl:table-cell">Source</th>
              <th className="hidden px-4 py-3 xl:table-cell">Enquiry Type</th>
              <th className="hidden px-4 py-3 lg:table-cell">Enquiries</th>
              <th className="px-4 py-3">Category</th>
              <th className="hidden px-4 py-3 lg:table-cell">Location</th>
              <th className="px-4 py-3">Status</th>
              <th className="hidden px-4 py-3 lg:table-cell">Assigned Rep</th>
              <th className="hidden px-4 py-3 xl:table-cell">Branch</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {enquiries.map((enquiry, index) => (
              <tr
                key={enquiry.id}
                role="button"
                tabIndex={0}
                aria-label={`Open lead ${enquiry.lead.name}`}
                className={clsx(
                  "group cursor-pointer transition-colors hover:bg-blue-50/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 dark:hover:bg-blue-500/10",
                  index % 2 === 1 && "bg-slate-50/40 dark:bg-slate-800/30"
                )}
                onClick={() => open(enquiry.leadId)}
                onKeyDown={(e) => onOpenKeyDown(e, enquiry.leadId, open)}
              >
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <AvatarWithTemperature name={enquiry.lead.name} category={enquiry.enquiryCategory} size="sm" />
                    <span className="font-medium text-slate-900 dark:text-slate-200">{enquiry.lead.name}</span>
                  </div>
                </td>
                <td className="px-4 py-2.5 text-slate-600 dark:text-slate-300">{enquiry.lead.phoneRaw}</td>
                <td className="px-4 py-2.5 text-slate-900 dark:text-slate-200">{enquiry.carModel}</td>
                <td className="hidden px-4 py-2.5 text-slate-600 xl:table-cell dark:text-slate-300">{enquiry.source.replaceAll("_", " ")}</td>
                <td className="hidden px-4 py-2.5 text-slate-600 xl:table-cell dark:text-slate-300">{enquiry.enquiryType.replaceAll("_", " ")}</td>
                <td className="hidden px-4 py-2.5 lg:table-cell">{contactsBadge(enquiry)}</td>
                <td className="px-4 py-2.5">
                  <CategoryPill category={enquiry.enquiryCategory} />
                </td>
                <td className="hidden px-4 py-2.5 text-slate-600 lg:table-cell dark:text-slate-300">{enquiry.location ?? "—"}</td>
                <td className="px-4 py-2.5">
                  <StatusBadge status={enquiry.status} lossReason={enquiry.lossReason} />
                </td>
                <td className="hidden px-4 py-2.5 text-slate-600 lg:table-cell dark:text-slate-300">{enquiry.assignedCr?.name ?? "Unassigned"}</td>
                <td className="hidden px-4 py-2.5 text-slate-600 xl:table-cell dark:text-slate-300">{enquiry.branch.name}</td>
                <td className="px-4 py-2.5 text-slate-300 group-hover:text-blue-500 dark:text-slate-600 dark:group-hover:text-blue-400">
                  <ChevronRight size={16} />
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
