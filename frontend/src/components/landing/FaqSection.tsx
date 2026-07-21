import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import { Plus } from "lucide-react";
import { EASE } from "../../lib/motion";
import { Reveal, FOCUS_RING } from "./shared";

const FAQS = [
  {
    q: "Which lead channels does Lotus D-CRM capture from?",
    a: "Meta Ads, WhatsApp, Instagram DMs, Google Sheets imports, walk-in registrations and the built-in Voice AI agent — all deduplicated into a single inbox.",
  },
  {
    q: "How are leads assigned to Customer Reps?",
    a: "A round-robin engine assigns every new lead to the rep with the lowest live workload, so distribution stays fair and instant with no manual triage.",
  },
  {
    q: "Is data isolated across branches?",
    a: "Yes. Role-based access keeps every branch's leads, pipeline and reports scoped to that branch — reps and managers only see what's relevant to them.",
  },
  {
    q: "What happens after a lead is captured?",
    a: "It moves through a tracked pipeline — follow-up, test drive, quotation, finance, exchange and delivery — with the AI agent nudging warm leads along the way.",
  },
];

/* Independent-toggle FAQ row; height-animates via Framer Motion. */
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-6 dark:border-white/10 dark:bg-white/[0.03]">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={clsx(
          "flex w-full items-center justify-between gap-4 rounded-lg py-5 text-left text-sm font-semibold text-slate-900 dark:text-white",
          FOCUS_RING
        )}
      >
        {q}
        <Plus
          size={18}
          className={clsx(
            "shrink-0 text-blue-600 transition-transform duration-300 dark:text-blue-400",
            open && "rotate-45"
          )}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: EASE }}
            className="overflow-hidden"
          >
            <p className="pb-5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function FaqSection() {
  return (
    <section className="relative bg-white py-24 dark:bg-slate-950">
      <div className="mx-auto max-w-3xl px-6">
        <Reveal className="text-center">
          <span className="text-sm font-semibold uppercase tracking-widest text-blue-600 dark:text-blue-400">FAQ</span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
            Answers before you sign in
          </h2>
        </Reveal>

        <Reveal delay={0.1} className="mt-10 space-y-3">
          {FAQS.map((f) => (
            <FaqItem key={f.q} q={f.q} a={f.a} />
          ))}
        </Reveal>
      </div>
    </section>
  );
}
