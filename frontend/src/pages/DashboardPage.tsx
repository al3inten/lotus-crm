import { Link } from "react-router-dom";
import {
  Car,
  KeyRound,
  PhoneOutgoing,
  CircleX,
  ClipboardList,
  UserPlus,
  Inbox,
  BarChart3,
  PhoneCall,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useSummaryReport } from "../hooks/useReports";
import { StatCard, Card } from "../components/common/Card";

const REPORT_VISIBLE_ROLES = ["SUPER_ADMIN", "ADMIN", "BRANCH_MANAGER"];

const QUICK_ACTIONS = [
  {
    to: "/leads",
    icon: <UserPlus size={20} />,
    iconClassName: "bg-blue-50 text-blue-600",
    title: "Work the Leads",
    subtitle: "Add walk-ins, follow up enquiries, move deals forward",
    roles: undefined as string[] | undefined,
  },
  {
    to: "/social-inbox",
    icon: <Inbox size={20} />,
    iconClassName: "bg-fuchsia-50 text-fuchsia-600",
    title: "Social Inbox",
    subtitle: "Convert Instagram & WhatsApp chats into leads",
    roles: ["SUPER_ADMIN", "ADMIN", "BRANCH_MANAGER", "CR_TEAM"] as string[] | undefined,
  },
  {
    to: "/call-campaigns",
    icon: <PhoneCall size={20} />,
    iconClassName: "bg-emerald-50 text-emerald-600",
    title: "Call Campaigns",
    subtitle: "Queue AI voice follow-up calls",
    roles: ["SUPER_ADMIN", "ADMIN", "BRANCH_MANAGER", "CR_TEAM"] as string[] | undefined,
  },
  {
    to: "/reports",
    icon: <BarChart3 size={20} />,
    iconClassName: "bg-amber-50 text-amber-600",
    title: "Reports",
    subtitle: "Funnel, conversion & year-over-year analytics",
    roles: REPORT_VISIBLE_ROLES as string[] | undefined,
  },
];

export function DashboardPage() {
  const { user } = useAuth();
  // The summary endpoint is RBAC-gated to manager roles — don't fire (or render) it for CR/Consultant.
  const canSeeStats = !!user && REPORT_VISIBLE_ROLES.includes(user.role);
  const { data: summary } = useSummaryReport({}, canSeeStats);
  const visibleActions = QUICK_ACTIONS.filter((a) => !a.roles || (user && a.roles.includes(user.role)));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.name?.split(" ")[0]} 👋
        </h1>
        <p className="text-sm text-gray-500">Here's what's happening across your showrooms today.</p>
      </div>

      {canSeeStats && (
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard
          icon={<ClipboardList size={22} />}
          iconClassName="bg-blue-50 text-blue-600"
          label="Total Enquiries"
          value={summary?.totalEnquiries ?? "—"}
        />
        <StatCard
          icon={<Car size={22} />}
          iconClassName="bg-sky-50 text-sky-600"
          label="New Leads"
          value={summary?.newEnquiries ?? "—"}
        />
        <StatCard
          icon={<KeyRound size={22} />}
          iconClassName="bg-emerald-50 text-emerald-600"
          label="Converted"
          value={summary?.converted ?? "—"}
        />
        <StatCard
          icon={<PhoneOutgoing size={22} />}
          iconClassName="bg-amber-50 text-amber-600"
          label="Follow-up Pending"
          value={summary?.followUpPending ?? "—"}
        />
        <StatCard
          icon={<CircleX size={22} />}
          iconClassName="bg-red-50 text-red-600"
          label="Lost"
          value={summary?.lost ?? "—"}
        />
      </div>
      )}

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {visibleActions.map((action) => (
            <Link key={action.to} to={action.to}>
              <Card interactive className="h-full">
                <div className="flex items-start justify-between">
                  <span className={`flex h-11 w-11 items-center justify-center rounded-lg ${action.iconClassName}`}>
                    {action.icon}
                  </span>
                  <ChevronRight size={16} className="text-gray-300" />
                </div>
                <h3 className="mt-3 text-sm font-semibold text-gray-900">{action.title}</h3>
                <p className="mt-1 text-xs text-gray-500">{action.subtitle}</p>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
