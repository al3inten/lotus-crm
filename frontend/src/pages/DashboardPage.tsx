import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSummaryReport } from "../hooks/useReports";
import { KpiCards } from "../components/reports/KpiCards";

const REPORT_VISIBLE_ROLES = ["SUPER_ADMIN", "ADMIN", "BRANCH_MANAGER"];

export function DashboardPage() {
  const { user } = useAuth();
  const canSeeReports = !!user && REPORT_VISIBLE_ROLES.includes(user.role);
  const { data: summary, isLoading } = useSummaryReport({});

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Welcome, {user?.name}</h1>
        <p className="text-sm text-gray-500">
          {canSeeReports ? "Here's how things are looking today." : "Head to Leads to work your queue."}
        </p>
      </div>

      {canSeeReports && (
        <>
          {isLoading || !summary ? (
            <p className="text-sm text-gray-500">Loading summary…</p>
          ) : (
            <KpiCards summary={summary} />
          )}
          <Link to="/reports" className="text-sm font-medium text-blue-600 hover:underline">
            View full reports →
          </Link>
        </>
      )}

      <Link
        to="/leads"
        className="inline-block w-fit rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
      >
        Go to Leads
      </Link>
    </div>
  );
}
