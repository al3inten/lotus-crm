import clsx from "clsx";
import { Reveal } from "./shared";
import { STEPS } from "./PipelineSection";

export function ProductPreview() {
  return (
    <section id="preview" className="relative z-10 -mt-24 scroll-mt-24 px-6 pb-10 sm:-mt-28 sm:pb-16">
      <Reveal className="mx-auto max-w-5xl">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10 dark:border-white/10 dark:bg-slate-900 dark:shadow-black/40">
          {/* browser chrome */}
          <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-slate-950/60">
            <span className="h-3 w-3 rounded-full bg-red-400" />
            <span className="h-3 w-3 rounded-full bg-amber-400" />
            <span className="h-3 w-3 rounded-full bg-emerald-400" />
            <span className="ml-3 flex-1 truncate rounded-md bg-white px-3 py-1 text-center text-xs text-slate-400 dark:bg-white/5 dark:text-slate-500">
              lotuscrm.app/pipeline
            </span>
          </div>
          {/* abstract dashboard illustration — a stylized mock, not a real screenshot */}
          <div className="grid grid-cols-1 gap-4 bg-slate-50/50 p-4 dark:bg-slate-950/40 sm:p-6 lg:grid-cols-[220px_1fr]">
            <div className="hidden flex-col gap-1 lg:flex">
              {["Dashboard", "Leads", "Pipeline", "Inbox", "Analytics"].map((item, i) => (
                <div
                  key={item}
                  className={clsx(
                    "flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium",
                    i === 2 ? "bg-blue-600 text-white" : "text-slate-500 dark:text-slate-400"
                  )}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  {item}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {STEPS.slice(0, 4).map((s) => (
                <div key={s.title} className="rounded-xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-white/[0.03]">
                  <p className="truncate text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">{s.title}</p>
                  <div className="mt-2 space-y-2">
                    {[1, 2].map((n) => (
                      <div key={n} className="rounded-lg bg-slate-100 p-2 dark:bg-white/5">
                        <div className="h-2 w-3/4 rounded-full bg-slate-300 dark:bg-white/15" />
                        <div className="mt-1.5 h-2 w-1/2 rounded-full bg-slate-200 dark:bg-white/10" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
