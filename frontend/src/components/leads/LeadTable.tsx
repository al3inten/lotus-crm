import { useNavigate } from "react-router-dom";
import type { Enquiry } from "../../types";
import { StatusBadge } from "../common/StatusBadge";

export function LeadTable({ enquiries }: { enquiries: Enquiry[] }) {
  const navigate = useNavigate();

  if (enquiries.length === 0) {
    return <p className="py-8 text-center text-sm text-gray-400">No leads match these filters.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-left text-xs font-medium text-gray-500">
          <tr>
            <th className="px-4 py-2">Lead Name</th>
            <th className="px-4 py-2">Contact</th>
            <th className="px-4 py-2">Car</th>
            <th className="px-4 py-2">Source</th>
            <th className="px-4 py-2">Enquiry Type</th>
            <th className="px-4 py-2">Enquiries</th>
            <th className="px-4 py-2">Location</th>
            <th className="px-4 py-2">Status</th>
            <th className="px-4 py-2">Assigned Rep</th>
            <th className="px-4 py-2">Branch</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {enquiries.map((enquiry) => (
            <tr
              key={enquiry.id}
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => navigate(`/leads/${enquiry.leadId}`)}
            >
              <td className="px-4 py-2 font-medium text-gray-900">{enquiry.lead.name}</td>
              <td className="px-4 py-2 text-gray-600">{enquiry.lead.phoneRaw}</td>
              <td className="px-4 py-2 text-gray-900">{enquiry.carModel}</td>
              <td className="px-4 py-2 text-gray-600">{enquiry.source.replaceAll("_", " ")}</td>
              <td className="px-4 py-2 text-gray-600">{enquiry.enquiryType.replaceAll("_", " ")}</td>
              <td className="px-4 py-2">
                {(enquiry.lead._count?.enquiries ?? 1) > 1 || (enquiry.lead._count?.touches ?? 0) > 1 ? (
                  <span className="inline-block rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                    ×{Math.max(enquiry.lead._count?.enquiries ?? 1, enquiry.lead._count?.touches ?? 0)} contacts
                  </span>
                ) : (
                  <span className="text-xs text-gray-400">1st</span>
                )}
              </td>
              <td className="px-4 py-2 text-gray-600">{enquiry.location ?? "—"}</td>
              <td className="px-4 py-2">
                <StatusBadge status={enquiry.status} />
              </td>
              <td className="px-4 py-2 text-gray-600">{enquiry.assignedCr?.name ?? "Unassigned"}</td>
              <td className="px-4 py-2 text-gray-600">{enquiry.branch.name}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
