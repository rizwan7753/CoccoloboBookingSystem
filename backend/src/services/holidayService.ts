import { prisma } from "../lib/prisma";
import { parseDateOnly } from "../lib/dateOnly";

export type HolidayScope = "appliesToExcursions" | "appliesToRentals" | "appliesToEvents";

/**
 * Returns the Holiday row for a given date if one exists AND it applies to
 * the given booking type, else null. Used to block booking + surface a
 * clear reason ("Closed for Christmas Day") in both the API error and the
 * guest-facing availability display.
 */
export async function getHolidayForDate(dateStr: string, scope: HolidayScope) {
  const date = parseDateOnly(dateStr);
  const holiday = await prisma.holiday.findFirst({ where: { date } });
  if (!holiday || !holiday[scope]) return null;
  return holiday;
}

/** Returns all holidays in [from, to] that apply to the given booking type — for availability calendars. */
export async function listHolidaysInRange(from: Date, to: Date, scope: HolidayScope) {
  return prisma.holiday.findMany({
    where: { date: { gte: from, lte: to }, [scope]: true },
    orderBy: { date: "asc" },
  });
}
