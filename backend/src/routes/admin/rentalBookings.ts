import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { requireAdmin, AuthedRequest } from "../../middleware/requireAdmin";
import { requireRole } from "../../middleware/requireRole";
import { cancelRentalBooking, markRentalBookingPaidManually, RentalError } from "../../services/rentalService";
import { sendRentalBookingConfirmationEmail } from "../../services/emailService";
import { parseDateOnly } from "../../lib/dateOnly";
import { sendExcel } from "../../lib/excelExport";

const router = Router();
router.use(requireAdmin);

const VIEW_ROLES = ["SUPER_ADMIN", "LOCATION_MANAGER", "BOOKING_STAFF", "FINANCE"] as const;
const CANCEL_ROLES = ["SUPER_ADMIN", "LOCATION_MANAGER", "BOOKING_STAFF"] as const;

// Shared by GET / and GET /export — defaults to every rental item, from
// today onward, when rentalItemId/from/to are omitted.
function queryRentalBookings(query: { rentalItemId?: string; from?: string; to?: string; timeSlotId?: string }) {
  const fromDate = parseDateOnly(query.from || new Date().toISOString().slice(0, 10));
  const toDate = query.to ? parseDateOnly(query.to) : undefined;

  return prisma.rentalBooking.findMany({
    where: {
      rentalItemId: query.rentalItemId || undefined,
      timeSlotId: query.timeSlotId || undefined,
      date: { gte: fromDate, ...(toDate ? { lte: toDate } : {}) },
    },
    include: { spot: true, timeSlot: true, rentalItem: true },
    orderBy: [{ date: "asc" }, { timeSlot: { startTime: "asc" } }, { spot: { code: "asc" } }],
  });
}

// GET /api/admin/rental-bookings?rentalItemId=&from=&to=&timeSlotId=
router.get("/", requireRole(...VIEW_ROLES), async (req, res) => {
  res.json(await queryRentalBookings(req.query as any));
});

// GET /api/admin/rental-bookings/export?rentalItemId=&from=&to=&timeSlotId=
router.get("/export", requireRole(...VIEW_ROLES), async (req, res) => {
  const bookings = await queryRentalBookings(req.query as any);
  await sendExcel(
    res,
    `rental-bookings-${new Date().toISOString().slice(0, 10)}.xlsx`,
    "Rental Bookings",
    [
      { header: "Rental item", key: "rentalItem", width: 24 },
      { header: "Date", key: "date", width: 12 },
      { header: "Time slot", key: "timeSlot", width: 20 },
      { header: "Spot", key: "spot", width: 16 },
      { header: "Guest name", key: "guestName", width: 22 },
      { header: "Email", key: "guestEmail", width: 26 },
      { header: "Phone", key: "guestPhone", width: 16 },
      { header: "Room", key: "roomNumber", width: 10 },
      { header: "Adults", key: "adultCount", width: 8 },
      { header: "Children", key: "childCount", width: 8 },
      { header: "Chairs", key: "quantity", width: 8 },
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
      rentalItem: b.rentalItem?.name ?? "",
      date: b.date.toISOString().slice(0, 10),
      timeSlot: b.timeSlot ? `${b.timeSlot.label} (${b.timeSlot.startTime}-${b.timeSlot.endTime})` : "",
      spot: b.spot?.code ?? "",
      guestName: b.guestName,
      guestEmail: b.guestEmail,
      guestPhone: b.guestPhone ?? "",
      roomNumber: b.roomNumber ?? "",
      adultCount: b.adultCount,
      childCount: b.childCount,
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

// POST /api/admin/rental-bookings/:id/cancel
router.post("/:id/cancel", requireRole(...CANCEL_ROLES), async (req: AuthedRequest, res) => {
  const { reason } = req.body as { reason?: string };
  await cancelRentalBooking(req.params.id, { adminUserId: req.admin!.sub, actorLabel: req.admin!.email }, reason);
  res.json({ ok: true });
});

// POST /api/admin/rental-bookings/:id/mark-paid
router.post("/:id/mark-paid", requireRole(...CANCEL_ROLES), async (req: AuthedRequest, res) => {
  try {
    const booking = await markRentalBookingPaidManually(req.params.id, {
      adminUserId: req.admin!.sub,
      actorLabel: req.admin!.email,
    });
    const [item, spot, timeSlot] = await Promise.all([
      prisma.rentalItem.findUnique({ where: { id: booking.rentalItemId } }),
      prisma.rentalSpot.findUnique({ where: { id: booking.spotId } }),
      prisma.rentalTimeSlot.findUnique({ where: { id: booking.timeSlotId } }),
    ]);
    if (item && spot && timeSlot) await sendRentalBookingConfirmationEmail(booking, item, spot, timeSlot);
    res.json(booking);
  } catch (err) {
    if (err instanceof RentalError) return res.status(err.status).json({ error: err.message });
    throw err;
  }
});

export default router;
