/**
 * Parses a "YYYY-MM-DD" string as UTC midnight.
 *
 * IMPORTANT: never build these dates with `new Date(\`${d}T00:00:00\`)` —
 * that's parsed as LOCAL midnight, and Prisma writes @db.Date columns using
 * the UTC calendar date of the JS Date object. On any server whose local
 * timezone isn't UTC, that mismatch silently shifts the stored date by a
 * day (or reads/writes disagree on which day a slot belongs to). Parsing
 * as UTC midnight keeps the calendar date stable regardless of server TZ.
 */
export function parseDateOnly(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00.000Z`);
}

/**
 * Offset (ms) of `timeZone` from UTC at the instant `instant` falls on —
 * varies with DST, so this must be computed per-instant rather than cached.
 * Uses only the built-in Intl API, no date library needed.
 */
function getTimeZoneOffsetMs(instant: Date, timeZone: string): number {
  const parts: Record<string, string> = {};
  for (const part of new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(instant)) {
    if (part.type !== "literal") parts[part.type] = part.value;
  }
  const asUTC = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second)
  );
  return asUTC - instant.getTime();
}

/** Converts a wall-clock date/time as observed in `timeZone` to the UTC instant it represents. */
export function zonedTimeToUtc(year: number, month: number, day: number, hour: number, minute: number, timeZone: string): Date {
  const guess = Date.UTC(year, month - 1, day, hour, minute, 0, 0);
  const offset = getTimeZoneOffsetMs(new Date(guess), timeZone);
  return new Date(guess - offset);
}

/**
 * "21:00" -> cutoff is 21:00 in `timezone` (the property's local time, e.g.
 * Location.timezone) on the day BEFORE `departureDate`. Shared by
 * bookingService (enforcing the cutoff) and the next-departure lookup
 * (deciding which upcoming dates are still bookable) so the two never drift
 * out of sync.
 */
export function computeCutoffDateTime(departureDate: Date, cutoffTime: string, timezone: string): Date {
  const [hh, mm] = cutoffTime.split(":").map(Number);
  const cutoffDay = new Date(departureDate);
  cutoffDay.setUTCDate(cutoffDay.getUTCDate() - 1);
  return zonedTimeToUtc(cutoffDay.getUTCFullYear(), cutoffDay.getUTCMonth() + 1, cutoffDay.getUTCDate(), hh, mm, timezone);
}

export function dayOfWeek(date: Date): number {
  return date.getUTCDay(); // 0=Sun..6=Sat
}
