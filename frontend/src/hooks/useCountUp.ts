import { useEffect, useState } from "react";
import { animate } from "framer-motion";

/**
 * Animates a number from 0 → target on mount / when target changes.
 * Respects prefers-reduced-motion (jumps straight to the value).
 */
export function useCountUp(target: number, duration = 0.9): number {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce || target === 0) {
      setValue(target);
      return;
    }
    const controls = animate(0, target, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setValue(v),
    });
    return () => controls.stop();
  }, [target, duration]);

  return value;
}
