import { BookingSource } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { logAudit } from "../lib/auditLog";
import { nextBookingCode } from "../lib/bookingCode";
import {
  validateAndPrepareBooking,
  reserveAndCreateBooking,
  releaseBooking,
  BookingError,
  CreateBookingInput,
} from "./bookingService";
import {
  validateAndPrepareRentalBooking,
  reserveAndCreateRentalBooking,
  cancelRentalBooking,
  RentalError,
  CreateRentalBookingInput,
} from "./rentalService";
import {
  validateAndPrepareEventBooking,
  reserveAndCreateEventBooking,
  cancelEventBooking,
  EventError,
  CreateEventBookingInput,
} from "./eventService";

export class OrderError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

/** Every per-type validation/locking error (BookingError, RentalError,
 *  EventError) is re-thrown as an OrderError with the same message/status —
 *  so a guest sees "Only 2 spot(s) left on this departure" for a failed
 *  cart item exactly as they would booking that item on its own, and
 *  callers only ever need to check for one error type from createOrder(). */
function asOrderError(err: unknown): OrderError {
  if (err instanceof BookingError || err instanceof RentalError || err instanceof EventError) {
    return new OrderError(err.message, err.status);
  }
  if (err instanceof OrderError) return err;
  throw err;
}

export type OrderItemInput =
  | ({ type: "excursion" } & Omit<CreateBookingInput, "guestName" | "guestEmail" | "guestPhone" | "roomNumber">)
  | ({ type: "rental" } & Omit<CreateRentalBookingInput, "guestName" | "guestEmail" | "guestPhone" | "roomNumber">)
  | ({ type: "event" } & Omit<CreateEventBookingInput, "guestName" | "guestEmail" | "guestPhone" | "roomNumber">);

export interface CreateOrderInput {
  items: OrderItemInput[];
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  roomNumber?: string;
  source?: BookingSource;
}

// Guest contact info is shared across every line item in an order — carried
// once at the order level and stitched onto each item's own create-input
// here, so bookingService/rentalService/eventService's existing validation
// and row shapes need no changes at all for the order path.
function withGuestInfo<T extends object, G extends object>(item: T, guest: G): T & G {
  return { ...item, ...guest };
}

/**
 * Creates a multi-item order: validates every line item first (cheap reads,
 * same per-type checks each standalone booking flow already does), then
 * reserves capacity and inserts all of them inside ONE transaction — if any
 * item fails (sold out, past cutoff, closed for a holiday, etc.) the whole
 * order rolls back and nothing is booked, rather than leaving a partial cart
 * half-paid-for. Reuses the exact same locking/capacity logic each
 * single-item flow uses (see bookingService/rentalService/eventService's
 * reserveAndCreate* functions) — this is purely a checkout wrapper around it.
 */
export async function createOrder(input: CreateOrderInput) {
  if (input.items.length === 0) throw new OrderError("Your cart is empty");

  const guest = {
    guestName: input.guestName,
    guestEmail: input.guestEmail,
    guestPhone: input.guestPhone,
    roomNumber: input.roomNumber,
  };

  const location = await prisma.location.findFirst();
  if (!location) throw new OrderError("Location is not configured", 500);

  // Pre-transaction validation for every item (existence/status/cutoff/
  // holiday/schedule checks + price computation) — same errors a guest would
  // see booking that item on its own, just surfaced before anything is locked.
  let prepared;
  try {
    prepared = await Promise.all(
      input.items.map(async (item) => {
        if (item.type === "excursion") {
          return { type: "excursion" as const, data: await validateAndPrepareBooking(withGuestInfo(item, guest)) };
        }
        if (item.type === "rental") {
          return { type: "rental" as const, data: await validateAndPrepareRentalBooking(withGuestInfo(item, guest)) };
        }
        return { type: "event" as const, data: await validateAndPrepareEventBooking(withGuestInfo(item, guest)) };
      })
    );
  } catch (err) {
    throw asOrderError(err);
  }

  let result;
  try {
    result = await prisma.$transaction(async (tx) => {
    const orderCode = await nextBookingCode(tx, "ORD", new Date());
    const order = await tx.order.create({
      data: {
        locationId: location.id,
        guestName: guest.guestName,
        guestEmail: guest.guestEmail,
        guestPhone: guest.guestPhone,
        roomNumber: guest.roomNumber,
        amountTotal: 0, // filled in below once every item's price is known
        currency: "USD",
        status: "PENDING",
        paymentStatus: "PENDING",
        bookingCode: orderCode,
        source: input.source ?? "DIRECT_WEBSITE",
      },
    });

    let amountTotal = 0;
    const bookings = [];
    const rentalBookings = [];
    const eventBookings = [];

    for (const p of prepared) {
      if (p.type === "excursion") {
        const created = await reserveAndCreateBooking(tx, p.data, order.id);
        bookings.push(created);
        amountTotal += Number(created.amountTotal);
      } else if (p.type === "rental") {
        const created = await reserveAndCreateRentalBooking(tx, p.data, order.id);
        rentalBookings.push(created);
        amountTotal += Number(created.amountTotal);
      } else {
        const created = await reserveAndCreateEventBooking(tx, p.data, order.id);
        eventBookings.push(created);
        amountTotal += Number(created.amountTotal);
      }
    }

    const updatedOrder = await tx.order.update({ where: { id: order.id }, data: { amountTotal } });

    await logAudit(
      { adminUserId: null, actorLabel: guest.guestName },
      "order.created",
      "Order",
      order.id,
      { itemCount: prepared.length, amountTotal, source: updatedOrder.source },
      tx
    );

    return { order: updatedOrder, bookings, rentalBookings, eventBookings };
    });
  } catch (err) {
    throw asOrderError(err);
  }

  return result;
}

/** Full order + every line item, for the confirmation page, admin view, and
 *  the webhook/nmi-charge handlers below. */
export async function getOrderWithItems(orderId: string) {
  return prisma.order.findUnique({
    where: { id: orderId },
    include: {
      bookings: { include: { excursion: true, slot: true } },
      rentalBookings: { include: { rentalItem: true, spot: true, timeSlot: true } },
      eventBookings: { include: { event: true, tier: true } },
    },
  });
}

/** Called after successful Stripe/NMI payment for an order — marks the
 *  order and every one of its line items PAID together. */
export async function markOrderPaid(orderId: string, paymentIntentId: string, paymentMethod: "stripe" | "offline" | "nmi" = "stripe") {
  const order = await getOrderWithItems(orderId);
  if (!order) throw new OrderError("Order not found", 404);

  await Promise.all([
    ...order.bookings.map((b) =>
      prisma.booking.update({ where: { id: b.id }, data: { status: "CONFIRMED", paymentStatus: "PAID", paymentMethod } })
    ),
    ...order.rentalBookings.map((b) =>
      prisma.rentalBooking.update({ where: { id: b.id }, data: { status: "CONFIRMED", paymentStatus: "PAID", paymentMethod } })
    ),
    ...order.eventBookings.map((b) =>
      prisma.eventBooking.update({ where: { id: b.id }, data: { status: "CONFIRMED", paymentStatus: "PAID", paymentMethod } })
    ),
  ]);

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: { status: "CONFIRMED", paymentStatus: "PAID", stripePaymentIntentId: paymentIntentId, paymentMethod },
  });
  await logAudit({ adminUserId: null, actorLabel: "System (payment confirmed)" }, "order.paid", "Order", orderId);
  return getOrderWithItems(updated.id);
}

/** Staff-confirmed offline payment for a whole order — only valid for
 *  orders actually placed via the offline method (same guard as every
 *  single-item markXPaidManually). */
export async function markOrderPaidManually(orderId: string, actor: { adminUserId: string; actorLabel: string }) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new OrderError("Order not found", 404);
  if (order.paymentMethod !== "offline") throw new OrderError("Only offline-payment orders can be marked as paid manually", 400);
  if (order.paymentStatus === "PAID") throw new OrderError("Order is already paid", 400);

  const paid = await markOrderPaid(orderId, `offline_manual_${orderId}`, "offline");
  await logAudit(actor, "order.marked_paid", "Order", orderId);
  return paid;
}

/**
 * Releases held capacity and cancels every line item in an order — used
 * both for the Stripe/NMI payment-failure path (no actor: system-initiated)
 * and staff-initiated cancellation from the admin panel, and by the expiry
 * sweep below. Reuses each type's own release/cancel function so per-type
 * capacity release (decrement counter vs delete row) stays exactly as it
 * already works for standalone bookings.
 */
export async function releaseOrder(
  orderId: string,
  actor: { adminUserId: string | null; actorLabel: string } = { adminUserId: null, actorLabel: "System (payment failed/expired)" },
  reason?: string
) {
  const order = await getOrderWithItems(orderId);
  if (!order || order.status === "CANCELLED") return;

  await Promise.all([
    ...order.bookings.map((b) => releaseBooking(b.id, actor, reason)),
    ...order.rentalBookings.map((b) => cancelRentalBooking(b.id, actor, reason)),
    ...order.eventBookings.map((b) => cancelEventBooking(b.id, actor, reason)),
  ]);

  await prisma.order.update({ where: { id: orderId }, data: { status: "CANCELLED" } });
  await logAudit(actor, "order.cancelled", "Order", orderId, { reason });
}

// No cron dependency in this codebase — a plain interval is enough. Only
// stripe/nmi orders are swept: offline orders are meant to sit PENDING for a
// while awaiting a bank transfer, same as every single-item offline booking.
const EXPIRY_MINUTES = 30;

export async function sweepExpiredOrders() {
  const cutoff = new Date(Date.now() - EXPIRY_MINUTES * 60 * 1000);
  const expired = await prisma.order.findMany({
    where: {
      status: "PENDING",
      paymentMethod: { in: ["stripe", "nmi"] },
      createdAt: { lt: cutoff },
    },
    select: { id: true },
  });
  for (const { id } of expired) {
    await releaseOrder(id, { adminUserId: null, actorLabel: "System (expired, abandoned checkout)" }, "Expired — abandoned checkout");
  }
  return expired.length;
}
