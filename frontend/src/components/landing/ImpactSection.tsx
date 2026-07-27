import { Zap, ShieldCheck, Sparkles } from "lucide-react";
import { Reveal, Metric } from "./shared";

export function ImpactSection() {
  return (
    <section id="impact" className="relative scroll-mt-24 bg-white py-24 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-widest text-primary-600 dark:text-primary-400">Built for scale</span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">Numbers that move showrooms</h2>
        </Reveal>

        <div className="mt-14 grid grid-cols-2 gap-8 rounded-3xl border border-slate-200 bg-slate-50 p-10 sm:gap-6 lg:grid-cols-4 dark:border-white/10 dark:bg-white/[0.03]">
          <Metric value={6} label="Capture channels" />
          <Metric value={7} suffix=" stages" label="Enquiry → delivery" />
          <Metric value={100} suffix="%" label="Leads auto-routed" />
          <Metric value={24} suffix="/7" label="AI voice follow-ups" />
        </div>

        {/* Value strip */}
        <Reveal className="mt-8">
          <div className="grid gap-5 sm:grid-cols-3">
            {[
              { icon: <Zap size={18} />, title: "Instant routing", desc: "Leads reach a rep the moment they land — no cold, forgotten enquiries." },
              { icon: <ShieldCheck size={18} />, title: "Branch-scoped & secure", desc: "Role-based access keeps every branch's data cleanly isolated." },
              { icon: <Sparkles size={18} />, title: "AI that follows up", desc: "Voice and chat agents keep momentum going around the clock." },
            ].map((v) => (
              <div key={v.title} className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-white/[0.03]">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500/10 text-primary-600 dark:bg-primary-500/15 dark:text-primary-300">
                  {v.icon}
                </span>
                <h3 className="mt-4 font-semibold text-slate-900 dark:text-white">{v.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{v.desc}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
