import { Prisma, BookingSource } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { logAudit } from "../lib/auditLog";
import { getHolidayForDate } from "./holidayService";

export class EventError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export interface CreateEventBookingInput {
  eventId: string;
  tierId: string;
  quantity: number;
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  roomNumber?: string;
  source?: BookingSource;
  actor?: { adminUserId: string | null; actorLabel: string };
}

/**
 * Books `quantity` tickets at one tier of an event.
 *
 * Concurrency-safe the same way rental spots and excursion capacity are: the
 * tier row is locked with SELECT ... FOR UPDATE inside a transaction,
 * remaining capacity is computed from the sum of non-cancelled bookings at
 * that tier, and only then is the new booking inserted. No advance-booking
 * cutoff — tickets can be bought right up through the event's date.
 */
export async function createEventBooking(input: CreateEventBookingInput) {
  const event = await prisma.event.findUnique({ where: { id: input.eventId } });
  if (!event) throw new EventError("Event not found", 404);
  if (event.status !== "ACTIVE") throw new EventError("This event is not currently bookable", 409);

  const todayStr = new Date().toISOString().slice(0, 10);
  const eventDateStr = event.eventDate.toISOString().slice(0, 10);
  if (eventDateStr < todayStr) throw new EventError("This event has already taken place", 409);

  const holiday = await getHolidayForDate(eventDateStr, "appliesToEvents");
  if (holiday) throw new EventError(`Closed for ${holiday.label}`, 409);

  const quantity = input.quantity ?? 1;
  if (quantity < 1) throw new EventError("At least one ticket is required");

  const booking = await prisma.$transaction(async (tx) => {
    const locked = await tx.$queryRaw<{ id: string; price: string; capacity: number; isActive: boolean; eventId: string }[]>(
      Prisma.sql`SELECT id, price, capacity, isActive, eventId FROM event_ticket_tiers WHERE id = ${input.tierId} FOR UPDATE`
    );
    const tier = locked[0];
    if (!tier || tier.eventId !== event.id || !tier.isActive) {
      throw new EventError("Ticket tier not found", 404);
    }

    const bookedAgg = await tx.eventBooking.aggregate({
      where: { tierId: tier.id, status: { not: "CANCELLED" } },
      _sum: { quantity: true },
    });
    const alreadyBooked = bookedAgg._sum.quantity ?? 0;
    const remaining = tier.capacity - alreadyBooked;

    if (remaining < quantity) {
      throw new EventError(
        remaining <= 0 ? "This ticket tier is sold out" : `Only ${remaining} ticket(s) left at this tier`,
        409
      );
    }

    const amountTotal = Number(tier.price) * quantity;

    const created = await tx.eventBooking.create({
      data: {
        eventId: event.id,
        tierId: tier.id,
        guestName: input.guestName,
        guestEmail: input.guestEmail,
        guestPhone: input.guestPhone,
        roomNumber: input.roomNumber,
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
      "event_booking.created",
      "EventBooking",
      created.id,
      { eventId: event.id, tierId: tier.id, quantity },
      tx
    );

    return created;
  });

  return booking;
}

export async function markEventBookingPaid(
  bookingId: string,
  stripePaymentIntentId: string,
  paymentMethod: "stripe" | "offline" | "nmi" = "stripe"
) {
  const booking = await prisma.eventBooking.update({
    where: { id: bookingId },
    data: { status: "CONFIRMED", paymentStatus: "PAID", stripePaymentIntentId, paymentMethod },
  });
  await logAudit(
    { adminUserId: null, actorLabel: "System (payment confirmed)" },
    "event_booking.paid",
    "EventBooking",
    bookingId
  );
  return booking;
}

/** Staff-confirmed offline payment — only valid for bookings actually placed
 *  via the offline method. */
export async function markEventBookingPaidManually(bookingId: string, actor: { adminUserId: string; actorLabel: string }) {
  const booking = await prisma.eventBooking.findUnique({ where: { id: bookingId } });
  if (!booking) throw new EventError("Booking not found", 404);
  if (booking.paymentMethod !== "offline") {
    throw new EventError("Only offline-payment bookings can be marked as paid manually", 400);
  }
  if (booking.paymentStatus === "PAID") throw new EventError("Booking is already paid", 400);

  const updated = await prisma.eventBooking.update({
    where: { id: bookingId },
    data: { status: "CONFIRMED", paymentStatus: "PAID" },
  });
  await logAudit(actor, "event_booking.marked_paid", "EventBooking", bookingId);
  return updated;
}

/**
 * Cancels (deletes) an event booking — deleting frees the tier capacity back
 * up. A full snapshot is kept in the audit log so the record isn't lost.
 */
export async function cancelEventBooking(
  bookingId: string,
  actor: { adminUserId: string | null; actorLabel: string } = { adminUserId: null, actorLabel: "System" },
  reason?: string
) {
  const booking = await prisma.eventBooking.findUnique({ where: { id: bookingId }, include: { tier: true } });
  if (!booking) return;

  await prisma.eventBooking.delete({ where: { id: bookingId } });
  await logAudit(actor, "event_booking.cancelled", "EventBooking", bookingId, {
    reason,
    snapshot: {
      tierName: booking.tier.name,
      quantity: booking.quantity,
      guestName: booking.guestName,
      guestEmail: booking.guestEmail,
      amountTotal: booking.amountTotal.toString(),
      paymentStatus: booking.paymentStatus,
    },
  });
}

export interface TierAvailability {
  id: string;
  name: string;
  description: string | null;
  price: string;
  capacity: number;
  booked: number;
  remaining: number;
}

/** Live per-tier remaining-ticket counts for one event. */
export async function getTierAvailability(eventId: string): Promise<TierAvailability[]> {
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) throw new EventError("Event not found", 404);

  const tiers = await prisma.eventTicketTier.findMany({
    where: { eventId, isActive: true },
    orderBy: { price: "asc" },
  });

  const booked = await prisma.eventBooking.groupBy({
    by: ["tierId"],
    where: { eventId, status: { not: "CANCELLED" } },
    _sum: { quantity: true },
  });
  const bookedMap = new Map(booked.map((b) => [b.tierId, b._sum.quantity ?? 0]));

  return tiers.map((t) => {
    const bookedCount = bookedMap.get(t.id) ?? 0;
    return {
      id: t.id,
      name: t.name,
      description: t.description,
      price: t.price.toString(),
      capacity: t.capacity,
      booked: bookedCount,
      remaining: Math.max(t.capacity - bookedCount, 0),
    };
  });
}
