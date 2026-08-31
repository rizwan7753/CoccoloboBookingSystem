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
 * "21:00" -> cutoff is 21:00 (UTC) on the day BEFORE `departureDate`.
 * Shared by bookingService (enforcing the cutoff) and the next-departure
 * lookup (deciding which upcoming dates are still bookable) so the two
 * never drift out of sync.
 */
export function computeCutoffDateTime(departureDate: Date, cutoffTime: string): Date {
  const [hh, mm] = cutoffTime.split(":").map(Number);
  const cutoff = new Date(departureDate);
  cutoff.setUTCDate(cutoff.getUTCDate() - 1);
  cutoff.setUTCHours(hh, mm, 0, 0);
  return cutoff;
}

export function dayOfWeek(date: Date): number {
  return date.getUTCDay(); // 0=Sun..6=Sat
}
