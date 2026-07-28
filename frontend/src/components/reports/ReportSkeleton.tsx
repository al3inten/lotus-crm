import { Skeleton } from "../ui/skeleton";

/** Loading placeholder for a Reports section — shape matches what's about to render
 * (table rows, horizontal bars, a donut, or a stat-tile grid) so the page doesn't jump
 * around once data arrives. */
export function ReportSkeleton({ variant = "bars", rows = 4 }: { variant?: "table" | "bars" | "chart" | "stats" | "block"; rows?: number }) {
  if (variant === "block") {
    return <Skeleton className="h-64 w-full" />;
  }

  if (variant === "stats") {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2 rounded-xl border border-gray-100 p-4 dark:border-slate-800">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-6 w-14" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === "chart") {
    return (
      <div className="flex flex-col items-center gap-4 py-4">
        <Skeleton className="h-48 w-48 rounded-full" />
        <div className="flex flex-wrap justify-center gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-3 w-16" />
          ))}
        </div>
      </div>
    );
  }

  if (variant === "table") {
    return (
      <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-slate-800">
        <div className="border-b border-gray-100 bg-gray-50 px-4 py-2.5 dark:border-slate-800 dark:bg-slate-800/50">
          <Skeleton className="h-3 w-full max-w-md" />
        </div>
        <div className="divide-y divide-gray-100 dark:divide-slate-800">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3">
              <Skeleton className="h-3.5 w-1/4" />
              <Skeleton className="h-3.5 w-1/6" />
              <Skeleton className="h-3.5 w-1/6" />
              <Skeleton className="h-3.5 flex-1" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // "bars" — mirrors HBarList's shape (label + horizontal bar of varying width).
  const widths = ["85%", "65%", "45%", "30%", "20%"];
  return (
    <div className="flex flex-col gap-2.5">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="grid grid-cols-[10rem_1fr] items-center gap-3">
          <Skeleton className="ml-auto h-3 w-24" />
          <Skeleton className="h-4" style={{ width: widths[i % widths.length] }} />
        </div>
      ))}
    </div>
  );
}
