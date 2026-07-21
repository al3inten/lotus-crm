import { Megaphone, MessageCircle, Camera, Table, Footprints, Mic } from "lucide-react";
import { Reveal } from "./shared";

const CHANNELS = [
  { icon: <Megaphone size={16} />, label: "Meta Ads" },
  { icon: <MessageCircle size={16} />, label: "WhatsApp" },
  { icon: <Camera size={16} />, label: "Instagram" },
  { icon: <Table size={16} />, label: "Google Sheets" },
  { icon: <Footprints size={16} />, label: "Walk-in" },
  { icon: <Mic size={16} />, label: "Voice AI" },
];

export function ChannelBand() {
  return (
    <section id="channels" className="relative border-y border-slate-200 bg-white py-12 dark:border-white/5 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl px-6">
        <Reveal className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400 dark:text-slate-500">
            Capturing leads from every channel
          </p>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="mt-7 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
            <div className="flex w-max animate-marquee gap-3 sm:gap-4">
              {[...CHANNELS, ...CHANNELS].map((c, i) => (
                <span
                  key={`${c.label}-${i}`}
                  className="inline-flex shrink-0 items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:border-blue-300 hover:text-blue-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300 dark:hover:border-white/20 dark:hover:text-white"
                >
                  <span className="text-blue-500 dark:text-blue-400">{c.icon}</span>
                  {c.label}
                </span>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
