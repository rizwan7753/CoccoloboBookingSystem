import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { requireAdmin } from "../../middleware/requireAdmin";
import { requireRole } from "../../middleware/requireRole";
import { parseDateOnly } from "../../lib/dateOnly";

const router = Router();
router.use(requireAdmin);
router.use(requireRole("SUPER_ADMIN", "LOCATION_MANAGER", "BOOKING_STAFF", "FINANCE"));

function dayOfWeek(date: Date): number {
  return date.getUTCDay();
}

interface DayEntry {
  date: string;
  bookingCount: number;
  guestCount: number;
  revenue: number;
  departures: number;
  excursionBookings: number;
  rentalBookings: number;
  eventBookings: number;
}

function getDay(dayMap: Map<string, DayEntry>, key: string): DayEntry {
  return (
    dayMap.get(key) ?? {
      date: key,
      bookingCount: 0,
      guestCount: 0,
      revenue: 0,
      departures: 0,
      excursionBookings: 0,
      rentalBookings: 0,
      eventBookings: 0,
    }
  );
}

// GET /api/admin/dashboard/summary?from=YYYY-MM-DD&to=YYYY-MM-DD
// Powers the admin dashboard: top-line KPIs + a per-day breakdown (across
// excursions, beach chair rentals, and events) for the calendar.
router.get("/summary", async (req, res) => {
  const { from, to } = req.query as { from?: string; to?: string };
  if (!from || !to) return res.status(400).json({ error: "from and to query params are required" });

  const fromDate = parseDateOnly(from);
  const toDate = parseDateOnly(to);
  const today = parseDateOnly(new Date().toISOString().slice(0, 10));

  const [slotsInRange, excursions, upcomingBookings, rentalBookingsInRange, activeRentalItems, eventsInRange, upcomingEvents] =
    await Promise.all([
      prisma.departureSlot.findMany({
        where: { date: { gte: fromDate, lte: toDate } },
        include: {
          excursion: { select: { id: true, title: true } },
          bookings: { where: { status: { not: "CANCELLED" } } },
        },
      }),
      prisma.excursion.findMany({
        select: { id: true, status: true, departureTimes: { where: { isActive: true } } },
      }),
      prisma.booking.findMany({
        where: { status: { not: "CANCELLED" }, slot: { date: { gte: today } } },
        select: { totalGuests: true, amountTotal: true, paymentStatus: true },
      }),
      prisma.rentalBooking.findMany({
        where: { date: { gte: fromDate, lte: toDate }, status: { not: "CANCELLED" } },
        select: { date: true, quantity: true, amountTotal: true, paymentStatus: true },
      }),
      prisma.rentalItem.count({ where: { status: "ACTIVE" } }),
      prisma.event.findMany({
        where: { eventDate: { gte: fromDate, lte: toDate }, status: "ACTIVE" },
        select: {
          id: true,
          eventDate: true,
          bookings: { where: { status: { not: "CANCELLED" } }, select: { quantity: true, amountTotal: true, paymentStatus: true } },
        },
      }),
      prisma.event.findMany({
        where: { eventDate: { gte: today }, status: "ACTIVE" },
        select: { bookings: { where: { status: { not: "CANCELLED" } }, select: { quantity: true, amountTotal: true, paymentStatus: true } } },
      }),
    ]);

  // Per-day aggregation for the calendar grid — merges excursion departures,
  // beach chair reservations, and event ticket sales into one map.
  const dayMap = new Map<string, DayEntry>();

  for (const slot of slotsInRange) {
    const key = slot.date.toISOString().slice(0, 10);
    const entry = getDay(dayMap, key);
    entry.departures += 1;
    entry.bookingCount += slot.bookings.length;
    entry.excursionBookings += slot.bookings.length;
    entry.guestCount += slot.bookings.reduce((sum, b) => sum + b.totalGuests, 0);
    entry.revenue += slot.bookings.filter((b) => b.paymentStatus === "PAID").reduce((sum, b) => sum + Number(b.amountTotal), 0);
    dayMap.set(key, entry);
  }

  for (const rb of rentalBookingsInRange) {
    const key = rb.date.toISOString().slice(0, 10);
    const entry = getDay(dayMap, key);
    entry.bookingCount += 1;
    entry.rentalBookings += 1;
    entry.guestCount += rb.quantity;
    if (rb.paymentStatus === "PAID") entry.revenue += Number(rb.amountTotal);
    dayMap.set(key, entry);
  }

  for (const evt of eventsInRange) {
    const key = evt.eventDate.toISOString().slice(0, 10);
    const entry = getDay(dayMap, key);
    entry.bookingCount += evt.bookings.length;
    entry.eventBookings += evt.bookings.length;
    entry.guestCount += evt.bookings.reduce((sum, b) => sum + b.quantity, 0);
    entry.revenue += evt.bookings.filter((b) => b.paymentStatus === "PAID").reduce((sum, b) => sum + Number(b.amountTotal), 0);
    dayMap.set(key, entry);
  }

  // "Scheduled today" comes from the recurring schedule, not just slots that
  // happen to already exist (a slot is only created once someone checks
  // availability or books it — see bookingService.ensureSlot).
  const todaysDow = dayOfWeek(today);
  let scheduledToday = 0;
  for (const ex of excursions) {
    for (const dt of ex.departureTimes) {
      if ((dt.daysOfWeek as number[]).includes(todaysDow)) scheduledToday += 1;
    }
  }

  const upcomingRentalBookings = await prisma.rentalBooking.findMany({
    where: { status: { not: "CANCELLED" }, date: { gte: today } },
    select: { quantity: true, amountTotal: true, paymentStatus: true },
  });

  const upcomingEventBookingsFlat = upcomingEvents.flatMap((e) => e.bookings);

  const kpis = {
    activeExcursions: excursions.filter((e) => e.status === "ACTIVE").length,
    activeRentalItems,
    scheduledToday,
    upcomingBookings: upcomingBookings.length + upcomingRentalBookings.length + upcomingEventBookingsFlat.length,
    upcomingGuests:
      upcomingBookings.reduce((sum, b) => sum + b.totalGuests, 0) +
      upcomingRentalBookings.reduce((sum, b) => sum + b.quantity, 0) +
      upcomingEventBookingsFlat.reduce((sum, b) => sum + b.quantity, 0),
    upcomingRevenuePaid:
      upcomingBookings.filter((b) => b.paymentStatus === "PAID").reduce((sum, b) => sum + Number(b.amountTotal), 0) +
      upcomingRentalBookings.filter((b) => b.paymentStatus === "PAID").reduce((sum, b) => sum + Number(b.amountTotal), 0) +
      upcomingEventBookingsFlat.filter((b) => b.paymentStatus === "PAID").reduce((sum, b) => sum + Number(b.amountTotal), 0),
  };

  res.json({ kpis, days: Array.from(dayMap.values()) });
});

export default router;
