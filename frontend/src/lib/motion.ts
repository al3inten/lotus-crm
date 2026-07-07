import type { Variants } from "framer-motion";

/** Standard premium easing (easeOutExpo-ish) used across entrance animations. */
export const EASE = [0.22, 1, 0.36, 1] as const;

/** Fade + rise, for individual cards/rows. Pairs with `staggerContainer`. */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: EASE } },
};

/** Wrap a group; children with `fadeUp` reveal in sequence. */
export const staggerContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
};

/** Whole-page entrance. */
export const pageFade: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: EASE } },
};
