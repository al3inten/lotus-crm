import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import clsx from "clsx";
import { ArrowUpRight, ArrowDownRight, ChevronRight } from "lucide-react";

/* ────────────────────────────────────────────────────────────────────────────
   Design system — "Quiet Precision"
   One surface color, hairline borders, a single indigo accent reserved for
   data. Numbers are the hero: tabular, tight-tracked, oversized. Everything
   else recedes. Motion is one orchestrated entrance, then near-silence.
──────────────────────────────────────────────────────────────────────────── */

export const ACCENT = "#5B5BD6"; // restrained indigo — used only where data lives

export const SURFACE =
  "rounded-2xl border border-slate-200/70 bg-white dark:border-white/[0.07] dark:bg-[#0E1015]";

export const HAIRLINE = "border-slate-200/70 dark:border-white/[0.07]";

/* ── Utilities ─────────────────────────────────────────────────────────── */

export function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

/* ── Micro-components ──────────────────────────────────────────────────── */

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
      {children}
    </span>
  );
}

export function SectionHeader({ title, to, cta }: { title: string; to?: string; cta?: string }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-[13px] font-semibold tracking-tight text-slate-900 dark:text-slate-100">
        {title}
      </h2>
      {to && cta && (
        <Link
          to={to}
          className="group inline-flex items-center gap-0.5 rounded-md text-[12px] font-medium text-slate-500 transition-colors hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 dark:text-slate-400 dark:hover:text-slate-100"
        >
          {cta}
          <ChevronRight
            size={13}
            className="translate-x-0 opacity-60 transition-transform duration-200 group-hover:translate-x-0.5"
          />
        </Link>
      )}
    </div>
  );
}

/* Stripe-style delta: no chip, no border — a small signed figure. */
export function Delta({ delta, upIsGood = true }: { delta?: number | null; upIsGood?: boolean }) {
  if (delta == null || Number.isNaN(delta)) return null;
  const positive = delta >= 0;
  const good = upIsGood ? positive : !positive;
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-0.5 text-[12px] font-medium tabular-nums",
        good ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
      )}
    >
      {positive ? <ArrowUpRight size={12} strokeWidth={2.25} /> : <ArrowDownRight size={12} strokeWidth={2.25} />}
      {Math.abs(delta)}%
    </span>
  );
}
