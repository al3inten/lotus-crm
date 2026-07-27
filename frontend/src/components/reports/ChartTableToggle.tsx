import { useState } from "react";
import { Table2, PieChart } from "lucide-react";
import clsx from "clsx";

/**
 * Wraps a section's content with a Table/Chart switch — table is the default (denser,
 * has the download actions), chart is opt-in for a quick part-to-whole read. Keeps its
 * own toggle state so callers just pass both renderings; nothing lifts to the page.
 */
export function ChartTableToggle({ table, chart }: { table: React.ReactNode; chart: React.ReactNode }) {
  const [mode, setMode] = useState<"table" | "chart">("table");

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-1 self-start rounded-lg bg-slate-100 p-1 dark:bg-slate-800/60">
        <button
          type="button"
          onClick={() => setMode("table")}
          aria-pressed={mode === "table"}
          className={clsx(
            "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-colors",
            mode === "table"
              ? "bg-white text-primary-700 shadow-sm dark:bg-slate-900 dark:text-primary-400"
              : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
          )}
        >
          <Table2 size={13} />
          Table
        </button>
        <button
          type="button"
          onClick={() => setMode("chart")}
          aria-pressed={mode === "chart"}
          className={clsx(
            "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-colors",
            mode === "chart"
              ? "bg-white text-primary-700 shadow-sm dark:bg-slate-900 dark:text-primary-400"
              : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
          )}
        >
          <PieChart size={13} />
          Chart
        </button>
      </div>
      {mode === "table" ? table : <div className="flex items-center justify-center py-4">{chart}</div>}
    </div>
  );
}
