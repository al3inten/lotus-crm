import type { SummaryReport } from "../../api/reports.api";

interface KpiCardsProps {
  summary: SummaryReport;
}

export function KpiCards({ summary }: KpiCardsProps) {
  const cards = [
    { label: "Total Enquiries", value: summary.totalEnquiries },
    { label: "New Leads", value: summary.newEnquiries },
    { label: "Converted", value: summary.converted },
    { label: "Follow-up Pending", value: summary.followUpPending },
    { label: "Lost", value: summary.lost },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {cards.map((card) => (
        <div key={card.label} className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs font-medium text-gray-500">{card.label}</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{card.value}</p>
        </div>
      ))}
    </div>
  );
}
