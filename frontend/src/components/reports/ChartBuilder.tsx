import { useEffect, useMemo, useRef, useState } from "react";
import { BarChart3, PieChart, Table2, ChevronDown, Check, X } from "lucide-react";
import { useBreakdownReport, useBreakdown2DReport } from "../../hooks/useReports";
import type { BreakdownDimension, BreakdownMeasure, ReportFilters } from "../../api/reports.api";
import { HBarList } from "./HBarList";
import { DonutChart } from "./DonutChart";
import { StackedHBarList } from "./StackedHBarList";
import { CATEGORICAL, VIZ, useIsDarkMode } from "./vizTheme";
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

const label = (dimension: BreakdownDimension, raw: string) => (ENUM_DIMENSIONS.has(dimension) ? prettify(raw) : raw);

type ViewMode = "bar" | "donut" | "table";
const NONE = "__none__" as const;
type SplitOption = BreakdownDimension | typeof NONE;

export function ChartBuilder({ filters }: { filters: ReportFilters }) {
  const isDark = useIsDarkMode();
  const palette = isDark ? CATEGORICAL.dark : CATEGORICAL.light;
  const [dimension, setDimension] = useState<BreakdownDimension>("source");
  const [splitBy, setSplitBy] = useState<SplitOption>(NONE);
  const [measure, setMeasure] = useState<BreakdownMeasure>("total");
  const [view, setView] = useState<ViewMode>("bar");

  // Split-by can't coexist with whatever's currently picked as the primary dimension.
  useEffect(() => {
    if (splitBy === dimension) setSplitBy(NONE);
  }, [dimension, splitBy]);

  const splitActive = splitBy !== NONE;
  const measureDef = MEASURES.find((m) => m.value === measure)!;
  // A donut implies part-to-whole; conversion RATES don't sum to a whole, and a stacked
  // split has two dimensions to show at once — neither fits in a single ring.
  const donutAllowed = !measureDef.isRate && !splitActive;
  const effectiveView: ViewMode = !donutAllowed && view === "donut" ? "bar" : view;

  const { data: flatData, isFetching: flatFetching } = useBreakdownReport({ ...filters, dimension }, !splitActive || effectiveView === "table");
  const { data: splitData, isFetching: splitFetching } = useBreakdown2DReport(
    { ...filters, dimension, splitBy: splitActive ? splitBy : "source" },
    splitActive
  );
  const isFetching = splitActive ? splitFetching : flatFetching;

  const rows = useMemo(() => {
    if (!flatData) return [];
    return flatData.map((row) => {
      const value =
        measure === "total"
          ? row.total
          : measure === "converted"
            ? row.converted
            : measure === "lost"
              ? row.lost
              : row.conversionRate;
      const rowLabel = label(dimension, row.label);
      const valueLabel = measureDef.isRate ? `${value}%` : value.toLocaleString();
      return { key: row.key, label: rowLabel, value, valueLabel };
    });
  }, [flatData, measure, dimension, measureDef.isRate]);

  const maxValue = Math.max(1, ...rows.map((r) => r.value));
  const dimensionLabel = DIMENSIONS.find((d) => d.value === dimension)!.label;

  // Stacked-view legend/segment colors — fixed slot order per series key, "Other" always
  // the muted deEmphasis gray regardless of slot.
  const seriesColor = (key: string, index: number) =>
    key === "__other__" ? VIZ.deEmphasis : palette[index % palette.length];

  const stackedRows = useMemo(() => {
    if (!splitData) return [];
    return splitData.rows.map((row) => ({
      label: label(dimension, row.label),
      total: row.total,
      segments: splitData.series.map((s, i) => ({
        key: s.key,
        label: label(splitBy === NONE ? dimension : splitBy, s.label),
        value: row.bySplit[s.key] ?? 0,
        color: seriesColor(s.key, i),
      })),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [splitData, dimension, splitBy, palette]);

  const legend = useMemo(() => {
    if (!splitData) return [];
    return splitData.series.map((s, i) => ({
      key: s.key,
      label: label(splitBy === NONE ? dimension : splitBy, s.label),
      color: seriesColor(s.key, i),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [splitData, dimension, splitBy, palette]);

  return (
    <div className="flex flex-col gap-4">
      {/* Controls */}
      <div className="flex flex-wrap items-end gap-3">
        <DimensionDropdown
          fieldLabel="Group by"
          value={dimension}
          onChange={(v) => v !== NONE && setDimension(v)}
          options={DIMENSIONS}
        />
        <DimensionDropdown
          fieldLabel="Split by (optional)"
          value={splitBy}
          onChange={setSplitBy}
          options={DIMENSIONS.filter((d) => d.value !== dimension)}
          clearable
        />
        <Select
          label="Measure"
          value={measure}
          onChange={(e) => setMeasure(e.target.value as BreakdownMeasure)}
          disabled={splitActive}
          title={splitActive ? "Stacked split view always shows enquiry counts" : undefined}
          className="min-w-[160px]"
        >
          {MEASURES.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </Select>

        <div className="flex items-center gap-1 rounded-lg border border-gray-200 p-0.5 dark:border-slate-700">
          <ViewButton active={effectiveView === "bar"} onClick={() => setView("bar")} icon={<BarChart3 size={15} />} label="Bar" />
          <ViewButton
            active={effectiveView === "donut"}
            onClick={() => donutAllowed && setView("donut")}
            icon={<PieChart size={15} />}
            label="Donut"
            disabled={!donutAllowed}
            title={
              !donutAllowed
                ? splitActive
                  ? "Donut isn't available for a split-by comparison — use bars or a table."
                  : "Donut isn't available for rates — they don't sum to a whole."
                : undefined
            }
          />
          <ViewButton active={effectiveView === "table"} onClick={() => setView("table")} icon={<Table2 size={15} />} label="Table" />
        </div>
      </div>
      {splitActive && (
        <p className="-mt-2 text-xs text-gray-400 dark:text-slate-500">
          Showing enquiry counts of <span className="font-medium text-gray-600 dark:text-slate-300">{dimensionLabel}</span> split by{" "}
          <span className="font-medium text-gray-600 dark:text-slate-300">
            {DIMENSIONS.find((d) => d.value === splitBy)?.label}
          </span>
          .
        </p>
      )}

      {/* Chart */}
      <div className={cn("min-h-[200px] transition-opacity", isFetching && "opacity-60")}>
        {splitActive ? (
          stackedRows.length === 0 ? (
            <p className="py-10 text-center text-sm text-gray-400 dark:text-slate-500">
              {isFetching ? "Loading…" : `No enquiries to break down by ${dimensionLabel.toLowerCase()} in this range.`}
            </p>
          ) : effectiveView === "table" ? (
            <PivotTable dimensionLabel={dimensionLabel} rows={stackedRows} legend={legend} />
          ) : (
            <StackedHBarList rows={stackedRows} legend={legend} />
          )
        ) : rows.length === 0 ? (
          <p className="py-10 text-center text-sm text-gray-400 dark:text-slate-500">
            {isFetching ? "Loading…" : `No enquiries to break down by ${dimensionLabel.toLowerCase()} in this range.`}
          </p>
        ) : effectiveView === "table" ? (
          <FlatTable dimensionLabel={dimensionLabel} rows={flatData ?? []} dimension={dimension} />
        ) : effectiveView === "bar" ? (
          <HBarList
            color={measure === "lost" ? VIZ.series6 : measure === "converted" ? VIZ.series2 : palette[0]}
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

/** Exact-numbers table for the single-dimension view — every measure at once, since a
 * dense dataset (dozens of car models, many CRs) is easier to scan as a table than bars. */
function FlatTable({
  dimensionLabel,
  rows,
  dimension,
}: {
  dimensionLabel: string;
  rows: { key: string; label: string; total: number; converted: number; lost: number; conversionRate: number }[];
  dimension: BreakdownDimension;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-slate-800">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:bg-slate-800/50 dark:text-slate-400">
          <tr>
            <th className="px-4 py-2">{dimensionLabel}</th>
            <th className="px-4 py-2">Total</th>
            <th className="px-4 py-2">Converted</th>
            <th className="px-4 py-2">Lost</th>
            <th className="px-4 py-2">Conversion Rate</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
          {rows.map((row) => (
            <tr key={row.key} className="transition-colors hover:bg-primary-50/60 dark:hover:bg-primary-500/[0.06]">
              <td className="px-4 py-2 font-medium text-gray-900 dark:text-slate-100">{label(dimension, row.label)}</td>
              <td className="px-4 py-2 tabular-nums text-gray-700 dark:text-slate-300">{row.total.toLocaleString()}</td>
              <td className="px-4 py-2 tabular-nums text-gray-700 dark:text-slate-300">{row.converted.toLocaleString()}</td>
              <td className="px-4 py-2 tabular-nums text-gray-700 dark:text-slate-300">{row.lost.toLocaleString()}</td>
              <td className="px-4 py-2 tabular-nums text-gray-700 dark:text-slate-300">{row.conversionRate}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Pivot table for the split-by view — rows = primary dimension, columns = split series. */
function PivotTable({
  dimensionLabel,
  rows,
  legend,
}: {
  dimensionLabel: string;
  rows: { label: string; total: number; segments: { key: string; label: string; value: number }[] }[];
  legend: { key: string; label: string }[];
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-slate-800">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:bg-slate-800/50 dark:text-slate-400">
          <tr>
            <th className="px-4 py-2">{dimensionLabel}</th>
            {legend.map((s) => (
              <th key={s.key} className="px-4 py-2 whitespace-nowrap">
                {s.label}
              </th>
            ))}
            <th className="px-4 py-2">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
          {rows.map((row) => (
            <tr key={row.label} className="transition-colors hover:bg-primary-50/60 dark:hover:bg-primary-500/[0.06]">
              <td className="px-4 py-2 font-medium text-gray-900 dark:text-slate-100">{row.label}</td>
              {legend.map((s) => {
                const seg = row.segments.find((seg) => seg.key === s.key);
                return (
                  <td key={s.key} className="px-4 py-2 tabular-nums text-gray-700 dark:text-slate-300">
                    {(seg?.value ?? 0).toLocaleString()}
                  </td>
                );
              })}
              <td className="px-4 py-2 tabular-nums font-medium text-gray-900 dark:text-slate-100">{row.total.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Custom "Group by" / "Split by" dropdown. A native <select> popup can't be given a fixed
 * height or scrollbar via CSS, so with 16 dimensions we render our own panel: a fixed
 * max-height, scrollable list styled to match the shared Select. Closes on outside-click
 * or Escape. `clearable` adds a "None" option and an inline clear (×) button.
 */
function DimensionDropdown({
  fieldLabel,
  value,
  onChange,
  options,
  clearable,
}: {
  fieldLabel: string;
  value: SplitOption;
  onChange: (value: SplitOption) => void;
  options: { value: BreakdownDimension; label: string }[];
  clearable?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = options.find((d) => d.value === value);

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
      <span className="font-semibold text-slate-700 dark:text-slate-300">{fieldLabel}</span>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          "flex min-w-[210px] items-center justify-between gap-2 rounded-lg border px-3 py-2.5 text-left text-sm shadow-sm transition-all",
          "bg-white text-slate-900 dark:bg-slate-950 dark:text-white",
          "border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
        )}
      >
        <span className="truncate">{selected ? selected.label : "None"}</span>
        <span className="flex shrink-0 items-center gap-1">
          {clearable && selected && (
            <span
              role="button"
              tabIndex={-1}
              onClick={(e) => {
                e.stopPropagation();
                onChange(NONE);
              }}
              className="rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
              aria-label="Clear"
            >
              <X className="h-3.5 w-3.5" />
            </span>
          )}
          <ChevronDown className={cn("h-4 w-4 text-slate-400 transition-transform", open && "rotate-180")} />
        </span>
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute left-0 top-full z-30 mt-1 max-h-56 w-full min-w-[210px] overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-900"
        >
          {clearable && (
            <li>
              <button
                type="button"
                role="option"
                aria-selected={value === NONE}
                onClick={() => {
                  onChange(NONE);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm transition-colors",
                  value === NONE
                    ? "bg-primary-50 font-medium text-primary-700 dark:bg-primary-500/10 dark:text-primary-300"
                    : "text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                )}
              >
                <span className="truncate text-slate-400">None</span>
                {value === NONE && <Check className="h-4 w-4 shrink-0" />}
              </button>
            </li>
          )}
          {options.map((d) => {
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
                      ? "bg-primary-50 font-medium text-primary-700 dark:bg-primary-500/10 dark:text-primary-300"
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
        active ? "bg-primary-600 text-white shadow-sm" : "text-gray-600 hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-800",
        disabled && "cursor-not-allowed opacity-40 hover:bg-transparent dark:hover:bg-transparent"
      )}
    >
      {icon}
      {label}
    </button>
  );
}
