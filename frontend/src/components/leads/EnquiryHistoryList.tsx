import { Link } from "react-router-dom";
import type { Enquiry } from "../../types";
import { StatusBadge } from "../common/StatusBadge";

export function EnquiryHistoryList({ enquiries, activeEnquiryId }: { enquiries: Enquiry[]; activeEnquiryId: string }) {
  return (
    <ul className="flex flex-col gap-2">
      {enquiries.map((enquiry) => (
        <li key={enquiry.id}>
          <Link
            to={`/leads/${enquiry.leadId}/enquiries/${enquiry.id}`}
            className={`block rounded-md border p-3 text-sm ${
              enquiry.id === activeEnquiryId ? "border-blue-400 bg-blue-50" : "border-gray-200 bg-white hover:bg-gray-50"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-900">{enquiry.carModel}</span>
              <StatusBadge status={enquiry.status} />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              {enquiry.branch.name} · {enquiry.source.replaceAll("_", " ")} · {new Date(enquiry.createdAt).toLocaleDateString()}
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
