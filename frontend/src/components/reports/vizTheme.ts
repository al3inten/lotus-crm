// Chart palette — validated with the dataviz skill's validate_palette.js:
// categorical [blue, aqua, red] passes (aqua is sub-3:1 on light surface, so charts
// using it must carry visible labels or a table view — the relief rule).
export const VIZ = {
  series1: "#2a78d6", // blue — primary series / single-series bars
  series2: "#1baf7a", // aqua — secondary series (needs label/table relief)
  series6: "#e34948", // red — third series (lost)
  deEmphasis: "#c3c2b7", // gray for context series (e.g. last year)
  gridline: "#e1e0d9",
  baseline: "#c3c2b7",
  inkPrimary: "#0b0b0b",
  inkSecondary: "#52514e",
  inkMuted: "#898781",
  deltaGood: "#006300",
  deltaBad: "#d03b3b",
  surface: "#fcfcfb",
} as const;

export function formatCompact(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 10_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toLocaleString();
}

export function formatHours(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  if (hours < 48) return `${hours.toFixed(1)}h`;
  return `${(hours / 24).toFixed(1)}d`;
}
