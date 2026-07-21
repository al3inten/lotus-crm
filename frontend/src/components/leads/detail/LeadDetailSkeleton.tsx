import clsx from "clsx";

const SKELETON =
  "animate-pulse rounded-2xl border border-slate-200/70 bg-white dark:border-white/[0.07] dark:bg-[#0E1015]";

const HAIRLINE = "border-slate-200/70 dark:border-white/[0.07]";

const PULSE = "animate-pulse rounded-md bg-slate-100 dark:bg-white/[0.05]";

export function LeadDetailSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-[1360px] flex-col gap-6 px-4 pb-16 sm:px-6 lg:px-8">
      <div className={clsx(SKELETON, "overflow-hidden")}>
        <div className="h-16 bg-slate-50 dark:bg-white/[0.02] sm:h-20" />
        <div className="px-5 pb-5">
          <div className="flex items-center gap-3 pb-4">
            <div className="-mt-8 h-16 w-16 shrink-0 rounded-full bg-slate-100 ring-4 ring-white dark:bg-white/[0.05] dark:ring-[#0E1015] sm:-mt-9 sm:h-[72px] sm:w-[72px]" />
            <div className="flex flex-col gap-2 pt-2">
              <div className={clsx(PULSE, "h-5 w-44")} />
              <div className={clsx(PULSE, "h-3.5 w-28")} />
            </div>
          </div>
          <div className={clsx("grid grid-cols-2 gap-x-6 gap-y-4 border-t pt-4 sm:grid-cols-5", HAIRLINE)}>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex flex-col gap-1.5">
                <div className={clsx(PULSE, "h-3 w-16")} />
                <div className={clsx(PULSE, "h-4 w-24")} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={clsx(SKELETON, "h-40")} />

      <div className="flex items-center gap-2">
        <div className={clsx(PULSE, "h-8 w-28 rounded-lg")} />
        <div className={clsx(PULSE, "h-8 w-24 rounded-lg")} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className={clsx(SKELETON, "h-64 lg:col-span-1")} />
        <div className={clsx(SKELETON, "h-64 lg:col-span-2")} />
      </div>
    </div>
  );
}
