import { MousePointerClick, Split, PhoneCall, Car, ClipboardCheck, KeyRound } from "lucide-react";
import { Reveal } from "./shared";

export const STEPS = [
  { icon: <MousePointerClick size={18} />, title: "Capture", desc: "Lead lands from any channel" },
  { icon: <Split size={18} />, title: "Auto-assign", desc: "Round-robin to the right CR" },
  { icon: <PhoneCall size={18} />, title: "Follow up", desc: "Calls, WhatsApp & AI nudges" },
  { icon: <Car size={18} />, title: "Test drive", desc: "Schedule & capture feedback" },
  { icon: <ClipboardCheck size={18} />, title: "Booking", desc: "Quotation, finance & exchange" },
  { icon: <KeyRound size={18} />, title: "Delivery", desc: "Key handover, deal closed" },
];

export function PipelineSection() {
  return (
    <section id="pipeline" className="relative scroll-mt-24 border-y border-slate-200 bg-slate-50 py-24 dark:border-white/5 dark:bg-slate-900/40">
      <div className="mx-auto max-w-7xl px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-widest text-primary-600 dark:text-primary-400">The journey</span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
            From enquiry to key handover
          </h2>
          <p className="mt-4 text-slate-600 dark:text-slate-400">
            Every enquiry moves through a clear, trackable pipeline — with the right person and
            the right action at every stage.
          </p>
        </Reveal>

        <div className="relative mt-16">
          {/* connecting line */}
          <div className="absolute left-0 right-0 top-7 hidden h-px bg-slate-300 lg:block dark:bg-white/15" />
          <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-6">
            {STEPS.map((s, i) => (
              <Reveal key={s.title} delay={i * 0.07} className="relative text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-white text-primary-600 dark:border-white/10 dark:bg-slate-950 dark:text-primary-300">
                  {s.icon}
                </div>
                <div className="mt-2 text-xs font-semibold uppercase tracking-wider text-primary-600/80 dark:text-primary-400/80">
                  Step {i + 1}
                </div>
                <h3 className="mt-1 text-base font-semibold text-slate-900 dark:text-white">{s.title}</h3>
                <p className="mx-auto mt-1 max-w-[9rem] text-xs leading-relaxed text-slate-500 dark:text-slate-400">{s.desc}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
