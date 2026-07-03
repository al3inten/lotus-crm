import { useMemo, useState } from "react";
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
import { downloadEnquiriesCsv } from "../api/reports.api";
import { StatTile } from "../components/reports/StatTile";
import { FunnelChart } from "../components/reports/FunnelChart";
import { HBarList } from "../components/reports/HBarList";
import { SourcePerformanceTable } from "../components/reports/SourcePerformanceTable";
import { CrPerformanceTable } from "../components/reports/CrPerformanceTable";
import { TrendChart } from "../components/reports/TrendChart";
import { formatHours } from "../components/reports/vizTheme";
import { Button } from "../components/common/Button";
import { Select } from "../components/common/Input";

type Granularity = "week" | "month" | "year";

const DATE_PRESETS = [
  { key: "30d", label: "Last 30 days", days: 30 },
  { key: "90d", label: "Last 90 days", days: 90 },
  { key: "ytd", label: "This year", days: null },
  { key: "all", label: "All time", days: -1 },
] as const;

type PresetKey = (typeof DATE_PRESETS)[number]["key"];

const LOSS_REASON_LABELS: Record<string, string> = {
  PRICE_TOO_HIGH: "Price too high",
  BOUGHT_COMPETITOR: "Bought competitor",
  BOUGHT_ANOTHER_BRANCH: "Bought at another branch",
  NOT_INTERESTED_ANYMORE: "Not interested anymore",
  FINANCE_REJECTED: "Finance rejected",
  NO_RESPONSE: "No response",
  OTHER: "Other",
};

const STAGE_LABELS: Record<string, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  FOLLOW_UP: "Follow-up",
  APPOINTMENT_SCHEDULED: "Appointment",
  APPOINTMENT_NO_SHOW: "No-show",
  TEST_DRIVE_DONE: "Test Drive",
  FEEDBACK_COLLECTED: "Feedback",
  QUOTATION_SHARED: "Quotation",
  NEGOTIATION: "Negotiation",
  BOOKING_CONFIRMED: "Booking",
  FINANCE_IN_PROGRESS: "Finance",
  EXCHANGE_IN_PROGRESS: "Exchange",
  SALE_CLOSED: "Sale Closed",
  DELIVERY_IN_PROGRESS: "Delivery",
  DELIVERED: "Delivered",
  LOST: "Lost",
};

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
      {subtitle && <p className="mb-3 text-xs text-gray-500">{subtitle}</p>}
      {!subtitle && <div className="mb-3" />}
      {children}
    </div>
  );
}

export function ReportsPage() {
  const [preset, setPreset] = useState<PresetKey>("ytd");
  const [branchId, setBranchId] = useState<string>("");
  const [granularity, setGranularity] = useState<Granularity>("month");
  const [exporting, setExporting] = useState(false);

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
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-2xl font-semibold text-gray-900">Reports</h1>
        <Button variant="secondary" isLoading={exporting} onClick={handleExport}>
          Export CSV
        </Button>
      </div>

      {/* One filter row above everything it scopes — every widget below re-renders against the same slice. */}
      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 bg-white p-3">
        <Select label="Date range" value={preset} onChange={(e) => setPreset(e.target.value as PresetKey)}>
          {DATE_PRESETS.map((p) => (
            <option key={p.key} value={p.key}>
              {p.label}
            </option>
          ))}
        </Select>
        <Select label="Branch" value={branchId} onChange={(e) => setBranchId(e.target.value)}>
          <option value="">All Branches</option>
          {branches?.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </Select>
        <Select label="Trend granularity" value={granularity} onChange={(e) => setGranularity(e.target.value as Granularity)}>
          <option value="week">Weekly</option>
          <option value="month">Monthly</option>
          <option value="year">Yearly</option>
        </Select>
      </div>

      {/* KPI row with year-over-year deltas */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatTile label="Total Enquiries" value={summary?.totalEnquiries ?? 0} delta={yoy?.growth.total} deltaLabel="vs last year" />
        <StatTile label="Converted" value={summary?.converted ?? 0} delta={yoy?.growth.converted} deltaLabel="vs last year" />
        <StatTile
          label="Conversion Rate"
          value={yoy?.currentPeriod.conversionRate ?? 0}
          suffix="%"
          delta={yoy?.growth.conversionRate}
          deltaLabel="pts vs last year"
        />
        <StatTile label="Lost" value={summary?.lost ?? 0} delta={yoy?.growth.lost} deltaLabel="vs last year" upIsGood={false} />
        <StatTile label="Follow-up Pending" value={summary?.followUpPending ?? 0} />
      </div>

      <Section title="Trend" subtitle="Enquiry volume, conversions, and losses over time">
        {trend ? <TrendChart points={trend} /> : <p className="text-sm text-gray-400">Loading…</p>}
      </Section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Section title="Sales Funnel" subtitle="How many enquiries ever reached each pipeline stage">
          {funnel ? <FunnelChart stages={funnel} /> : <p className="text-sm text-gray-400">Loading…</p>}
        </Section>

        <Section title="Time in Stage" subtitle="Average time enquiries spend at each stage before moving on">
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
            <p className="text-sm text-gray-400">Loading…</p>
          )}
        </Section>
      </div>

      <Section title="Source Performance" subtitle="Which channels bring the most leads — and which actually convert">
        {sources ? <SourcePerformanceTable rows={sources} /> : <p className="text-sm text-gray-400">Loading…</p>}
      </Section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Section title="Lost Reasons" subtitle="Why deals are being lost">
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
            <p className="text-sm text-gray-400">No lost enquiries with a recorded reason in this range.</p>
          )}
        </Section>

        <Section title="AI Calling Analysis" subtitle="Outbound voice agent activity (from call campaigns)">
          {callAnalysis ? (
            <div className="grid grid-cols-2 gap-3">
              <StatTile label="Total Calls" value={callAnalysis.totalCalls} />
              <StatTile label="Answer Rate" value={callAnalysis.answerRate} suffix="%" />
              <StatTile label="No Answer" value={callAnalysis.noAnswer} />
              <StatTile
                label="Avg Duration"
                value={callAnalysis.avgDurationSeconds != null ? `${Math.round(callAnalysis.avgDurationSeconds / 60)}m ${callAnalysis.avgDurationSeconds % 60}s` : "—"}
              />
            </div>
          ) : (
            <p className="text-sm text-gray-400">Loading…</p>
          )}
        </Section>
      </div>

      <Section title="CR Team Performance" subtitle="Assigned enquiries and conversion rate per CR team member">
        {crRows ? <CrPerformanceTable rows={crRows} /> : <p className="text-sm text-gray-400">Loading…</p>}
      </Section>

      {rollup && rollup.length > 1 && (
        <Section title="Branch Rollup" subtitle="Enquiry totals by branch">
          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs font-medium text-gray-500">
                <tr>
                  <th className="px-4 py-2">Branch</th>
                  <th className="px-4 py-2">Total</th>
                  <th className="px-4 py-2">Converted</th>
                  <th className="px-4 py-2">Lost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rollup.map((row) => (
                  <tr key={row.branchId}>
                    <td className="px-4 py-2 font-medium text-gray-900">{row.branchName}</td>
                    <td className="px-4 py-2 tabular-nums text-gray-700">{row.total}</td>
                    <td className="px-4 py-2 tabular-nums text-gray-700">
                      {(row.statusCounts["SALE_CLOSED"] ?? 0) +
                        (row.statusCounts["DELIVERY_IN_PROGRESS"] ?? 0) +
                        (row.statusCounts["DELIVERED"] ?? 0)}
                    </td>
                    <td className="px-4 py-2 tabular-nums text-gray-700">{row.statusCounts["LOST"] ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}
    </div>
  );
}
