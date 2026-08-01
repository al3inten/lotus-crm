import { useMemo, useState } from "react";
import clsx from "clsx";
import { LocationBranchSelect } from "../components/common/LocationBranchSelect";
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
  useConsultantPerformanceReport,
  useReferralLeadsReport,
  useReferralPerformanceReport,
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
  Clock,
  Radio,
  ThumbsDown,
  PhoneCall,
  Users,
  Building2,
  LayoutDashboard,
  GitBranch,
  SlidersHorizontal,
  UserPlus,
  Car,
  Search,
} from "lucide-react";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import type { ReportFilters } from "../api/reports.api";
import { StatTile } from "../components/reports/StatTile";
import { CustomerListModal } from "../components/reports/CustomerListModal";
import { DonutChart } from "../components/reports/DonutChart";
import type { DonutSlice } from "../components/reports/DonutChart";
import { ChartTableToggle } from "../components/reports/ChartTableToggle";
import { ReportSkeleton } from "../components/reports/ReportSkeleton";
import { Skeleton } from "../components/ui/skeleton";
import { FunnelChart } from "../components/reports/FunnelChart";
import { HBarList } from "../components/reports/HBarList";
import { SourcePerformanceTable } from "../components/reports/SourcePerformanceTable";
import { CrPerformanceTable, StatusBreakdownCell } from "../components/reports/CrPerformanceTable";
import { TrendChart } from "../components/reports/TrendChart";
import { formatHours } from "../components/reports/vizTheme";
import { Button } from "../components/common/Button";
import { Select, Input } from "../components/common/Input";
import { DatePickerField } from "../components/common/DateTimePicker";
import { Card, CardHeader } from "../components/common/Card";
import { LEAD_SOURCES, LOSS_REASONS, ENQUIRY_TYPES } from "../types";

type Granularity = "week" | "month" | "year";

const DATE_PRESETS = [
  { key: "30d", label: "Last 30 days", days: 30 },
  { key: "90d", label: "Last 90 days", days: 90 },
  { key: "ytd", label: "This year", days: null },
  { key: "all", label: "All time", days: -1 },
  { key: "custom", label: "Custom range", days: null },
] as const;

type PresetKey = (typeof DATE_PRESETS)[number]["key"];

const TABS = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "sources-team", label: "Sources & Team", icon: Users },
  { key: "pipeline", label: "Pipeline", icon: GitBranch },
  { key: "ai-calling", label: "AI Calling", icon: PhoneCall },
  { key: "referrals", label: "Referrals", icon: UserPlus },
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
  BOOKED: "Booking",
  RETAIL_DONE: "Retail",
  RTO_DONE: "RTO",
  DELIVERED: "Delivered",
  CLOSED: "Closed",
};

// Every case a customer can be in, in pipeline order — the Status Breakdown table below
// walks this list so "all the situations" is always complete, not just whatever keys
// happen to be present in this period's data.
const STATUS_ORDER = [
  "NEW",
  "UNDER_FOLLOW_UP",
  "APPOINTMENT_FIXED",
  "TEST_DRIVE",
  "BOOKED",
  "RETAIL_DONE",
  "RTO_DONE",
  "DELIVERED",
  "CLOSED_TEMP",
  "LOST",
] as const;

/** Debounced (300ms) free-text search box for filtering a table already loaded client-side —
 * used throughout the Referrals tab so typing doesn't re-filter on every keystroke. */
function TableSearch({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative w-full sm:w-64">
      <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-gray-200 bg-white py-1.5 pl-8 pr-3 text-sm text-gray-900 placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
      />
    </div>
  );
}

function Section({
  title,
  subtitle,
  icon,
  iconClassName,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  iconClassName?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader icon={icon} title={title} subtitle={subtitle} iconClassName={iconClassName} actions={actions} />
      {children}
    </Card>
  );
}

export function ReportsPage() {
  const [preset, setPreset] = useState<PresetKey>("ytd");
  const [customFrom, setCustomFrom] = useState<string>("");
  const [customTo, setCustomTo] = useState<string>("");
  const [locationId, setLocationId] = useState<string | undefined>(undefined);
  const [branchId, setBranchId] = useState<string>("");
  const [granularity, setGranularity] = useState<Granularity>("month");
  const [tab, setTab] = useState<TabKey>("overview");

  // The Custom Download card — every extra dimension is optional and they all combine
  // (AND, not OR), so "Status = Retail" + "Source = Referral" downloads only customers
  // matching both at once, on top of whatever date/branch is already selected above.
  const [customStatus, setCustomStatus] = useState<string>("");
  const [customSource, setCustomSource] = useState<string>("");
  const [customEnquiryType, setCustomEnquiryType] = useState<string>("");
  const [customLossReason, setCustomLossReason] = useState<string>("");
  const [customPhone, setCustomPhone] = useState<string>("");

  const filters = useMemo(() => {
    const base: { branchId?: string; dateFrom?: string; dateTo?: string } = {
      branchId: branchId || undefined,
    };
    const now = new Date();
    const presetDef = DATE_PRESETS.find((p) => p.key === preset)!;
    if (presetDef.key === "custom") {
      if (customFrom) base.dateFrom = new Date(customFrom).toISOString();
      // End-of-day so "to" is inclusive of the whole selected day, not midnight at its start.
      if (customTo) base.dateTo = new Date(`${customTo}T23:59:59.999`).toISOString();
    } else if (presetDef.key === "ytd") {
      base.dateFrom = new Date(now.getFullYear(), 0, 1).toISOString();
    } else if (presetDef.days !== null && presetDef.days > 0) {
      base.dateFrom = new Date(now.getTime() - presetDef.days * 24 * 3600 * 1000).toISOString();
    }
    return base;
  }, [preset, branchId, customFrom, customTo]);

  const { data: summary } = useSummaryReport(filters);
  const { data: yoy } = useYoyReport(filters);
  const { data: trend } = useTrendReport({ ...filters, granularity });
  const { data: funnel } = useFunnelReport(filters);
  const { data: timeInStage } = useTimeInStageReport(filters);
  const { data: callAnalysis } = useCallAnalysisReport(filters);
  const { data: sources } = useSourcePerformanceReport(filters);
  const { data: lostReasons } = useLostReasonsReport(filters);
  const { data: crRows } = useCrPerformanceReport(filters);
  const { data: consultantRows } = useConsultantPerformanceReport(filters);
  const { data: rollup } = useBranchRollupReport(filters);
  const { data: referralLeads } = useReferralLeadsReport(filters, tab === "referrals");
  const { data: referralPerformance } = useReferralPerformanceReport(filters, tab === "referrals");

  // Every "download this list" action opens the preview modal first (see CustomerListModal)
  // rather than downloading blind — `extra` narrows the list beyond the page's own filters.
  const [preview, setPreview] = useState<{ title: string; fileSuffix: string; filters: ReportFilters } | null>(null);
  const openList = (title: string, fileSuffix: string, extra: Partial<ReportFilters> = {}) =>
    setPreview({ title, fileSuffix, filters: { ...filters, ...extra } });

  const customFilterCount = [customStatus, customSource, customEnquiryType, customLossReason, customPhone].filter(Boolean).length;
  const handleCustomDownload = () => {
    const parts = [customStatus, customSource, customEnquiryType, customLossReason].filter(Boolean);
    if (customPhone) parts.push(`Mobile ${customPhone}`);
    const label = parts.length
      ? parts.map((p) => p.replaceAll("_", " ")).join(" + ")
      : "All customers";
    openList(label, parts.length ? parts.join("-").toLowerCase().replace(/_/g, "-").replace(/\s+/g, "-") : "all", {
      status: customStatus || undefined,
      source: customSource || undefined,
      enquiryType: customEnquiryType || undefined,
      lossReason: customLossReason || undefined,
      phone: customPhone.trim() || undefined,
    });
  };

  const maxLostCount = Math.max(1, ...(lostReasons ?? []).map((r) => r.count));
  const maxStageHours = Math.max(1, ...(timeInStage ?? []).map((r) => r.avgHours ?? 0));

  const [statusSearch, setStatusSearch] = useState("");
  const debouncedStatusSearch = useDebouncedValue(statusSearch, 300).trim().toLowerCase();
  const [timeInStageSearch, setTimeInStageSearch] = useState("");
  const debouncedTimeInStageSearch = useDebouncedValue(timeInStageSearch, 300).trim().toLowerCase();
  const [lostReasonSearch, setLostReasonSearch] = useState("");
  const debouncedLostReasonSearch = useDebouncedValue(lostReasonSearch, 300).trim().toLowerCase();
  const [sourceSearch, setSourceSearch] = useState("");
  const debouncedSourceSearch = useDebouncedValue(sourceSearch, 300).trim().toLowerCase();
  const [consultantSearch, setConsultantSearch] = useState("");
  const debouncedConsultantSearch = useDebouncedValue(consultantSearch, 300).trim().toLowerCase();
  const [crSearch, setCrSearch] = useState("");
  const debouncedCrSearch = useDebouncedValue(crSearch, 300).trim().toLowerCase();
  const [branchSearch, setBranchSearch] = useState("");
  const debouncedBranchSearch = useDebouncedValue(branchSearch, 300).trim().toLowerCase();

  const [referralLeadSearch, setReferralLeadSearch] = useState("");
  const debouncedReferralLeadSearch = useDebouncedValue(referralLeadSearch, 300).trim().toLowerCase();
  const [topReferrerSearch, setTopReferrerSearch] = useState("");
  const debouncedTopReferrerSearch = useDebouncedValue(topReferrerSearch, 300).trim().toLowerCase();
  const [topModelSearch, setTopModelSearch] = useState("");
  const debouncedTopModelSearch = useDebouncedValue(topModelSearch, 300).trim().toLowerCase();

  const referralConverted = referralLeads?.converted ?? 0;
  const referralLost = referralLeads?.lost ?? 0;
  const referralConversionRate = referralLeads?.total
    ? Number(((referralConverted / referralLeads.total) * 100).toFixed(1))
    : 0;
  const maxReferrerCount = Math.max(1, ...(referralPerformance?.topReferrers ?? []).map((r) => r.count));
  const maxReferredModelCount = Math.max(1, ...(referralPerformance?.topModels ?? []).map((m) => m.count));

  const filteredReferralLeads = (referralLeads?.rows ?? []).filter((row) => {
    if (!debouncedReferralLeadSearch) return true;
    return [row.name, row.phone, row.referrerName, row.referrerPhone, row.carModel, row.branch]
      .filter(Boolean)
      .some((v) => v!.toLowerCase().includes(debouncedReferralLeadSearch));
  });
  const filteredTopReferrers = (referralPerformance?.topReferrers ?? []).filter((r) => {
    if (!debouncedTopReferrerSearch) return true;
    return [r.referrerName, r.referrerPhone].filter(Boolean).some((v) => v!.toLowerCase().includes(debouncedTopReferrerSearch));
  });
  const filteredTopModels = (referralPerformance?.topModels ?? []).filter((m) =>
    !debouncedTopModelSearch || m.carModel.toLowerCase().includes(debouncedTopModelSearch)
  );

  const filteredStatusOrder = STATUS_ORDER.filter(
    (s) => !debouncedStatusSearch || (STAGE_LABELS[s] ?? s).toLowerCase().includes(debouncedStatusSearch)
  );
  // Overdue isn't a pipeline stage — it's a cross-cutting subset of still-open enquiries
  // (a Test Drive or Booking case can also be overdue), so it's an extra row rather than
  // part of STATUS_ORDER, and left out of the donut chart to avoid double-counting there.
  const showOverdueRow = !debouncedStatusSearch || "overdue".includes(debouncedStatusSearch);
  const filteredTimeInStage = (timeInStage ?? []).filter(
    (row) => !debouncedTimeInStageSearch || (STAGE_LABELS[row.stage] ?? row.stage).toLowerCase().includes(debouncedTimeInStageSearch)
  );
  const filteredLostReasons = (lostReasons ?? []).filter(
    (row) =>
      !debouncedLostReasonSearch ||
      (LOSS_REASON_LABELS[row.reason] ?? row.reason).toLowerCase().includes(debouncedLostReasonSearch)
  );
  const filteredSources = (sources ?? []).filter(
    (row) => !debouncedSourceSearch || row.source.toLowerCase().includes(debouncedSourceSearch)
  );
  const filteredConsultantRows = (consultantRows ?? []).filter(
    (row) => !debouncedConsultantSearch || row.consultantName.toLowerCase().includes(debouncedConsultantSearch)
  );
  const filteredCrRows = (crRows ?? []).filter(
    (row) => !debouncedCrSearch || row.crName.toLowerCase().includes(debouncedCrSearch)
  );
  const filteredRollup = (rollup ?? []).filter(
    (row) => !debouncedBranchSearch || row.branchName.toLowerCase().includes(debouncedBranchSearch)
  );

  return (
    <div className="mx-auto w-full max-w-7xl flex flex-col gap-6">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-[#0B0F19] px-6 py-8 shadow-2xl shadow-primary-900/10 ring-1 ring-slate-900/5 dark:bg-slate-950 dark:ring-white/10 sm:px-9 sm:py-9">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h1v1H0V0zm23 23h1v1h-1v-1z' fill='white'/%3E%3C/svg%3E\")", backgroundSize: "24px 24px" }}
        />
        <div className="pointer-events-none absolute -left-20 -top-20 h-[300px] w-[300px] rounded-full bg-primary-500/10 blur-[80px]" />

        <div className="relative z-10 max-w-2xl">
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
        {preset === "custom" && (
          <>
            <DatePickerField label="From" value={customFrom} onChange={(v) => setCustomFrom(v ?? "")} />
            <DatePickerField label="To" value={customTo} onChange={(v) => setCustomTo(v ?? "")} />
          </>
        )}
        <LocationBranchSelect
          locationId={locationId}
          branchId={branchId || undefined}
          onChange={({ locationId: nextLocationId, branchId: nextBranchId }) => {
            setLocationId(nextLocationId);
            setBranchId(nextBranchId ?? "");
          }}
        />
        <Select label="Trend granularity" value={granularity} onChange={(e) => setGranularity(e.target.value as Granularity)} className="min-w-[150px]">
          <option value="week">Weekly</option>
          <option value="month">Monthly</option>
          <option value="year">Yearly</option>
        </Select>
      </div>
      </Card>

      {/* KPI row with year-over-year deltas */}
      {!summary || !yoy ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2 rounded-xl border border-gray-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-6 w-14" />
            </div>
          ))}
        </div>
      ) : (
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
      )}

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
            title="Custom Download"
            subtitle="Combine any of these — e.g. Status = Retail + Source = Referral — and download only those customers"
            icon={<SlidersHorizontal size={20} />}
            iconClassName="bg-violet-50 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400"
          >
            <div className="flex flex-wrap items-end gap-4">
              <Select label="Status" value={customStatus} onChange={(e) => setCustomStatus(e.target.value)} className="min-w-[160px]">
                <option value="">Any status</option>
                {STATUS_ORDER.map((s) => (
                  <option key={s} value={s}>
                    {STAGE_LABELS[s]}
                  </option>
                ))}
              </Select>
              <Select label="Lead Source" value={customSource} onChange={(e) => setCustomSource(e.target.value)} className="min-w-[160px]">
                <option value="">Any source</option>
                {LEAD_SOURCES.map((s) => (
                  <option key={s} value={s}>
                    {s.replaceAll("_", " ")}
                  </option>
                ))}
              </Select>
              <Select label="Lead Type" value={customEnquiryType} onChange={(e) => setCustomEnquiryType(e.target.value)} className="min-w-[160px]">
                <option value="">Any type</option>
                {ENQUIRY_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t.replaceAll("_", " ")}
                  </option>
                ))}
              </Select>
              <Select label="Loss Reason" value={customLossReason} onChange={(e) => setCustomLossReason(e.target.value)} className="min-w-[160px]">
                <option value="">Any reason</option>
                {LOSS_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {LOSS_REASON_LABELS[r] ?? r.replaceAll("_", " ")}
                  </option>
                ))}
              </Select>
              <Input
                label="Mobile Number"
                placeholder="Search by mobile"
                value={customPhone}
                onChange={(e) => setCustomPhone(e.target.value)}
                className="min-w-[160px]"
              />
              <Button
                icon={<Download size={15} />}
                onClick={handleCustomDownload}
              >
                Download{customFilterCount > 0 ? ` (${customFilterCount} filters)` : ""}
              </Button>
            </div>
          </Section>

          <Section
            title="Status Breakdown"
            subtitle="Every case in the pipeline right now — click the download icon for that case's customer list"
            icon={<LayoutGrid size={20} />}
            iconClassName="bg-primary-50 text-primary-600 dark:bg-primary-500/20 dark:text-primary-400"
          >
            {!summary ? (
              <ReportSkeleton variant="table" rows={STATUS_ORDER.length} />
            ) : (
              <div className="flex flex-col gap-3">
                <TableSearch value={statusSearch} onChange={setStatusSearch} placeholder="Search status…" />
                {filteredStatusOrder.length === 0 && !showOverdueRow ? (
                  <p className="py-6 text-center text-sm text-gray-400 dark:text-slate-500">No status matches "{statusSearch}".</p>
                ) : (
                  <ChartTableToggle
                    table={
                      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-slate-800">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:bg-slate-800/50 dark:text-slate-400">
                            <tr>
                              <th className="px-4 py-2.5">Status</th>
                              <th className="px-4 py-2.5">Customers</th>
                              <th className="px-4 py-2.5">% of total</th>
                              <th className="px-4 py-2.5 text-right">Download</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                            {filteredStatusOrder.map((status) => {
                              const count = summary?.statusBreakdown[status] ?? 0;
                              const percent = summary?.totalEnquiries ? Math.round((count / summary.totalEnquiries) * 1000) / 10 : 0;
                              return (
                                <tr key={status} className="transition-colors hover:bg-primary-50/60 dark:hover:bg-primary-500/[0.06]">
                                  <td className="px-4 py-2.5 font-medium text-gray-900 dark:text-slate-100">{STAGE_LABELS[status] ?? status}</td>
                                  <td className="px-4 py-2.5 tabular-nums text-gray-700 dark:text-slate-300">{count}</td>
                                  <td className="px-4 py-2.5 tabular-nums text-gray-500 dark:text-slate-400">{percent}%</td>
                                  <td className="px-4 py-2.5 text-right">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      disabled={count === 0}
                                      icon={<Download size={14} />}
                                      onClick={() => openList(STAGE_LABELS[status] ?? status, STAGE_LABELS[status]?.toLowerCase().replace(/\s+/g, "-") ?? status.toLowerCase(), { status })}
                                    >
                                      Download
                                    </Button>
                                  </td>
                                </tr>
                              );
                            })}
                            {showOverdueRow && (
                              <tr className="bg-amber-50/60 transition-colors hover:bg-amber-100/70 dark:bg-amber-500/[0.06] dark:hover:bg-amber-500/[0.1]">
                                <td className="px-4 py-2.5 font-medium text-amber-800 dark:text-amber-300">Overdue</td>
                                <td className="px-4 py-2.5 tabular-nums text-amber-800 dark:text-amber-300">{summary?.overdue ?? 0}</td>
                                <td className="px-4 py-2.5 tabular-nums text-amber-700/80 dark:text-amber-400/80">
                                  {summary?.totalEnquiries
                                    ? Math.round(((summary.overdue ?? 0) / summary.totalEnquiries) * 1000) / 10
                                    : 0}
                                  %
                                </td>
                                <td className="px-4 py-2.5 text-right">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    disabled={!summary?.overdue}
                                    icon={<Download size={14} />}
                                    onClick={() => openList("Overdue", "overdue", { overdue: "true" })}
                                  >
                                    Download
                                  </Button>
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    }
                    chart={
                      <DonutChart
                        slices={filteredStatusOrder.filter((s) => (summary?.statusBreakdown[s] ?? 0) > 0).map(
                          (s): DonutSlice => ({
                            label: STAGE_LABELS[s] ?? s,
                            value: summary?.statusBreakdown[s] ?? 0,
                            valueLabel: String(summary?.statusBreakdown[s] ?? 0),
                          })
                        )}
                      />
                    }
                  />
                )}
              </div>
            )}
          </Section>

          <Section
            title="Trend"
            subtitle="Enquiry volume, conversions, and losses over time"
            icon={<TrendingUp size={20} />}
            iconClassName="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400"
          >
            {trend ? <TrendChart points={trend} /> : <ReportSkeleton variant="block" />}
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
              {funnel ? <FunnelChart stages={funnel} /> : <ReportSkeleton variant="block" />}
            </Section>

            <Section
              title="Time in Stage"
              subtitle="Average time enquiries spend at each stage before moving on"
              icon={<Clock size={20} />}
              iconClassName="bg-amber-50 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400"
            >
              {!timeInStage ? (
                <ReportSkeleton variant="bars" rows={6} />
              ) : (
                <div className="flex flex-col gap-3">
                  <TableSearch value={timeInStageSearch} onChange={setTimeInStageSearch} placeholder="Search stage…" />
                  {filteredTimeInStage.length === 0 ? (
                    <p className="py-6 text-center text-sm text-gray-400 dark:text-slate-500">No stage matches "{timeInStageSearch}".</p>
                  ) : (
                    <HBarList
                      rows={filteredTimeInStage.map((row) => ({
                        label: STAGE_LABELS[row.stage] ?? row.stage,
                        value: row.avgHours ?? 0,
                        fraction: (row.avgHours ?? 0) / maxStageHours,
                        valueLabel: row.avgHours != null ? formatHours(row.avgHours) : "—",
                      }))}
                    />
                  )}
                </div>
              )}
            </Section>
          </div>

          <Section
            title="Lost Reasons"
            subtitle="Why deals are being lost"
            icon={<ThumbsDown size={20} />}
            iconClassName="bg-red-50 text-red-600 dark:bg-red-500/20 dark:text-red-400"
          >
            {!lostReasons ? (
              <ReportSkeleton variant="bars" rows={5} />
            ) : lostReasons.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-slate-500">No lost enquiries with a recorded reason in this range.</p>
            ) : (
              <div className="flex flex-col gap-3">
                <TableSearch value={lostReasonSearch} onChange={setLostReasonSearch} placeholder="Search reason…" />
                {filteredLostReasons.length === 0 ? (
                  <p className="py-6 text-center text-sm text-gray-400 dark:text-slate-500">No reason matches "{lostReasonSearch}".</p>
                ) : (
                  <ChartTableToggle
                    table={
                      <HBarList
                        rows={filteredLostReasons.map((row) => ({
                          label: LOSS_REASON_LABELS[row.reason] ?? row.reason,
                          value: row.count,
                          fraction: row.count / maxLostCount,
                          valueLabel: `${row.count} (${row.percent}%)`,
                          onDownload: () =>
                            openList(`Lost — ${LOSS_REASON_LABELS[row.reason] ?? row.reason.replaceAll("_"," ")}`, `lost-${row.reason.toLowerCase().replace(/_/g, "-")}`, {
                              status: "LOST",
                              lossReason: row.reason,
                            }),
                        }))}
                      />
                    }
                    chart={
                      <DonutChart
                        slices={filteredLostReasons.map(
                          (row): DonutSlice => ({
                            label: LOSS_REASON_LABELS[row.reason] ?? row.reason,
                            value: row.count,
                            valueLabel: String(row.count),
                          })
                        )}
                      />
                    }
                  />
                )}
              </div>
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
            {!sources ? (
              <ReportSkeleton variant="table" rows={5} />
            ) : (
              <div className="flex flex-col gap-3">
                <TableSearch value={sourceSearch} onChange={setSourceSearch} placeholder="Search source…" />
                {filteredSources.length === 0 ? (
                  <p className="py-6 text-center text-sm text-gray-400 dark:text-slate-500">No source matches "{sourceSearch}".</p>
                ) : (
                  <ChartTableToggle
                    table={
                      <SourcePerformanceTable
                        rows={filteredSources}
                        onDownload={(source) => openList(`Source — ${source.replaceAll("_"," ")}`, `source-${source.toLowerCase().replace(/_/g, "-")}`, { source })}
                      />
                    }
                    chart={
                      <DonutChart
                        slices={filteredSources.map(
                          (row): DonutSlice => ({
                            label: row.source.replaceAll("_", " "),
                            value: row.total,
                            valueLabel: String(row.total),
                          })
                        )}
                      />
                    }
                  />
                )}
              </div>
            )}
          </Section>

          <Section
            title="Consultant Sales Performance"
            subtitle="Who is actually closing cars on the floor — sales, share of the total mix, and each consultant's best-selling model"
            icon={<Users size={20} />}
            iconClassName="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400"
          >
            {!consultantRows ? (
              <ReportSkeleton variant="table" rows={5} />
            ) : consultantRows.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-slate-500">No consultant activity in this range.</p>
            ) : (
              <div className="flex flex-col gap-3">
                <TableSearch value={consultantSearch} onChange={setConsultantSearch} placeholder="Search consultant…" />
                {filteredConsultantRows.length === 0 ? (
                  <p className="py-6 text-center text-sm text-gray-400 dark:text-slate-500">No consultant matches "{consultantSearch}".</p>
                ) : (
                  <ChartTableToggle
                    table={
                      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-slate-800">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:bg-slate-800/50 dark:text-slate-400">
                            <tr>
                              <th className="px-4 py-2.5">Consultant</th>
                              <th className="px-4 py-2.5">Handled</th>
                              <th className="px-4 py-2.5">Sold</th>
                              <th className="px-4 py-2.5">Conversion</th>
                              <th className="px-4 py-2.5">Share of Sales</th>
                              <th className="px-4 py-2.5">Top Model</th>
                              <th className="px-4 py-2.5">Status Breakdown</th>
                              <th className="px-4 py-2.5 text-right">Download</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                            {filteredConsultantRows.map((row) => (
                              <tr key={row.consultantId} className="transition-colors hover:bg-primary-50/60 dark:hover:bg-primary-500/[0.06]">
                                <td className="px-4 py-2.5 font-medium text-gray-900 dark:text-slate-100">{row.consultantName}</td>
                                <td className="px-4 py-2.5 tabular-nums text-gray-700 dark:text-slate-300">{row.handled}</td>
                                <td className="px-4 py-2.5 tabular-nums font-semibold text-emerald-600 dark:text-emerald-400">{row.sold}</td>
                                <td className="px-4 py-2.5 tabular-nums text-gray-700 dark:text-slate-300">{row.conversionRate}%</td>
                                <td className="px-4 py-2.5 tabular-nums text-gray-700 dark:text-slate-300">{row.shareOfSales}%</td>
                                <td className="px-4 py-2.5 text-gray-700 dark:text-slate-300" title={row.models.map((m) => `${m.carModel}: ${m.sold}`).join(", ")}>
                                  {row.topModel ?? "—"}
                                </td>
                                <td className="px-4 py-2.5">
                                  <StatusBreakdownCell statusBreakdown={row.statusBreakdown} />
                                </td>
                                <td className="px-4 py-2.5 text-right">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    icon={<Download size={14} />}
                                    onClick={() =>
                                      openList(
                                        `Consultant — ${row.consultantName}`,
                                        `consultant-${row.consultantName.toLowerCase().replace(/\s+/g, "-")}`,
                                        { consultantId: row.consultantId }
                                      )
                                    }
                                  >
                                    Download
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    }
                    chart={
                      filteredConsultantRows.some((r) => r.sold > 0) ? (
                        <DonutChart
                          slices={filteredConsultantRows
                            .filter((r) => r.sold > 0)
                            .map(
                              (row): DonutSlice => ({
                                label: row.consultantName,
                                value: row.sold,
                                valueLabel: String(row.sold),
                              })
                            )}
                        />
                      ) : (
                        <p className="text-sm text-gray-400 dark:text-slate-500">No sales in this range yet.</p>
                      )
                    }
                  />
                )}
              </div>
            )}
          </Section>

          <Section
            title="CR Team Performance"
            subtitle="Assigned enquiries and conversion rate per CR team member"
            icon={<Users size={20} />}
            iconClassName="bg-primary-50 text-primary-600 dark:bg-primary-500/20 dark:text-primary-400"
          >
            {!crRows ? (
              <ReportSkeleton variant="table" rows={5} />
            ) : (
              <div className="flex flex-col gap-3">
                <TableSearch value={crSearch} onChange={setCrSearch} placeholder="Search CR…" />
                {filteredCrRows.length === 0 ? (
                  <p className="py-6 text-center text-sm text-gray-400 dark:text-slate-500">No CR matches "{crSearch}".</p>
                ) : (
                  <ChartTableToggle
                    table={
                      <CrPerformanceTable
                        rows={filteredCrRows}
                        onDownload={(crId) => {
                          const cr = filteredCrRows.find((r) => r.crId === crId);
                          openList(`CR — ${cr?.crName ?? crId}`, `cr-${(cr?.crName ?? crId).toLowerCase().replace(/\s+/g, "-")}`, { assignedCrId: crId });
                        }}
                      />
                    }
                    chart={
                      filteredCrRows.some((r) => r.assigned > 0) ? (
                        <DonutChart
                          slices={filteredCrRows
                            .filter((r) => r.assigned > 0)
                            .map(
                              (row): DonutSlice => ({
                                label: row.crName,
                                value: row.assigned,
                                valueLabel: String(row.assigned),
                              })
                            )}
                        />
                      ) : (
                        <p className="text-sm text-gray-400 dark:text-slate-500">No CR activity in this range.</p>
                      )
                    }
                  />
                )}
              </div>
            )}
          </Section>

          {(!rollup || rollup.length > 1) && (
            <Section
              title="Branch Rollup"
              subtitle="Enquiry totals by branch"
              icon={<Building2 size={20} />}
              iconClassName="bg-primary-50 text-primary-600 dark:bg-primary-500/20 dark:text-primary-400"
            >
              {!rollup ? (
                <ReportSkeleton variant="table" rows={4} />
              ) : (
                <div className="flex flex-col gap-3">
                  <TableSearch value={branchSearch} onChange={setBranchSearch} placeholder="Search branch…" />
                  {filteredRollup.length === 0 ? (
                    <p className="py-6 text-center text-sm text-gray-400 dark:text-slate-500">No branch matches "{branchSearch}".</p>
                  ) : (
                    <ChartTableToggle
                      table={
                        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-slate-800">
                          <table className="w-full text-sm">
                            <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:bg-slate-800/50 dark:text-slate-400">
                              <tr>
                                <th className="px-4 py-2.5">Branch</th>
                                <th className="px-4 py-2.5">Total</th>
                                <th className="px-4 py-2.5">Converted</th>
                                <th className="px-4 py-2.5">Lost</th>
                                <th className="px-4 py-2.5 text-right">Download</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                              {filteredRollup.map((row) => (
                                <tr key={row.branchId} className="transition-colors hover:bg-primary-50/60 dark:hover:bg-primary-500/[0.06]">
                                  <td className="px-4 py-2.5 font-medium text-gray-900 dark:text-slate-100">{row.branchName}</td>
                                  <td className="px-4 py-2.5 tabular-nums text-gray-700 dark:text-slate-300">{row.total}</td>
                                  <td className="px-4 py-2.5 tabular-nums text-gray-700 dark:text-slate-300">{row.statusCounts["RETAIL_DONE"] ?? 0}</td>
                                  <td className="px-4 py-2.5 tabular-nums text-gray-700 dark:text-slate-300">{(row.statusCounts["LOST"] ?? 0) + (row.statusCounts["CLOSED"] ?? 0)}</td>
                                  <td className="px-4 py-2.5 text-right">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      icon={<Download size={14} />}
                                      onClick={() => openList(`Branch — ${row.branchName}`, `branch-${row.branchName.toLowerCase().replace(/\s+/g, "-")}`, { branchId: row.branchId })}
                                    >
                                      Download
                                    </Button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      }
                      chart={
                        <DonutChart
                          slices={filteredRollup.map(
                            (row): DonutSlice => ({
                              label: row.branchName,
                              value: row.total,
                              valueLabel: String(row.total),
                            })
                          )}
                        />
                      }
                    />
                  )}
                </div>
              )}
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
            <ChartTableToggle
              table={
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <StatTile label="Total Calls" value={callAnalysis.totalCalls} />
                  <StatTile label="Answer Rate" value={callAnalysis.answerRate} suffix="%" />
                  <StatTile label="No Answer" value={callAnalysis.noAnswer} />
                  <StatTile
                    label="Avg Duration"
                    value={callAnalysis.avgDurationSeconds != null ? `${Math.round(callAnalysis.avgDurationSeconds / 60)}m ${callAnalysis.avgDurationSeconds % 60}s` : "—"}
                  />
                </div>
              }
              chart={
                <DonutChart
                  slices={[
                    { label: "Answered", value: Math.max(callAnalysis.totalCalls - callAnalysis.noAnswer, 0), valueLabel: String(Math.max(callAnalysis.totalCalls - callAnalysis.noAnswer, 0)) },
                    { label: "No Answer", value: callAnalysis.noAnswer, valueLabel: String(callAnalysis.noAnswer) },
                  ]}
                />
              }
            />
          ) : (
            <ReportSkeleton variant="stats" />
          )}
        </Section>
      )}

      {tab === "referrals" && (
        <Section
          title="Referral Leads"
          subtitle="Leads that came in through Referral, and who referred them"
          icon={<UserPlus size={20} />}
          iconClassName="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400"
          actions={
            <Button
              size="sm"
              variant="ghost"
              icon={<Download size={14} />}
              disabled={!referralLeads || referralLeads.total === 0}
              onClick={() => openList("Referral leads", "referral-leads", { sourceCategory: "REFERRAL" })}
            >
              Download
            </Button>
          }
        >
          {!referralLeads ? (
            <div className="flex flex-col gap-4">
              <ReportSkeleton variant="stats" />
              <ReportSkeleton variant="table" rows={5} />
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatTile
                  label="Total Referral Leads"
                  value={referralLeads.total}
                  icon={<UserPlus size={20} />}
                  iconClassName="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400"
                />
                <StatTile
                  label="Converted"
                  value={referralConverted}
                  icon={<KeyRound size={20} />}
                  iconClassName="bg-primary-50 text-primary-600 dark:bg-primary-500/20 dark:text-primary-400"
                />
                <StatTile
                  label="Conversion Rate"
                  value={referralConversionRate}
                  suffix="%"
                  icon={<Percent size={20} />}
                  iconClassName="bg-violet-50 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400"
                />
                <StatTile
                  label="Lost"
                  value={referralLost}
                  upIsGood={false}
                  icon={<CircleX size={20} />}
                  iconClassName="bg-red-50 text-red-600 dark:bg-red-500/20 dark:text-red-400"
                />
              </div>
              {referralLeads.rows.length === 0 ? (
                <p className="text-sm text-gray-400 dark:text-slate-500">No referral leads in this range.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  <TableSearch
                    value={referralLeadSearch}
                    onChange={setReferralLeadSearch}
                    placeholder="Search name, phone, referrer, vehicle, branch…"
                  />
                  {filteredReferralLeads.length === 0 ? (
                    <p className="py-6 text-center text-sm text-gray-400 dark:text-slate-500">No referral leads match "{referralLeadSearch}".</p>
                  ) : (
                    <ChartTableToggle
                      table={
                        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-slate-800">
                          <table className="w-full text-sm">
                            <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:bg-slate-800/50 dark:text-slate-400">
                              <tr>
                                <th className="px-4 py-2.5">Lead</th>
                                <th className="px-4 py-2.5">Phone</th>
                                <th className="px-4 py-2.5">Referred By</th>
                                <th className="px-4 py-2.5">Referrer Mobile</th>
                                <th className="px-4 py-2.5">Vehicle</th>
                                <th className="px-4 py-2.5">Branch</th>
                                <th className="px-4 py-2.5">Status</th>
                                <th className="px-4 py-2.5">Date</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                              {filteredReferralLeads.map((row) => (
                                <tr key={row.id} className="transition-colors hover:bg-primary-50/60 dark:hover:bg-primary-500/[0.06]">
                                  <td className="px-4 py-2.5 font-medium text-gray-900 dark:text-slate-100">{row.name}</td>
                                  <td className="px-4 py-2.5 tabular-nums text-gray-700 dark:text-slate-300">{row.phone}</td>
                                  <td className="px-4 py-2.5 text-gray-700 dark:text-slate-300">{row.referrerName ?? "—"}</td>
                                  <td className="px-4 py-2.5 tabular-nums text-gray-700 dark:text-slate-300">{row.referrerPhone ?? "—"}</td>
                                  <td className="px-4 py-2.5 text-gray-700 dark:text-slate-300">{row.carModel}</td>
                                  <td className="px-4 py-2.5 text-gray-700 dark:text-slate-300">{row.branch}</td>
                                  <td className="px-4 py-2.5 text-gray-700 dark:text-slate-300">{(STAGE_LABELS[row.status] ?? row.status.replaceAll("_", " "))}</td>
                                  <td className="px-4 py-2.5 text-gray-700 dark:text-slate-300">{new Date(row.createdAt).toLocaleDateString()}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      }
                      chart={
                        <DonutChart
                          slices={(() => {
                            const counts = new Map<string, number>();
                            for (const row of filteredReferralLeads) counts.set(row.status, (counts.get(row.status) ?? 0) + 1);
                            return [...counts.entries()].map(([status, count]): DonutSlice => ({
                              label: STAGE_LABELS[status] ?? status.replaceAll("_", " "),
                              value: count,
                              valueLabel: String(count),
                            }));
                          })()}
                        />
                      }
                    />
                  )}
                </div>
              )}
            </div>
          )}
        </Section>
      )}

      {tab === "referrals" && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Section
            title="Top Referrers"
            subtitle="Who's sending the most referral leads"
            icon={<Users size={20} />}
            iconClassName="bg-primary-50 text-primary-600 dark:bg-primary-500/20 dark:text-primary-400"
          >
            {!referralPerformance ? (
              <ReportSkeleton variant="bars" rows={5} />
            ) : referralPerformance.topReferrers.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-slate-500">No referrals in this range.</p>
            ) : (
              <div className="flex flex-col gap-3">
                <TableSearch value={topReferrerSearch} onChange={setTopReferrerSearch} placeholder="Search referrer name or mobile…" />
                {filteredTopReferrers.length === 0 ? (
                  <p className="py-6 text-center text-sm text-gray-400 dark:text-slate-500">No referrers match "{topReferrerSearch}".</p>
                ) : (
                  <ChartTableToggle
                    table={
                      <HBarList
                        rows={filteredTopReferrers.map((r) => ({
                          label: r.referrerPhone ? `${r.referrerName} (${r.referrerPhone})` : r.referrerName,
                          value: r.count,
                          fraction: r.count / maxReferrerCount,
                          valueLabel: `${r.count} lead${r.count === 1 ? "" : "s"} · ${r.converted} converted`,
                          onDownload: () => openList(`Referrer — ${r.referrerName}`, `referrer-${(r.referrerPhone ?? r.referrerName).toLowerCase().replace(/\s+/g, "-")}`, {
                            sourceCategory: "REFERRAL",
                            referrerPhone: r.referrerPhone ?? undefined,
                            referrerName: r.referrerPhone ? undefined : r.referrerName,
                          }),
                        }))}
                      />
                    }
                    chart={
                      <DonutChart
                        slices={filteredTopReferrers.map(
                          (r): DonutSlice => ({
                            label: r.referrerPhone ? `${r.referrerName} (${r.referrerPhone})` : r.referrerName,
                            value: r.count,
                            valueLabel: String(r.count),
                          })
                        )}
                      />
                    }
                  />
                )}
              </div>
            )}
          </Section>

          <Section
            title="Most Referred Cars"
            subtitle="Which models referral leads are most interested in"
            icon={<Car size={20} />}
            iconClassName="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400"
          >
            {!referralPerformance ? (
              <ReportSkeleton variant="bars" rows={5} />
            ) : referralPerformance.topModels.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-slate-500">No referrals in this range.</p>
            ) : (
              <div className="flex flex-col gap-3">
                <TableSearch value={topModelSearch} onChange={setTopModelSearch} placeholder="Search vehicle model…" />
                {filteredTopModels.length === 0 ? (
                  <p className="py-6 text-center text-sm text-gray-400 dark:text-slate-500">No models match "{topModelSearch}".</p>
                ) : (
                  <ChartTableToggle
                    table={
                      <HBarList
                        rows={filteredTopModels.map((m) => ({
                          label: m.carModel,
                          value: m.count,
                          fraction: m.count / maxReferredModelCount,
                          valueLabel: `${m.count} lead${m.count === 1 ? "" : "s"} · ${m.converted} converted`,
                          onDownload: () => openList(`Referral — ${m.carModel}`, `referral-${m.carModel.toLowerCase().replace(/\s+/g, "-")}`, {
                            sourceCategory: "REFERRAL",
                            carModel: m.carModel,
                          }),
                        }))}
                      />
                    }
                    chart={
                      <DonutChart
                        slices={filteredTopModels.map(
                          (m): DonutSlice => ({ label: m.carModel, value: m.count, valueLabel: String(m.count) })
                        )}
                      />
                    }
                  />
                )}
              </div>
            )}
          </Section>
        </div>
      )}

      {preview && (
        <CustomerListModal
          isOpen
          onClose={() => setPreview(null)}
          title={preview.title}
          fileSuffix={preview.fileSuffix}
          filters={preview.filters}
        />
      )}
    </div>
  );
}
