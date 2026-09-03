import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { requireAdmin, AuthedRequest } from "../../middleware/requireAdmin";
import { requireRole } from "../../middleware/requireRole";
import { cancelEventBooking, markEventBookingPaidManually, EventError } from "../../services/eventService";
import { sendEventBookingConfirmationEmail } from "../../services/emailService";
import { parseDateOnly } from "../../lib/dateOnly";
import { sendExcel } from "../../lib/excelExport";

const router = Router();
router.use(requireAdmin);

const VIEW_ROLES = ["SUPER_ADMIN", "LOCATION_MANAGER", "BOOKING_STAFF", "FINANCE"] as const;
const CANCEL_ROLES = ["SUPER_ADMIN", "LOCATION_MANAGER", "BOOKING_STAFF"] as const;

// Shared by GET / and GET /export — defaults to every event, from today
// onward, when eventId/from/to are omitted.
function queryEventBookings(query: { eventId?: string; from?: string; to?: string }) {
  const fromDate = parseDateOnly(query.from || new Date().toISOString().slice(0, 10));
  const toDate = query.to ? parseDateOnly(query.to) : undefined;

  return prisma.eventBooking.findMany({
    where: {
      eventId: query.eventId || undefined,
      status: { not: "CANCELLED" },
      event: { eventDate: { gte: fromDate, ...(toDate ? { lte: toDate } : {}) } },
    },
    include: { tier: true, event: true },
    orderBy: [{ event: { eventDate: "asc" } }, { createdAt: "asc" }],
  });
}

// GET /api/admin/event-bookings?eventId=&from=&to=
router.get("/", requireRole(...VIEW_ROLES), async (req, res) => {
  res.json(await queryEventBookings(req.query as any));
});

// GET /api/admin/event-bookings/export?eventId=&from=&to=
router.get("/export", requireRole(...VIEW_ROLES), async (req, res) => {
  const bookings = await queryEventBookings(req.query as any);
  await sendExcel(
    res,
    `event-bookings-${new Date().toISOString().slice(0, 10)}.xlsx`,
    "Event Bookings",
    [
      { header: "Reference", key: "bookingCode", width: 24 },
      { header: "Event", key: "event", width: 26 },
      { header: "Event date", key: "eventDate", width: 12 },
      { header: "Ticket tier", key: "tier", width: 18 },
      { header: "Guest name", key: "guestName", width: 22 },
      { header: "Email", key: "guestEmail", width: 26 },
      { header: "Phone", key: "guestPhone", width: 16 },
      { header: "Room", key: "roomNumber", width: 10 },
      { header: "Qty", key: "quantity", width: 8 },
      { header: "Amount", key: "amountTotal", width: 12 },
      { header: "Currency", key: "currency", width: 10 },
      { header: "Status", key: "status", width: 14 },
      { header: "Payment status", key: "paymentStatus", width: 16 },
      { header: "Payment method", key: "paymentMethod", width: 16 },
      { header: "Source", key: "source", width: 16 },
      { header: "Booking ID", key: "id", width: 26 },
      { header: "Created", key: "createdAt", width: 20 },
    ],
    bookings.map((b) => ({
      bookingCode: b.bookingCode ?? "",
      event: b.event?.title ?? "",
      eventDate: b.event?.eventDate.toISOString().slice(0, 10) ?? "",
      tier: b.tier?.name ?? "",
      guestName: b.guestName,
      guestEmail: b.guestEmail,
      guestPhone: b.guestPhone ?? "",
      roomNumber: b.roomNumber ?? "",
      quantity: b.quantity,
      amountTotal: Number(b.amountTotal),
      currency: b.currency,
      status: b.status,
      paymentStatus: b.paymentStatus,
      paymentMethod: b.paymentMethod ?? "",
      source: b.source,
      id: b.id,
      createdAt: b.createdAt.toISOString(),
    }))
  );
});

// POST /api/admin/event-bookings/:id/cancel
router.post("/:id/cancel", requireRole(...CANCEL_ROLES), async (req: AuthedRequest, res) => {
  const { reason } = req.body as { reason?: string };
  await cancelEventBooking(req.params.id, { adminUserId: req.admin!.sub, actorLabel: req.admin!.email }, reason);
  res.json({ ok: true });
});

// POST /api/admin/event-bookings/:id/mark-paid
router.post("/:id/mark-paid", requireRole(...CANCEL_ROLES), async (req: AuthedRequest, res) => {
  try {
    const booking = await markEventBookingPaidManually(req.params.id, {
      adminUserId: req.admin!.sub,
      actorLabel: req.admin!.email,
    });
    const [event, tier] = await Promise.all([
      prisma.event.findUnique({ where: { id: booking.eventId } }),
      prisma.eventTicketTier.findUnique({ where: { id: booking.tierId } }),
    ]);
    if (event && tier) await sendEventBookingConfirmationEmail(booking, event, tier);
    res.json(booking);
  } catch (err) {
    if (err instanceof EventError) return res.status(err.status).json({ error: err.message });
    throw err;
  }
});

export default router;
