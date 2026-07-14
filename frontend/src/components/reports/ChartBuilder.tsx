import { useEffect, useMemo, useRef, useState } from "react";
import { BarChart3, PieChart, ChevronDown, Check } from "lucide-react";
import { useBreakdownReport } from "../../hooks/useReports";
import type { BreakdownDimension, BreakdownMeasure, ReportFilters } from "../../api/reports.api";
import { HBarList } from "./HBarList";
import { DonutChart } from "./DonutChart";
import { CATEGORICAL, VIZ } from "./vizTheme";
import { Select } from "../common/Input";
import { cn } from "../../lib/utils";

// Every field the enquiry data can be grouped by, with a human label for the dropdown.
const DIMENSIONS: { value: BreakdownDimension; label: string }[] = [
  { value: "source", label: "Lead Source" },
  { value: "enquiryType", label: "Enquiry Type" },
  { value: "status", label: "Status" },
  { value: "department", label: "Department" },
  { value: "subsource", label: "Sub-source" },
  { value: "sourceCategory", label: "Source Category" },
  { value: "enquiryCategory", label: "Lead Temperature (Hot/Warm/Cold)" },
  { value: "lossReason", label: "Loss Reason" },
  { value: "carModel", label: "Car Model" },
  { value: "variant", label: "Variant" },
  { value: "financeRequired", label: "Finance Required" },
  { value: "callOutcome", label: "Call Outcome" },
  { value: "response", label: "AI Call Response" },
  { value: "nextAction", label: "Next Action" },
  { value: "assignedCr", label: "Assigned CR" },
  { value: "branch", label: "Branch" },
];

const MEASURES: { value: BreakdownMeasure; label: string; isRate?: boolean }[] = [
  { value: "total", label: "Enquiry count" },
  { value: "converted", label: "Converted" },
  { value: "conversionRate", label: "Conversion rate", isRate: true },
  { value: "lost", label: "Lost" },
];

// Dimensions whose raw values are enums we prettify (META_ADS → "Meta Ads"). The rest
// (CR/branch/finance names, free-text car model/variant) already arrive display-ready.
const ENUM_DIMENSIONS = new Set<BreakdownDimension>([
  "source",
  "enquiryType",
  "status",
  "department",
  "subsource",
  "sourceCategory",
  "enquiryCategory",
  "lossReason",
  "callOutcome",
  "response",
  "nextAction",
]);

const prettify = (raw: string) =>
  raw
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");

type ViewMode = "bar" | "donut";

export function ChartBuilder({ filters }: { filters: ReportFilters }) {
  const [dimension, setDimension] = useState<BreakdownDimension>("source");
  const [measure, setMeasure] = useState<BreakdownMeasure>("total");
  const [view, setView] = useState<ViewMode>("bar");

  const measureDef = MEASURES.find((m) => m.value === measure)!;
  // A donut implies part-to-whole; conversion RATES don't sum to a whole, so we pin
  // rate views to bars and disable the donut toggle rather than draw a misleading ring.
  const donutAllowed = !measureDef.isRate;
  const effectiveView: ViewMode = donutAllowed ? view : "bar";

  const { data, isFetching } = useBreakdownReport({ ...filters, dimension });

  const rows = useMemo(() => {
    if (!data) return [];
    return data.map((row) => {
      const value =
        measure === "total"
          ? row.total
          : measure === "converted"
            ? row.converted
            : measure === "lost"
              ? row.lost
              : row.conversionRate;
      const label = ENUM_DIMENSIONS.has(dimension) ? prettify(row.label) : row.label;
      const valueLabel = measureDef.isRate ? `${value}%` : value.toLocaleString();
      return { key: row.key, label, value, valueLabel };
    });
  }, [data, measure, dimension, measureDef.isRate]);

  const maxValue = Math.max(1, ...rows.map((r) => r.value));
  const dimensionLabel = DIMENSIONS.find((d) => d.value === dimension)!.label;

  return (
    <div className="flex flex-col gap-4">
      {/* Controls */}
      <div className="flex flex-wrap items-end gap-3">
        <DimensionDropdown value={dimension} onChange={setDimension} />
        <Select
          label="Measure"
          value={measure}
          onChange={(e) => setMeasure(e.target.value as BreakdownMeasure)}
          className="min-w-[160px]"
        >
          {MEASURES.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </Select>

        <div className="flex items-center gap-1 rounded-lg border border-gray-200 p-0.5">
          <ViewButton active={effectiveView === "bar"} onClick={() => setView("bar")} icon={<BarChart3 size={15} />} label="Bar" />
          <ViewButton
            active={effectiveView === "donut"}
            onClick={() => donutAllowed && setView("donut")}
            icon={<PieChart size={15} />}
            label="Donut"
            disabled={!donutAllowed}
            title={donutAllowed ? undefined : "Donut isn't available for rates — they don't sum to a whole."}
          />
        </div>
      </div>

      {/* Chart */}
      <div className={cn("min-h-[200px] transition-opacity", isFetching && "opacity-60")}>
        {rows.length === 0 ? (
          <p className="py-10 text-center text-sm text-gray-400">
            {isFetching ? "Loading…" : `No enquiries to break down by ${dimensionLabel.toLowerCase()} in this range.`}
          </p>
        ) : effectiveView === "bar" ? (
          <HBarList
            color={measure === "lost" ? VIZ.series6 : measure === "converted" ? VIZ.series2 : CATEGORICAL.light[0]}
            rows={rows.map((r) => ({
              label: r.label,
              value: r.value,
              fraction: r.value / maxValue,
              valueLabel: r.valueLabel,
            }))}
          />
        ) : (
          <DonutChart slices={rows.map((r) => ({ label: r.label, value: r.value, valueLabel: r.valueLabel }))} />
        )}
      </div>
    </div>
  );
}

/**
 * Custom "Group by" dropdown. A native <select> popup can't be given a fixed height or
 * scrollbar via CSS, so with 16 dimensions we render our own panel: a fixed max-height,
 * scrollable list styled to match the shared Select. Closes on outside-click or Escape.
 */
function DimensionDropdown({
  value,
  onChange,
}: {
  value: BreakdownDimension;
  onChange: (value: BreakdownDimension) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = DIMENSIONS.find((d) => d.value === value)!;

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative flex flex-col gap-1 text-sm">
      <span className="font-semibold text-slate-700 dark:text-slate-300">Group by</span>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          "flex min-w-[210px] items-center justify-between gap-2 rounded-lg border px-3 py-2.5 text-left text-sm shadow-sm transition-all",
          "bg-white text-slate-900 dark:bg-slate-950 dark:text-white",
          "border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        )}
      >
        <span className="truncate">{selected.label}</span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-slate-400 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute left-0 top-full z-30 mt-1 max-h-56 w-full min-w-[210px] overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-900"
        >
          {DIMENSIONS.map((d) => {
            const active = d.value === value;
            return (
              <li key={d.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => {
                    onChange(d.value);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm transition-colors",
                    active
                      ? "bg-blue-50 font-medium text-blue-700 dark:bg-blue-500/10 dark:text-blue-300"
                      : "text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                  )}
                >
                  <span className="truncate">{d.label}</span>
                  {active && <Check className="h-4 w-4 shrink-0" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function ViewButton({
  active,
  onClick,
  icon,
  label,
  disabled,
  title,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  disabled?: boolean;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-pressed={active}
      className={cn(
        "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
        active ? "bg-blue-600 text-white shadow-sm" : "text-gray-600 hover:bg-gray-100",
        disabled && "cursor-not-allowed opacity-40 hover:bg-transparent"
      )}
    >
      {icon}
      {label}
    </button>
  );
}
