import { Link } from "react-router-dom";
import {
  ClipboardList,
  KeyRound,
  Percent,
  CircleX,
  PhoneOutgoing,
  UserPlus,
  Inbox,
  BarChart3,
  PhoneCall,
  ArrowUpRight,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useSummaryReport, useYoyReport, useTrendReport, useSourcePerformanceReport } from "../hooks/useReports";
import { useLeads } from "../hooks/useLeads";
import { Card } from "../components/common/Card";
import { StatTile } from "../components/reports/StatTile";
import { TrendChart } from "../components/reports/TrendChart";
import { HBarList } from "../components/reports/HBarList";
import { VIZ } from "../components/reports/vizTheme";
import { Avatar } from "../components/common/Avatar";
import { StatusBadge } from "../components/common/StatusBadge";

const REPORT_VISIBLE_ROLES = ["SUPER_ADMIN", "ADMIN", "BRANCH_MANAGER"];

const QUICK_ACTIONS = [
  {
    to: "/leads",
    icon: <UserPlus size={16} />,
    title: "New Lead",
    hoverClass: "hover:bg-blue-50 hover:text-blue-700 hover:ring-blue-300",
    iconHoverClass: "group-hover:text-blue-600",
    roles: undefined as string[] | undefined,
  },
  {
    to: "/social-inbox",
    icon: <Inbox size={16} />,
    title: "Social Inbox",
    hoverClass: "hover:bg-fuchsia-50 hover:text-fuchsia-700 hover:ring-fuchsia-300",
    iconHoverClass: "group-hover:text-fuchsia-600",
    roles: ["SUPER_ADMIN", "ADMIN", "BRANCH_MANAGER", "CR_TEAM"] as string[] | undefined,
  },
  {
    to: "/call-campaigns",
    icon: <PhoneCall size={16} />,
    title: "Campaigns",
    hoverClass: "hover:bg-emerald-50 hover:text-emerald-700 hover:ring-emerald-300",
    iconHoverClass: "group-hover:text-emerald-600",
    roles: ["SUPER_ADMIN", "ADMIN", "BRANCH_MANAGER", "CR_TEAM"] as string[] | undefined,
  },
  {
    to: "/reports",
    icon: <BarChart3 size={16} />,
    title: "Reports",
    hoverClass: "hover:bg-amber-50 hover:text-amber-700 hover:ring-amber-300",
    iconHoverClass: "group-hover:text-amber-600",
    roles: REPORT_VISIBLE_ROLES as string[] | undefined,
  },
];

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function DashboardPage() {
  const { user } = useAuth();
  const canSeeStats = !!user && REPORT_VISIBLE_ROLES.includes(user.role);
  const { data: summary } = useSummaryReport({}, canSeeStats);
  const { data: yoy } = useYoyReport({}, canSeeStats);
  const { data: trend } = useTrendReport({ granularity: "week" }, canSeeStats);
  const { data: sources } = useSourcePerformanceReport({}, canSeeStats);
  const { data: recentLeads } = useLeads({ page: 1, pageSize: 6 });
  const visibleActions = QUICK_ACTIONS.filter((a) => !a.roles || (user && a.roles.includes(user.role)));

  const maxSource = Math.max(1, ...(sources ?? []).map((s) => s.total));
  const today = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8">
      {/* Stripe-like Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="text-sm font-medium text-gray-500">
            {today}
          </span>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900">
            Overview
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          {visibleActions.map((action) => (
            <Link key={action.to} to={action.to}>
              <button className={`group flex cursor-pointer items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-inset ring-gray-200 transition-all duration-300 active:scale-95 hover:-translate-y-0.5 hover:shadow-md ${action.hoverClass}`}>
                <span className={`text-gray-400 transition-transform duration-300 group-hover:scale-110 ${action.iconHoverClass}`}>
                  {action.icon}
                </span>
                {action.title}
              </button>
            </Link>
          ))}
        </div>
      </div>

      {/* Top Row: Horizontal Stats */}
      {canSeeStats && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          <StatTile
            label="Total Enquiries"
            value={summary?.totalEnquiries ?? 0}
            delta={yoy?.growth.total}
            deltaLabel="vs last year"
            icon={<ClipboardList size={20} />}
            iconClassName="bg-blue-50 text-blue-600"
          />
          <StatTile
            label="Converted"
            value={summary?.converted ?? 0}
            delta={yoy?.growth.converted}
            deltaLabel="vs last year"
            icon={<KeyRound size={20} />}
            iconClassName="bg-emerald-50 text-emerald-600"
          />
          <StatTile
            label="Conversion Rate"
            value={yoy?.currentPeriod.conversionRate ?? 0}
            suffix="%"
            delta={yoy?.growth.conversionRate}
            deltaLabel="pts vs last yr"
            icon={<Percent size={20} />}
            iconClassName="bg-violet-50 text-violet-600"
          />
          <StatTile
            label="Follow-up Pending"
            value={summary?.followUpPending ?? 0}
            icon={<PhoneOutgoing size={20} />}
            iconClassName="bg-amber-50 text-amber-600"
          />
          <StatTile
            label="Lost"
            value={summary?.lost ?? 0}
            delta={yoy?.growth.lost}
            deltaLabel="vs last year"
            upIsGood={false}
            icon={<CircleX size={20} />}
            iconClassName="bg-red-50 text-red-600"
          />
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {canSeeStats && (
          <>
            {/* Chart */}
            <div className="lg:col-span-2">
              <Card className="flex h-full flex-col">
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-base font-semibold text-gray-900">Enquiry Trend</h2>
                  <Link to="/reports" className="flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700">
                    View report <ArrowUpRight size={14} />
                  </Link>
                </div>
                <div className="min-h-[250px] flex-1">
                  {trend ? <TrendChart points={trend} /> : <p className="text-sm text-gray-400">Loading…</p>}
                </div>
              </Card>
            </div>

            {/* Top Sources */}
            <div className="lg:col-span-1">
              <Card className="h-full">
                <h2 className="mb-6 text-base font-semibold text-gray-900">Top Lead Sources</h2>
                {sources && sources.length > 0 ? (
                  <HBarList
                    rows={[...sources]
                      .sort((a, b) => b.total - a.total)
                      .slice(0, 5)
                      .map((s) => ({
                        label: s.source.replaceAll("_", " "),
                        value: s.total,
                        fraction: s.total / maxSource,
                        valueLabel: `${s.total} (${s.conversionRate}%)`,
                      }))}
                    color={VIZ.series1}
                  />
                ) : (
                  <p className="text-sm text-gray-400">No data yet.</p>
                )}
              </Card>
            </div>
          </>
        )}

        {/* Recent Leads (Full Width) */}
        <div className="lg:col-span-3">
          <Card padded={false} className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h2 className="text-base font-semibold text-gray-900">Recent Leads</h2>
              <Link to="/leads" className="flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700">
                View all <ArrowUpRight size={14} />
              </Link>
            </div>
            <div className="divide-y divide-gray-100">
              {recentLeads && recentLeads.items.length > 0 ? (
                recentLeads.items.slice(0, 5).map((enquiry) => (
                  <Link
                    key={enquiry.id}
                    to={`/leads/${enquiry.leadId}`}
                    className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-gray-50"
                  >
                    <Avatar name={enquiry.lead.name} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900">{enquiry.lead.name}</p>
                      <p className="truncate text-xs text-gray-500">
                        {enquiry.carModel} · {enquiry.branch.name}
                      </p>
                    </div>
                    <StatusBadge status={enquiry.status} />
                    <span className="w-20 shrink-0 text-right text-xs text-gray-400">{timeAgo(enquiry.createdAt)}</span>
                  </Link>
                ))
              ) : (
                <p className="px-6 py-8 text-center text-sm text-gray-400">No leads yet.</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
