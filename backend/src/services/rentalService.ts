import { Prisma, BookingSource } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { parseDateOnly } from "../lib/dateOnly";
import { logAudit } from "../lib/auditLog";
import { getHolidayForDate } from "./holidayService";
import { nextBookingCode } from "../lib/bookingCode";

export class RentalError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export interface CreateRentalBookingInput {
  rentalItemId: string;
  spotId: string;
  timeSlotId: string;
  date: string; // "2026-09-10"
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  roomNumber?: string;
  adultCount: number;
  childCount?: number;
  source?: BookingSource;
  actor?: { adminUserId: string | null; actorLabel: string };
}

/**
 * Creates a rental booking (beach chair / cabana / umbrella), reserving
 * `adultCount + childCount` chairs from the chosen spot's pool for one time
 * slot (e.g. "Morning") — the same physical chair can be booked separately
 * in a different time slot on the same day.
 *
 * Concurrency-safe the same way excursion capacity is (see
 * bookingService.createBooking): the spot row is locked with
 * SELECT ... FOR UPDATE inside a transaction, remaining capacity for
 * (spotId, date, timeSlotId) is computed from the sum of that slot's
 * non-cancelled bookings, and only then is the new booking inserted.
 * Same-day booking is allowed (no cutoff check).
 */
export async function createRentalBooking(input: CreateRentalBookingInput) {
  const item = await prisma.rentalItem.findUnique({ where: { id: input.rentalItemId } });
  if (!item) throw new RentalError("Rental item not found", 404);
  if (item.status !== "ACTIVE") throw new RentalError("This rental is not currently bookable", 409);

  const timeSlot = await prisma.rentalTimeSlot.findUnique({ where: { id: input.timeSlotId } });
  if (!timeSlot || timeSlot.rentalItemId !== item.id || !timeSlot.isActive) {
    throw new RentalError("Time slot not found", 404);
  }

  const adultCount = input.adultCount ?? 1;
  const childCount = input.childCount ?? 0;
  const quantity = adultCount + childCount;
  if (quantity < 1) throw new RentalError("At least one guest is required");

  const date = parseDateOnly(input.date);
  const todayStr = new Date().toISOString().slice(0, 10);
  if (input.date < todayStr) throw new RentalError("Cannot book a date in the past");

  const holiday = await getHolidayForDate(input.date, "appliesToRentals");
  if (holiday) throw new RentalError(`Closed for ${holiday.label}`, 409);

  const amountTotal = Number(item.priceAdult) * adultCount + Number(item.priceChild ?? 0) * childCount;

  const booking = await prisma.$transaction(async (tx) => {
    const locked = await tx.$queryRaw<{ id: string; quantity: number; isActive: boolean; rentalItemId: string }[]>(
      Prisma.sql`SELECT id, quantity, isActive, rentalItemId FROM rental_spots WHERE id = ${input.spotId} FOR UPDATE`
    );
    const spot = locked[0];
    if (!spot || spot.rentalItemId !== item.id || !spot.isActive) {
      throw new RentalError("Spot not found", 404);
    }

    const bookedAgg = await tx.rentalBooking.aggregate({
      where: { spotId: spot.id, date, timeSlotId: timeSlot.id, status: { not: "CANCELLED" } },
      _sum: { quantity: true },
    });
    const alreadyBooked = bookedAgg._sum.quantity ?? 0;
    const remaining = spot.quantity - alreadyBooked;

    if (remaining < quantity) {
      throw new RentalError(
        remaining <= 0
          ? `No chairs left at this spot for ${timeSlot.label}`
          : `Only ${remaining} chair(s) left at this spot for ${timeSlot.label}`,
        409
      );
    }

    const bookingCode = await nextBookingCode(tx, "BCH", date);

    const created = await tx.rentalBooking.create({
      data: {
        rentalItemId: item.id,
        spotId: spot.id,
        timeSlotId: timeSlot.id,
        date,
        bookingCode,
        guestName: input.guestName,
        guestEmail: input.guestEmail,
        guestPhone: input.guestPhone,
        roomNumber: input.roomNumber,
        adultCount,
        childCount,
        quantity,
        amountTotal,
        currency: "USD",
        status: "PENDING",
        paymentStatus: "PENDING",
        source: input.source ?? "DIRECT_WEBSITE",
      },
    });

    await logAudit(
      input.actor ?? { adminUserId: null, actorLabel: input.guestName },
      "rental_booking.created",
      "RentalBooking",
      created.id,
      { date: input.date, spotId: spot.id, timeSlotId: timeSlot.id, quantity },
      tx
    );

    return created;
  });

  return booking;
}

export async function markRentalBookingPaid(
  bookingId: string,
  stripePaymentIntentId: string,
  paymentMethod: "stripe" | "offline" | "nmi" = "stripe"
) {
  const booking = await prisma.rentalBooking.update({
    where: { id: bookingId },
    data: { status: "CONFIRMED", paymentStatus: "PAID", stripePaymentIntentId, paymentMethod },
  });
  await logAudit(
    { adminUserId: null, actorLabel: "System (payment confirmed)" },
    "rental_booking.paid",
    "RentalBooking",
    bookingId
  );
  return booking;
}

/** Staff-confirmed offline payment — only valid for bookings actually placed
 *  via the offline method. */
export async function markRentalBookingPaidManually(bookingId: string, actor: { adminUserId: string; actorLabel: string }) {
  const booking = await prisma.rentalBooking.findUnique({ where: { id: bookingId } });
  if (!booking) throw new RentalError("Booking not found", 404);
  if (booking.paymentMethod !== "offline") {
    throw new RentalError("Only offline-payment bookings can be marked as paid manually", 400);
  }
  if (booking.paymentStatus === "PAID") throw new RentalError("Booking is already paid", 400);

  const updated = await prisma.rentalBooking.update({
    where: { id: bookingId },
    data: { status: "CONFIRMED", paymentStatus: "PAID" },
  });
  await logAudit(actor, "rental_booking.marked_paid", "RentalBooking", bookingId);
  return updated;
}

/**
 * Cancels (deletes) a rental booking. Deleting rather than flagging
 * CANCELLED is deliberate — it's what frees the capacity back up for the
 * live remaining-chairs calculation. A full snapshot is kept in the audit
 * log so the record isn't actually lost.
 */
export async function cancelRentalBooking(
  bookingId: string,
  actor: { adminUserId: string | null; actorLabel: string } = { adminUserId: null, actorLabel: "System" },
  reason?: string
) {
  const booking = await prisma.rentalBooking.findUnique({
    where: { id: bookingId },
    include: { spot: true, timeSlot: true },
  });
  if (!booking) return;

  await prisma.rentalBooking.delete({ where: { id: bookingId } });
  await logAudit(actor, "rental_booking.cancelled", "RentalBooking", bookingId, {
    reason,
    snapshot: {
      spotCode: booking.spot.code,
      timeSlotLabel: booking.timeSlot.label,
      quantity: booking.quantity,
      date: booking.date.toISOString().slice(0, 10),
      guestName: booking.guestName,
      guestEmail: booking.guestEmail,
      amountTotal: booking.amountTotal.toString(),
      paymentStatus: booking.paymentStatus,
    },
  });
}

export interface SpotAvailability {
  id: string;
  code: string;
  quantity: number;
  booked: number;
  remaining: number;
}

export interface RentalAvailability {
  spots: SpotAvailability[];
  totalChairs: number;
  remainingChairs: number;
  holidayLabel?: string;
}

/** Live per-spot AND item-wide remaining-chair counts for one date + time slot. */
export async function getSpotAvailability(rentalItemId: string, date: string, timeSlotId: string): Promise<RentalAvailability> {
  const item = await prisma.rentalItem.findUnique({ where: { id: rentalItemId } });
  if (!item) throw new RentalError("Rental item not found", 404);

  const timeSlot = await prisma.rentalTimeSlot.findUnique({ where: { id: timeSlotId } });
  if (!timeSlot || timeSlot.rentalItemId !== rentalItemId) throw new RentalError("Time slot not found", 404);

  const spots = await prisma.rentalSpot.findMany({
    where: { rentalItemId, isActive: true },
    orderBy: { code: "asc" },
  });

  const booked = await prisma.rentalBooking.groupBy({
    by: ["spotId"],
    where: { rentalItemId, date: parseDateOnly(date), timeSlotId, status: { not: "CANCELLED" } },
    _sum: { quantity: true },
  });
  const bookedMap = new Map(booked.map((b) => [b.spotId, b._sum.quantity ?? 0]));

  const spotAvailability = spots.map((s) => {
    const bookedCount = bookedMap.get(s.id) ?? 0;
    return { id: s.id, code: s.code, quantity: s.quantity, booked: bookedCount, remaining: Math.max(s.quantity - bookedCount, 0) };
  });

  const holiday = await getHolidayForDate(date, "appliesToRentals");

  return {
    spots: spotAvailability,
    totalChairs: spotAvailability.reduce((sum, s) => sum + s.quantity, 0),
    remainingChairs: spotAvailability.reduce((sum, s) => sum + s.remaining, 0),
    ...(holiday ? { holidayLabel: holiday.label } : {}),
  };
}
