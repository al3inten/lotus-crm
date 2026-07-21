import { Radio, Workflow, Bot, Car, Inbox, BarChart3 } from "lucide-react";
import { Reveal, handleSpotlight } from "./shared";

const FEATURES = [
  {
    icon: <Radio size={22} />,
    title: "Omnichannel lead capture",
    desc: "Meta Ads, WhatsApp, Instagram, Google Sheets, walk-ins and Voice AI flow into one deduplicated inbox — no enquiry ever slips through.",
    span: "lg:col-span-2",
    glow: "from-blue-500/25",
  },
  {
    icon: <Workflow size={22} />,
    title: "Smart round-robin routing",
    desc: "Every lead auto-assigns to the right Customer Rep by live workload — fair, instant, zero manual triage.",
    span: "",
    glow: "from-indigo-500/25",
  },
  {
    icon: <Bot size={22} />,
    title: "AI voice & chat follow-ups",
    desc: "An AI agent calls and messages leads, books test drives and logs every touch automatically.",
    span: "",
    glow: "from-cyan-500/25",
  },
  {
    icon: <Car size={22} />,
    title: "Enquiry-to-delivery pipeline",
    desc: "Quotation, exchange, finance, test drive and delivery — the full showroom journey tracked in one place.",
    span: "lg:col-span-2",
    glow: "from-blue-500/25",
  },
  {
    icon: <Inbox size={22} />,
    title: "Unified social inbox",
    desc: "Reply to WhatsApp and Instagram DMs and convert conversations into leads without leaving the CRM.",
    span: "",
    glow: "from-fuchsia-500/25",
  },
  {
    icon: <BarChart3 size={22} />,
    title: "Business analytics",
    desc: "Funnels, CR performance and conversion reporting — the numbers that move your showroom.",
    span: "",
    glow: "from-emerald-500/25",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="relative scroll-mt-24 bg-white py-24 dark:bg-slate-950">
      <div className="pointer-events-none absolute left-1/2 top-0 h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-blue-500/5 blur-[130px] dark:bg-blue-600/10" />
      <div className="relative mx-auto max-w-7xl px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-widest text-blue-600 dark:text-blue-400">Capabilities</span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
            One platform for the whole sales floor
          </h2>
          <p className="mt-4 text-slate-600 dark:text-slate-400">
            From the first ad click to the delivery bay — Lotus D-CRM runs the entire dealership
            enquiry lifecycle so your team can focus on selling.
          </p>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={(i % 3) * 0.08} className={f.span}>
              <div
                onMouseMove={handleSpotlight}
                className="spotlight-card group relative h-full overflow-hidden rounded-3xl border border-slate-200 bg-white p-7 transition-all duration-300 hover:-translate-y-1 hover:border-blue-300 hover:bg-slate-50/50 dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-white/20 dark:hover:bg-white/[0.05]"
              >
                <div
                  className={`pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-gradient-to-br ${f.glow} to-transparent opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100`}
                />
                <div className="relative">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/15 to-blue-500/5 text-blue-600 ring-1 ring-inset ring-blue-500/10 dark:from-blue-500/20 dark:text-blue-300 dark:ring-white/10">
                    {f.icon}
                  </span>
                  <h3 className="mt-5 text-lg font-semibold text-slate-900 dark:text-white">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{f.desc}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
