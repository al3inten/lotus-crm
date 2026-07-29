const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

/**
 * A "YYYY-MM-DD" filter/display value always means a calendar day in IST (the dealership's
 * timezone), regardless of what timezone the server process happens to run in — Render runs
 * containers in UTC, so `new Date(y, m-1, d, 0,0,0,0)` (server-local) silently drifts by 5:30h
 * from what the IST-based frontend shows, letting rows fall on the wrong side of a date-range
 * filter. These build the UTC instant that IS that IST calendar-day boundary.
 */
export function istDayStart(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0) - IST_OFFSET_MS);
}

export function istDayEnd(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999) - IST_OFFSET_MS);
}

/** "YYYY-MM-DD" key for whichever IST calendar day an instant falls on. */
export function istDayKey(date: Date): string {
  const shifted = new Date(date.getTime() + IST_OFFSET_MS);
  return `${shifted.getUTCFullYear()}-${String(shifted.getUTCMonth() + 1).padStart(2, "0")}-${String(shifted.getUTCDate()).padStart(2, "0")}`;
}

/** Year/month(0-based)/day of an instant, read as IST wall-clock fields — use this instead of
 * `Date.prototype.getFullYear/getMonth/getDate`, which read the server process's own timezone
 * (UTC on Render), not IST. */
export function istParts(date: Date): { year: number; month: number; day: number } {
  const shifted = new Date(date.getTime() + IST_OFFSET_MS);
  return { year: shifted.getUTCFullYear(), month: shifted.getUTCMonth(), day: shifted.getUTCDate() };
}

/** "Today"/"this week" bounds for whatever instant `now` is, as IST calendar days —
 * independent of the server process's own timezone. */
export function istDayBounds(now = new Date()) {
  // Shifting the instant by the IST offset lets UTC-getters read it back as IST wall-clock
  // fields, without ever touching the server's local timezone.
  const shifted = new Date(now.getTime() + IST_OFFSET_MS);
  const y = shifted.getUTCFullYear();
  const m = shifted.getUTCMonth() + 1;
  const d = shifted.getUTCDate();
  const todayStr = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  const startOfToday = istDayStart(todayStr);
  const endOfToday = istDayEnd(todayStr);
  const weekLater = new Date(shifted.getTime());
  weekLater.setUTCDate(weekLater.getUTCDate() + 7);
  const endOfWeekStr = `${weekLater.getUTCFullYear()}-${String(weekLater.getUTCMonth() + 1).padStart(2, "0")}-${String(weekLater.getUTCDate()).padStart(2, "0")}`;
  const endOfWeek = istDayEnd(endOfWeekStr);

  return { startOfToday, endOfToday, endOfWeek };
}
