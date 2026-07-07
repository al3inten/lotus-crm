import { useCountUp } from "@/hooks/useCountUp";

interface CountUpProps {
  value: number;
  /** Formats the animated (float) value for display. Defaults to rounded, locale-grouped. */
  format?: (n: number) => string;
}

export function CountUp({ value, format = (n) => Math.round(n).toLocaleString() }: CountUpProps) {
  const animated = useCountUp(value);
  return <>{format(animated)}</>;
}
