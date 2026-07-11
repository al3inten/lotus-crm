import { useNavigate } from "react-router-dom";
import { ChevronRight, Inbox, Phone, Car, MapPin, UserCircle2 } from "lucide-react";
import clsx from "clsx";
import type { Enquiry, EnquiryCategory } from "../../types";
import { StatusBadge } from "../common/StatusBadge";
import { Avatar } from "../common/Avatar";

const CATEGORY_STYLES: Record<EnquiryCategory, string> = {
  HOT: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300",
  WARM: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
  COLD: "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300",
};

function CategoryPill({ category }: { category?: EnquiryCategory | null }) {
  if (!category) return <span className="text-xs text-slate-400 dark:text-slate-500">—</span>;
  return (
    <span className={clsx("inline-block rounded-full px-2 py-0.5 text-xs font-medium", CATEGORY_STYLES[category])}>
      {category}
    </span>
  );
}

function contactsBadge(enquiry: Enquiry) {
  const count = Math.max(enquiry.lead._count?.enquiries ?? 1, enquiry.lead._count?.touches ?? 0);
  if (count > 1) {
    return (
      <span className="inline-block rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-500/20 dark:text-amber-300">
        ×{count} contacts
      </span>
    );
  }
  return <span className="text-xs text-slate-400 dark:text-slate-500">1st</span>;
}

export function LeadTable({ enquiries }: { enquiries: Enquiry[] }) {
  const navigate = useNavigate();

  if (enquiries.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-14 text-slate-400 dark:text-slate-500">
        <Inbox size={28} />
        <p className="text-sm">No leads match these filters.</p>
      </div>
    );
  }

  const open = (leadId: string) => navigate(`/leads/${leadId}`);
  const onKey = (e: React.KeyboardEvent, leadId: string) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      open(leadId);
    }
  };

  return (
    <>
      {/* ---------- DESKTOP TABLE (md+) ---------- */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
            <tr>
              <th className="px-4 py-3">Lead Name</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Car</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Enquiry Type</th>
              <th className="px-4 py-3">Enquiries</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Assigned Rep</th>
              <th className="px-4 py-3">Branch</th>
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
                onKeyDown={(e) => onKey(e, enquiry.leadId)}
              >
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <Avatar name={enquiry.lead.name} size="sm" />
                    <span className="font-medium text-slate-900 dark:text-slate-200">{enquiry.lead.name}</span>
                  </div>
                </td>
                <td className="px-4 py-2.5 text-slate-600 dark:text-slate-300">{enquiry.lead.phoneRaw}</td>
                <td className="px-4 py-2.5 text-slate-900 dark:text-slate-200">{enquiry.carModel}</td>
                <td className="px-4 py-2.5 text-slate-600 dark:text-slate-300">{enquiry.source.replaceAll("_", " ")}</td>
                <td className="px-4 py-2.5 text-slate-600 dark:text-slate-300">{enquiry.enquiryType.replaceAll("_", " ")}</td>
                <td className="px-4 py-2.5">{contactsBadge(enquiry)}</td>
                <td className="px-4 py-2.5">
                  <CategoryPill category={enquiry.enquiryCategory} />
                </td>
                <td className="px-4 py-2.5 text-slate-600 dark:text-slate-300">{enquiry.location ?? "—"}</td>
                <td className="px-4 py-2.5">
                  <StatusBadge status={enquiry.status} />
                </td>
                <td className="px-4 py-2.5 text-slate-600 dark:text-slate-300">{enquiry.assignedCr?.name ?? "Unassigned"}</td>
                <td className="px-4 py-2.5 text-slate-600 dark:text-slate-300">{enquiry.branch.name}</td>
                <td className="px-4 py-2.5 text-slate-300 group-hover:text-blue-500 dark:text-slate-600 dark:group-hover:text-blue-400">
                  <ChevronRight size={16} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ---------- MOBILE CARDS (< md) ---------- */}
      <ul className="flex flex-col gap-3 p-3 md:hidden">
        {enquiries.map((enquiry) => (
          <li key={enquiry.id}>
            <div
              role="button"
              tabIndex={0}
              aria-label={`Open lead ${enquiry.lead.name}`}
              onClick={() => open(enquiry.leadId)}
              onKeyDown={(e) => onKey(e, enquiry.leadId)}
              className="cursor-pointer rounded-2xl border border-slate-200 bg-white p-4 transition-colors hover:border-blue-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 active:scale-[0.99] dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-blue-500/40"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar name={enquiry.lead.name} size="md" />
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-900 dark:text-white">{enquiry.lead.name}</p>
                    <p className="flex items-center gap-1 truncate text-xs text-slate-500 dark:text-slate-400">
                      <Phone size={11} /> {enquiry.lead.phoneRaw}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <StatusBadge status={enquiry.status} />
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
                <p className="flex items-center justify-end gap-1.5 text-slate-500 dark:text-slate-400">
                  {enquiry.source.replaceAll("_", " ")}
                </p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
