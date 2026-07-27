import { useMemo, useState } from "react";
import clsx from "clsx";
import { useBranches } from "../hooks/useBranches";
import {
  useSummaryReport,
  useCrPerformanceReport,
  useBranchRollupReport,
  useTrendReport,
  useYoyReport,
  useFunnelReport,
  useTimeInStageReport,
  useCallAnalysisReport,
  useSourcePerformanceReport,
  useLostReasonsReport,
} from "../hooks/useReports";
import {
  ClipboardList,
  KeyRound,
  Percent,
  CircleX,
  PhoneOutgoing,
  Download,
  LayoutGrid,
  TrendingUp,
  Filter,
  Clock,
  Radio,
  ThumbsDown,
  PhoneCall,
  Users,
  Building2,
  LayoutDashboard,
  GitBranch,
} from "lucide-react";
import { downloadEnquiriesCsv } from "../api/reports.api";
import { StatTile } from "../components/reports/StatTile";
import { FunnelChart } from "../components/reports/FunnelChart";
import { HBarList } from "../components/reports/HBarList";
import { SourcePerformanceTable } from "../components/reports/SourcePerformanceTable";
import { CrPerformanceTable } from "../components/reports/CrPerformanceTable";
import { ChartBuilder } from "../components/reports/ChartBuilder";
import { TrendChart } from "../components/reports/TrendChart";
import { formatHours } from "../components/reports/vizTheme";
import { Button } from "../components/common/Button";
import { Select } from "../components/common/Input";
import { Card, CardHeader } from "../components/common/Card";

type Granularity = "week" | "month" | "year";

const DATE_PRESETS = [
  { key: "30d", label: "Last 30 days", days: 30 },
  { key: "90d", label: "Last 90 days", days: 90 },
  { key: "ytd", label: "This year", days: null },
  { key: "all", label: "All time", days: -1 },
] as const;

type PresetKey = (typeof DATE_PRESETS)[number]["key"];

const TABS = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "pipeline", label: "Pipeline", icon: GitBranch },
  { key: "sources-team", label: "Sources & Team", icon: Users },
  { key: "ai-calling", label: "AI Calling", icon: PhoneCall },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const LOSS_REASON_LABELS: Record<string, string> = {
  OTHER_REASON: "Other reason",
  CO_DEALER: "Co dealer",
  OUT_OF_TERRITORY: "Out of territory (not contactable)",
};

const STAGE_LABELS: Record<string, string> = {
  NEW: "New Lead",
  UNDER_FOLLOW_UP: "Under Follow-up",
  APPOINTMENT_FIXED: "Appointment Fixed",
  TEST_DRIVE: "Test Drive",
  BOOKED: "Booked",
  RETAIL_DONE: "Retail Done",
  CLOSED: "Closed",
};

function Section({
  title,
  subtitle,
  icon,
  iconClassName,
  children,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  iconClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader icon={icon} title={title} subtitle={subtitle} iconClassName={iconClassName} />
      {children}
    </Card>
  );
}

export function ReportsPage() {
  const [preset, setPreset] = useState<PresetKey>("ytd");
  const [branchId, setBranchId] = useState<string>("");
  const [granularity, setGranularity] = useState<Granularity>("month");
  const [exporting, setExporting] = useState(false);
  const [tab, setTab] = useState<TabKey>("overview");

  const filters = useMemo(() => {
    const base: { branchId?: string; dateFrom?: string; dateTo?: string } = {
      branchId: branchId || undefined,
    };
    const now = new Date();
    const presetDef = DATE_PRESETS.find((p) => p.key === preset)!;
    if (presetDef.key === "ytd") {
      base.dateFrom = new Date(now.getFullYear(), 0, 1).toISOString();
    } else if (presetDef.days !== null && presetDef.days > 0) {
      base.dateFrom = new Date(now.getTime() - presetDef.days * 24 * 3600 * 1000).toISOString();
    }
    return base;
  }, [preset, branchId]);

  const { data: branches } = useBranches();
  const { data: summary } = useSummaryReport(filters);
  const { data: yoy } = useYoyReport(filters);
  const { data: trend } = useTrendReport({ ...filters, granularity });
  const { data: funnel } = useFunnelReport(filters);
  const { data: timeInStage } = useTimeInStageReport(filters);
  const { data: callAnalysis } = useCallAnalysisReport(filters);
  const { data: sources } = useSourcePerformanceReport(filters);
  const { data: lostReasons } = useLostReasonsReport(filters);
  const { data: crRows } = useCrPerformanceReport(filters);
  const { data: rollup } = useBranchRollupReport(filters);

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await downloadEnquiriesCsv(filters);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `lotus-crm-enquiries-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  const maxLostCount = Math.max(1, ...(lostReasons ?? []).map((r) => r.count));
  const maxStageHours = Math.max(1, ...(timeInStage ?? []).map((r) => r.avgHours ?? 0));

  return (
    <div className="mx-auto w-full max-w-7xl flex flex-col gap-6">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-[#0B0F19] px-6 py-8 shadow-2xl shadow-primary-900/10 ring-1 ring-slate-900/5 dark:bg-slate-950 dark:ring-white/10 sm:px-9 sm:py-9">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h1v1H0V0zm23 23h1v1h-1v-1z' fill='white'/%3E%3C/svg%3E\")", backgroundSize: "24px 24px" }}
        />
        <div className="pointer-events-none absolute -left-20 -top-20 h-[300px] w-[300px] rounded-full bg-primary-500/10 blur-[80px]" />

        <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <span className="inline-flex items-center rounded-full bg-primary-500/10 px-2.5 py-0.5 text-xs sm:text-sm font-medium text-primary-300 ring-1 ring-inset ring-primary-500/20 backdrop-blur-md">
              Analytics & Insights
            </span>
            <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              Reports
            </h1>
            <p className="mt-2 text-sm sm:text-base text-slate-300">
              Track conversion rates, team performance, and lead sources in real-time.
            </p>
          </div>
          <div className="shrink-0">
            <Button
              variant="secondary"
              isLoading={exporting}
              icon={<Download size={15} />}
              onClick={handleExport}
              className="bg-white/10 text-white hover:bg-white/20 border-0 ring-1 ring-white/20 shadow-lg backdrop-blur-md transition-all hover:scale-105"
            >
              Export CSV
            </Button>
          </div>
        </div>
      </div>

      {/* One filter row above everything it scopes — every widget below re-renders against the same slice. */}
      <Card>
      <div className="flex flex-wrap items-end gap-4">
        <Select label="Date range" value={preset} onChange={(e) => setPreset(e.target.value as PresetKey)} className="min-w-[150px]">
          {DATE_PRESETS.map((p) => (
            <option key={p.key} value={p.key}>
              {p.label}
            </option>
          ))}
        </Select>
        <Select label="Branch" value={branchId} onChange={(e) => setBranchId(e.target.value)} className="min-w-[180px]">
          <option value="">All Branches</option>
          {branches?.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </Select>
        <Select label="Trend granularity" value={granularity} onChange={(e) => setGranularity(e.target.value as Granularity)} className="min-w-[150px]">
          <option value="week">Weekly</option>
          <option value="month">Monthly</option>
          <option value="year">Yearly</option>
        </Select>
      </div>
      </Card>

      {/* KPI row with year-over-year deltas */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatTile
          label="Total Enquiries"
          value={summary?.totalEnquiries ?? 0}
          delta={yoy?.growth.total}
          deltaLabel="vs last year"
          icon={<ClipboardList size={20} />}
          iconClassName="bg-primary-50 text-primary-600 dark:bg-primary-500/20 dark:text-primary-400"
        />
        <StatTile
          label="Converted"
          value={summary?.converted ?? 0}
          delta={yoy?.growth.converted}
          deltaLabel="vs last year"
          icon={<KeyRound size={20} />}
          iconClassName="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400"
        />
        <StatTile
          label="Conversion Rate"
          value={yoy?.currentPeriod.conversionRate ?? 0}
          suffix="%"
          delta={yoy?.growth.conversionRate}
          deltaLabel="pts vs last year"
          icon={<Percent size={20} />}
          iconClassName="bg-violet-50 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400"
        />
        <StatTile
          label="Lost"
          value={summary?.lost ?? 0}
          delta={yoy?.growth.lost}
          deltaLabel="vs last year"
          upIsGood={false}
          icon={<CircleX size={20} />}
          iconClassName="bg-red-50 text-red-600 dark:bg-red-500/20 dark:text-red-400"
        />
        <StatTile
          label="Follow-up Pending"
          value={summary?.followUpPending ?? 0}
          icon={<PhoneOutgoing size={20} />}
          iconClassName="bg-amber-50 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400"
        />
      </div>

      {/* Tab bar — groups the reports below instead of stacking all eight sections in one
          long scroll, which is what made the page feel cluttered. */}
      <div className="flex items-center gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1 dark:bg-slate-800/60">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            aria-pressed={tab === key}
            className={clsx(
              "flex shrink-0 items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50",
              tab === key
                ? "bg-white text-primary-700 shadow-sm dark:bg-slate-900 dark:text-primary-400"
                : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
            )}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <>
          <Section
            title="Chart Builder"
            subtitle="Break enquiries down by any field — pick a dimension and measure, view as bars or a donut"
            icon={<Filter size={20} />}
            iconClassName="bg-primary-50 text-primary-600 dark:bg-primary-500/20 dark:text-primary-400"
          >
            <ChartBuilder filters={filters} />
          </Section>

          <Section
            title="Trend"
            subtitle="Enquiry volume, conversions, and losses over time"
            icon={<TrendingUp size={20} />}
            iconClassName="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400"
          >
            {trend ? <TrendChart points={trend} /> : <p className="text-sm text-gray-400 dark:text-slate-500">Loading…</p>}
          </Section>
        </>
      )}

      {tab === "pipeline" && (
        <>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Section
              title="Sales Funnel"
              subtitle="How many enquiries ever reached each pipeline stage"
              icon={<LayoutGrid size={20} />}
              iconClassName="bg-violet-50 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400"
            >
              {funnel ? <FunnelChart stages={funnel} /> : <p className="text-sm text-gray-400 dark:text-slate-500">Loading…</p>}
            </Section>

            <Section
              title="Time in Stage"
              subtitle="Average time enquiries spend at each stage before moving on"
              icon={<Clock size={20} />}
              iconClassName="bg-amber-50 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400"
            >
              {timeInStage ? (
                <HBarList
                  rows={timeInStage.map((row) => ({
                    label: STAGE_LABELS[row.stage] ?? row.stage,
                    value: row.avgHours ?? 0,
                    fraction: (row.avgHours ?? 0) / maxStageHours,
                    valueLabel: row.avgHours != null ? formatHours(row.avgHours) : "—",
                  }))}
                />
              ) : (
                <p className="text-sm text-gray-400 dark:text-slate-500">Loading…</p>
              )}
            </Section>
          </div>

          <Section
            title="Lost Reasons"
            subtitle="Why deals are being lost"
            icon={<ThumbsDown size={20} />}
            iconClassName="bg-red-50 text-red-600 dark:bg-red-500/20 dark:text-red-400"
          >
            {lostReasons && lostReasons.length > 0 ? (
              <HBarList
                rows={lostReasons.map((row) => ({
                  label: LOSS_REASON_LABELS[row.reason] ?? row.reason,
                  value: row.count,
                  fraction: row.count / maxLostCount,
                  valueLabel: `${row.count} (${row.percent}%)`,
                }))}
              />
            ) : (
              <p className="text-sm text-gray-400 dark:text-slate-500">No lost enquiries with a recorded reason in this range.</p>
            )}
          </Section>
        </>
      )}

      {tab === "sources-team" && (
        <>
          <Section
            title="Source Performance"
            subtitle="Which channels bring the most leads — and which actually convert"
            icon={<Radio size={20} />}
            iconClassName="bg-primary-50 text-primary-600 dark:bg-primary-500/20 dark:text-primary-400"
          >
            {sources ? <SourcePerformanceTable rows={sources} /> : <p className="text-sm text-gray-400 dark:text-slate-500">Loading…</p>}
          </Section>

          <Section
            title="CR Team Performance"
            subtitle="Assigned enquiries and conversion rate per CR team member"
            icon={<Users size={20} />}
            iconClassName="bg-primary-50 text-primary-600 dark:bg-primary-500/20 dark:text-primary-400"
          >
            {crRows ? <CrPerformanceTable rows={crRows} /> : <p className="text-sm text-gray-400 dark:text-slate-500">Loading…</p>}
          </Section>

          {rollup && rollup.length > 1 && (
            <Section
              title="Branch Rollup"
              subtitle="Enquiry totals by branch"
              icon={<Building2 size={20} />}
              iconClassName="bg-primary-50 text-primary-600 dark:bg-primary-500/20 dark:text-primary-400"
            >
              <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-slate-800">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:bg-slate-800/50 dark:text-slate-400">
                    <tr>
                      <th className="px-4 py-2.5">Branch</th>
                      <th className="px-4 py-2.5">Total</th>
                      <th className="px-4 py-2.5">Converted</th>
                      <th className="px-4 py-2.5">Lost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                    {rollup.map((row) => (
                      <tr key={row.branchId} className="transition-colors hover:bg-primary-50/60 dark:hover:bg-primary-500/[0.06]">
                        <td className="px-4 py-2.5 font-medium text-gray-900 dark:text-slate-100">{row.branchName}</td>
                        <td className="px-4 py-2.5 tabular-nums text-gray-700 dark:text-slate-300">{row.total}</td>
                        <td className="px-4 py-2.5 tabular-nums text-gray-700 dark:text-slate-300">{row.statusCounts["RETAIL_DONE"] ?? 0}</td>
                        <td className="px-4 py-2.5 tabular-nums text-gray-700 dark:text-slate-300">{row.statusCounts["CLOSED"] ?? 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
          )}
        </>
      )}

      {tab === "ai-calling" && (
        <Section
          title="AI Calling Analysis"
          subtitle="Outbound voice agent activity (from call campaigns)"
          icon={<PhoneCall size={20} />}
          iconClassName="bg-violet-50 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400"
        >
          {callAnalysis ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatTile label="Total Calls" value={callAnalysis.totalCalls} />
              <StatTile label="Answer Rate" value={callAnalysis.answerRate} suffix="%" />
              <StatTile label="No Answer" value={callAnalysis.noAnswer} />
              <StatTile
                label="Avg Duration"
                value={callAnalysis.avgDurationSeconds != null ? `${Math.round(callAnalysis.avgDurationSeconds / 60)}m ${callAnalysis.avgDurationSeconds % 60}s` : "—"}
              />
            </div>
          ) : (
            <p className="text-sm text-gray-400 dark:text-slate-500">Loading…</p>
          )}
        </Section>
      )}
    </div>
  );
}
