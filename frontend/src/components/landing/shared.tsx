import { useRef } from "react";
import type { MouseEvent as ReactMouseEvent, ReactNode } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { CountUp } from "../common/CountUp";
import { EASE } from "../../lib/motion";

/* Shared focus-visible ring for every interactive element on the page —
 * keeps keyboard-navigation affordance consistent (WCAG 2.4.7). */
export const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950";

/* Writes pointer position into CSS vars (no re-render) so .spotlight-card's
 * ::before can track the cursor with a radial-gradient highlight. */
export function handleSpotlight(e: ReactMouseEvent<HTMLDivElement>) {
  const rect = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty("--spot-x", `${e.clientX - rect.left}px`);
  e.currentTarget.style.setProperty("--spot-y", `${e.clientY - rect.top}px`);
}

/* ------------------------------------------------------------------ *
 * Scroll-reveal wrapper — fades + rises children when they enter view.
 * Respects prefers-reduced-motion (renders static).
 * ------------------------------------------------------------------ */
export function Reveal({
  children,
  delay = 0,
  y = 24,
  className,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const reduce = useReducedMotion();

  return (
    <motion.div
      ref={ref}
      initial={reduce ? undefined : { opacity: 0, y }}
      animate={inView && !reduce ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.6, ease: EASE, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* Count-up that only fires once its tile scrolls into view. */
export function Metric({ value, suffix, label }: { value: number; suffix?: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <div ref={ref} className="text-center">
      <div className="bg-gradient-to-b from-slate-900 to-blue-600 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl dark:from-white dark:to-blue-200">
        {inView ? <CountUp value={value} /> : 0}
        {suffix}
      </div>
      <p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  );
}
