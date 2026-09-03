import { computeCutoffDateTime, dayOfWeek } from "./dateOnly";

export interface NextDeparture {
  date: string; // "2026-09-01"
  time: string; // "10:00"
}

/**
 * Finds the next bookable departure for an excursion — the soonest
 * (date, time) that (a) falls on one of its scheduled days and (b) hasn't
 * passed its booking cut-off yet. Powers the "upcoming excursions" list on
 * the guest homepage.
 */
export function getNextDeparture(
  departureTimes: { time: string; daysOfWeek: number[]; isActive: boolean }[],
  cutoffTime: string,
  timezone: string,
  daysAhead = 21
): NextDeparture | null {
  const now = new Date();
  const active = departureTimes.filter((dt) => dt.isActive);
  if (active.length === 0) return null;

  for (let i = 0; i <= daysAhead; i++) {
    const d = new Date();
    d.setUTCHours(0, 0, 0, 0);
    d.setUTCDate(d.getUTCDate() + i);
    const dow = dayOfWeek(d);

    const candidates = active.filter((dt) => dt.daysOfWeek.includes(dow)).sort((a, b) => a.time.localeCompare(b.time));

    for (const dt of candidates) {
      const cutoff = computeCutoffDateTime(d, cutoffTime, timezone);
      if (now < cutoff) {
        return { date: d.toISOString().slice(0, 10), time: dt.time };
      }
    }
  }
  return null;
}
