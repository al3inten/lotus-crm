import { useNavigate } from "react-router-dom";
import { ChevronRight, Inbox } from "lucide-react";
import type { Enquiry } from "../../types";
import { StatusBadge } from "../common/StatusBadge";
import { Avatar } from "../common/Avatar";

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

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
          <tr>
            <th className="px-4 py-3">Lead Name</th>
            <th className="px-4 py-3">Contact</th>
            <th className="px-4 py-3">Car</th>
            <th className="px-4 py-3">Source</th>
            <th className="px-4 py-3">Enquiry Type</th>
            <th className="px-4 py-3">Enquiries</th>
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
              className={`group cursor-pointer transition-colors hover:bg-indigo-50/60 dark:hover:bg-indigo-500/10 ${
                index % 2 === 1 ? "bg-slate-50/40 dark:bg-slate-800/30" : ""
              }`}
              onClick={() => navigate(`/leads/${enquiry.leadId}`)}
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
              <td className="px-4 py-2.5">
                {(enquiry.lead._count?.enquiries ?? 1) > 1 || (enquiry.lead._count?.touches ?? 0) > 1 ? (
                  <span className="inline-block rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-500/20 dark:text-amber-300">
                    ×{Math.max(enquiry.lead._count?.enquiries ?? 1, enquiry.lead._count?.touches ?? 0)} contacts
                  </span>
                ) : (
                  <span className="text-xs text-slate-400 dark:text-slate-500">1st</span>
                )}
              </td>
              <td className="px-4 py-2.5 text-slate-600 dark:text-slate-300">{enquiry.location ?? "—"}</td>
              <td className="px-4 py-2.5">
                <StatusBadge status={enquiry.status} />
              </td>
              <td className="px-4 py-2.5 text-slate-600 dark:text-slate-300">{enquiry.assignedCr?.name ?? "Unassigned"}</td>
              <td className="px-4 py-2.5 text-slate-600 dark:text-slate-300">{enquiry.branch.name}</td>
              <td className="px-4 py-2.5 text-slate-300 group-hover:text-indigo-500 dark:text-slate-600 dark:group-hover:text-indigo-400">
                <ChevronRight size={16} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
