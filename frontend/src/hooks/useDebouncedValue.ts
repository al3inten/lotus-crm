import { useEffect, useState } from "react";

/** Debounces a fast-changing value (e.g. keystrokes) so dependent filtering/queries don't
 * run on every keypress. */
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}
