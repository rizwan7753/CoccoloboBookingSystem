import { Prisma, BookingSource } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { parseDateOnly, computeCutoffDateTime, dayOfWeek } from "../lib/dateOnly";
import { logAudit } from "../lib/auditLog";
import { getHolidayForDate, listHolidaysInRange } from "./holidayService";

export class BookingError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

// NOTE on computeCutoffDateTime/dayOfWeek (imported from lib/dateOnly):
// departureDate is UTC midnight (see parseDateOnly) and cutoffTime is
// treated as UTC too, so this is only accurate for a property actually
// operating in UTC. Proper per-location timezone support (Location.timezone)
// is deferred to the multi-property phase — tracked as a known MVP gap, not
// an oversight. Using UTC getters/setters throughout (rather than local
// getDate/setHours) at least keeps this consistent regardless of the
// server's own timezone, which is the bug this replaces.

/**
 * Ensures a DepartureSlot row exists for (excursionId, date, time).
 * Safe under concurrent calls: relies on the unique(excursionId,date,time)
 * constraint — if two requests race to create it, one wins and the other
 * simply re-reads the row that now exists.
 */
async function ensureSlot(excursionId: string, date: Date, time: string, defaultCapacity: number) {
  try {
    return await prisma.departureSlot.create({
      data: { excursionId, date, time, capacity: defaultCapacity },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      const existing = await prisma.departureSlot.findUnique({
        where: { excursionId_date_time: { excursionId, date, time } },
      });
      if (existing) return existing;
    }
    throw err;
  }
}

export interface CreateBookingInput {
  excursionId: string;
  date: string; // "2026-09-10"
  time: string; // "09:00"
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  roomNumber?: string;
  specialRequests?: string;
  adultCount: number;
  childCount?: number;
  source?: BookingSource;
  /** Staff-assisted booking: who created it. Omit for a guest self-service booking. */
  actor?: { adminUserId: string | null; actorLabel: string };
}

/**
 * Creates a booking with concurrency-safe capacity locking:
 * the DepartureSlot row is locked with SELECT ... FOR UPDATE inside a
 * transaction so two simultaneous bookings can never oversell the same
 * departure. Capacity check, increment, and booking insert all happen
 * atomically within that lock.
 */
export async function createBooking(input: CreateBookingInput) {
  const excursion = await prisma.excursion.findUnique({ where: { id: input.excursionId } });
  if (!excursion) throw new BookingError("Excursion not found", 404);
  if (excursion.status !== "ACTIVE") throw new BookingError("This excursion is not currently bookable", 409);

  const adultCount = input.adultCount ?? 0;
  const childCount = input.childCount ?? 0;
  const totalGuests = adultCount + childCount;
  if (totalGuests < 1) throw new BookingError("At least one guest is required");

  const departureDate = parseDateOnly(input.date);
  if (Number.isNaN(departureDate.getTime())) throw new BookingError("Invalid date");

  const activeSchedule = await prisma.departureTime.findFirst({
    where: { excursionId: excursion.id, time: input.time, isActive: true },
  });
  if (!activeSchedule || !(activeSchedule.daysOfWeek as number[]).includes(dayOfWeek(departureDate))) {
    throw new BookingError("This excursion does not depart at the requested date/time", 422);
  }

  const cutoff = computeCutoffDateTime(departureDate, excursion.cutoffTime);
  if (new Date() >= cutoff) {
    throw new BookingError(
      `Booking cut-off has passed. Bookings must be made by ${excursion.cutoffTime} the evening before.`,
      409
    );
  }

  const holiday = await getHolidayForDate(input.date, "appliesToExcursions");
  if (holiday) throw new BookingError(`Closed for ${holiday.label}`, 409);

  await ensureSlot(excursion.id, departureDate, input.time, excursion.capacityDefault);

  // FLAT_RATE: priceAdult is the total for the whole booking (e.g. a cabana at
  // "$400 for up to 4 guests") — capacityDefault already caps guest count via
  // the slot capacity check below, so no per-head multiplication happens here.
  const amountTotal =
    excursion.pricingType === "FLAT_RATE"
      ? Number(excursion.priceAdult)
      : Number(excursion.priceAdult) * adultCount + Number(excursion.priceChild ?? 0) * childCount;

  const booking = await prisma.$transaction(async (tx) => {
    const locked = await tx.$queryRaw<{ id: string; capacity: number; bookedCount: number }[]>(
      Prisma.sql`SELECT id, capacity, bookedCount FROM departure_slots
                 WHERE excursionId = ${excursion.id} AND date = ${input.date} AND time = ${input.time}
                 FOR UPDATE`
    );
    const slot = locked[0];
    if (!slot) throw new BookingError("Departure slot not found", 404);

    const remaining = slot.capacity - slot.bookedCount;
    if (remaining < totalGuests) {
      throw new BookingError(
        remaining <= 0 ? "This departure is fully booked" : `Only ${remaining} spot(s) left on this departure`,
        409
      );
    }

    await tx.departureSlot.update({
      where: { id: slot.id },
      data: {
        bookedCount: { increment: totalGuests },
        status: slot.bookedCount + totalGuests >= slot.capacity ? "SOLD_OUT" : "OPEN",
      },
    });

    const created = await tx.booking.create({
      data: {
        excursionId: excursion.id,
        slotId: slot.id,
        guestName: input.guestName,
        guestEmail: input.guestEmail,
        guestPhone: input.guestPhone,
        roomNumber: input.roomNumber,
        specialRequests: input.specialRequests,
        adultCount,
        childCount,
        totalGuests,
        amountTotal,
        currency: "USD",
        status: "PENDING",
        paymentStatus: "PENDING",
        source: input.source ?? "DIRECT_WEBSITE",
      },
    });

    await logAudit(
      input.actor ?? { adminUserId: null, actorLabel: input.guestName },
      "booking.created",
      "Booking",
      created.id,
      { date: input.date, time: input.time, totalGuests, source: created.source },
      tx
    );

    return created;
  });

  return booking;
}

/** Called after successful Stripe payment confirmation (webhook, or the local dev bypass). */
export async function markBookingPaid(
  bookingId: string,
  stripePaymentIntentId: string,
  paymentMethod: "stripe" | "offline" = "stripe"
) {
  const booking = await prisma.booking.update({
    where: { id: bookingId },
    data: { status: "CONFIRMED", paymentStatus: "PAID", stripePaymentIntentId, paymentMethod },
  });
  await logAudit({ adminUserId: null, actorLabel: "System (payment confirmed)" }, "booking.paid", "Booking", bookingId);
  return booking;
}

/** Staff-confirmed offline payment (bank deposit/transfer) — only valid for
 *  bookings actually placed via the offline method, so a real unpaid Stripe
 *  booking can't be manually "confirmed" by mistake. */
export async function markBookingPaidManually(bookingId: string, actor: { adminUserId: string; actorLabel: string }) {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) throw new BookingError("Booking not found", 404);
  if (booking.paymentMethod !== "offline") {
    throw new BookingError("Only offline-payment bookings can be marked as paid manually", 400);
  }
  if (booking.paymentStatus === "PAID") throw new BookingError("Booking is already paid", 400);

  const updated = await prisma.booking.update({
    where: { id: bookingId },
    data: { status: "CONFIRMED", paymentStatus: "PAID" },
  });
  await logAudit(actor, "booking.marked_paid", "Booking", bookingId);
  return updated;
}

/**
 * Releases held capacity and cancels a booking — used both for the Stripe
 * payment-failure path (no actor: system-initiated) and staff-initiated
 * cancellation from the admin panel (actor: the admin user who clicked cancel).
 */
export async function releaseBooking(
  bookingId: string,
  actor: { adminUserId: string | null; actorLabel: string } = { adminUserId: null, actorLabel: "System (payment failed/expired)" },
  reason?: string
) {
  return prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findUnique({ where: { id: bookingId } });
    if (!booking || booking.status === "CANCELLED") return;

    await tx.departureSlot.update({
      where: { id: booking.slotId },
      data: { bookedCount: { decrement: booking.totalGuests }, status: "OPEN" },
    });
    await tx.booking.update({
      where: { id: bookingId },
      data: { status: "CANCELLED", internalNotes: reason ?? booking.internalNotes },
    });

    await logAudit(actor, "booking.cancelled", "Booking", bookingId, { reason }, tx);
  });
}

export async function getAvailability(excursionId: string, from: Date, to: Date) {
  const excursion = await prisma.excursion.findUnique({
    where: { id: excursionId },
    include: { departureTimes: { where: { isActive: true } } },
  });
  if (!excursion) throw new BookingError("Excursion not found", 404);

  const existingSlots = await prisma.departureSlot.findMany({
    where: { excursionId, date: { gte: from, lte: to } },
  });
  const slotMap = new Map(existingSlots.map((s) => [`${s.date.toISOString().slice(0, 10)}_${s.time}`, s]));

  const holidays = await listHolidaysInRange(from, to, "appliesToExcursions");
  const holidayMap = new Map(holidays.map((h) => [h.date.toISOString().slice(0, 10), h.label]));

  const days: {
    date: string;
    time: string;
    capacity: number;
    remaining: number;
    status: string;
    bookingClosed: boolean;
    holidayLabel?: string;
  }[] = [];

  for (let d = new Date(from); d <= to; d.setUTCDate(d.getUTCDate() + 1)) {
    const dow = dayOfWeek(d);
    const dateStr = d.toISOString().slice(0, 10);
    const holidayLabel = holidayMap.get(dateStr);
    for (const dt of excursion.departureTimes) {
      if (!(dt.daysOfWeek as number[]).includes(dow)) continue;
      const key = `${dateStr}_${dt.time}`;
      const existing = slotMap.get(key);
      const capacity = existing?.capacity ?? excursion.capacityDefault;
      const bookedCount = existing?.bookedCount ?? 0;
      const cutoff = computeCutoffDateTime(new Date(d), excursion.cutoffTime);
      days.push({
        date: dateStr,
        time: dt.time,
        capacity,
        remaining: Math.max(capacity - bookedCount, 0),
        status: existing?.status ?? "OPEN",
        bookingClosed: new Date() >= cutoff || Boolean(holidayLabel),
        ...(holidayLabel ? { holidayLabel } : {}),
      });
    }
  }

  return days;
}
