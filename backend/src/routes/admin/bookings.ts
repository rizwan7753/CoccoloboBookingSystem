import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { requireAdmin, AuthedRequest } from "../../middleware/requireAdmin";
import { requireRole } from "../../middleware/requireRole";
import { releaseBooking, markBookingPaidManually, BookingError } from "../../services/bookingService";
import { sendBookingConfirmationEmail } from "../../services/emailService";
import { parseDateOnly } from "../../lib/dateOnly";
import { sendExcel } from "../../lib/excelExport";

const router = Router();
router.use(requireAdmin);

// Every staff role can view bookings/manifests; only Finance is read-only (spec §14).
const VIEW_ROLES = ["SUPER_ADMIN", "LOCATION_MANAGER", "BOOKING_STAFF", "FINANCE"] as const;
const CANCEL_ROLES = ["SUPER_ADMIN", "LOCATION_MANAGER", "BOOKING_STAFF"] as const;

// Shared by GET / and GET /export — defaults to every excursion, from today
// onward, when excursionId/from/to are omitted.
function queryBookings(query: { excursionId?: string; from?: string; to?: string; status?: string }) {
  const fromDate = parseDateOnly(query.from || new Date().toISOString().slice(0, 10));
  const toDate = query.to ? parseDateOnly(query.to) : undefined;

  return prisma.booking.findMany({
    where: {
      excursionId: query.excursionId || undefined,
      status: (query.status as any) || undefined,
      slot: { date: { gte: fromDate, ...(toDate ? { lte: toDate } : {}) } },
    },
    include: { excursion: true, slot: true },
    orderBy: [{ slot: { date: "asc" } }, { slot: { time: "asc" } }],
  });
}

// GET /api/admin/bookings?excursionId=&from=&to=&status=
router.get("/", requireRole(...VIEW_ROLES), async (req, res) => {
  res.json(await queryBookings(req.query as any));
});

// GET /api/admin/bookings/export?excursionId=&from=&to=&status= — same
// filters as the list view, downloaded as an .xlsx workbook.
router.get("/export", requireRole(...VIEW_ROLES), async (req, res) => {
  const bookings = await queryBookings(req.query as any);
  await sendExcel(
    res,
    `bookings-${new Date().toISOString().slice(0, 10)}.xlsx`,
    "Bookings",
    [
      { header: "Reference", key: "bookingCode", width: 24 },
      { header: "Excursion", key: "excursion", width: 28 },
      { header: "Date", key: "date", width: 12 },
      { header: "Time", key: "time", width: 10 },
      { header: "Guest name", key: "guestName", width: 22 },
      { header: "Email", key: "guestEmail", width: 26 },
      { header: "Phone", key: "guestPhone", width: 16 },
      { header: "Room", key: "roomNumber", width: 10 },
      { header: "Adults", key: "adultCount", width: 8 },
      { header: "Children", key: "childCount", width: 8 },
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
      excursion: b.excursion?.title ?? "",
      date: b.slot?.date.toISOString().slice(0, 10) ?? "",
      time: b.slot?.time ?? "",
      guestName: b.guestName,
      guestEmail: b.guestEmail,
      guestPhone: b.guestPhone ?? "",
      roomNumber: b.roomNumber ?? "",
      adultCount: b.adultCount,
      childCount: b.childCount,
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

// GET /api/admin/bookings/manifest?excursionId=&date=&time= — daily passenger manifest
router.get("/manifest", requireRole(...VIEW_ROLES), async (req, res) => {
  const { excursionId, date, time } = req.query as { excursionId?: string; date?: string; time?: string };
  if (!excursionId || !date || !time) {
    return res.status(400).json({ error: "excursionId, date, and time are required" });
  }

  const slot = await prisma.departureSlot.findUnique({
    where: { excursionId_date_time: { excursionId, date: parseDateOnly(date), time } },
  });
  if (!slot) return res.json({ slot: null, bookings: [] });

  const bookings = await prisma.booking.findMany({
    where: { slotId: slot.id, status: { not: "CANCELLED" } },
    orderBy: { createdAt: "asc" },
  });

  res.json({ slot, bookings });
});

// POST /api/admin/bookings/:id/cancel — staff-initiated cancellation, releases capacity
router.post("/:id/cancel", requireRole(...CANCEL_ROLES), async (req: AuthedRequest, res) => {
  const { reason } = req.body as { reason?: string };
  await releaseBooking(
    req.params.id,
    { adminUserId: req.admin!.sub, actorLabel: req.admin!.email },
    reason
  );
  res.json({ ok: true });
});

// POST /api/admin/bookings/:id/mark-paid — confirm an offline (bank
// deposit/transfer) booking once staff have verified the payment arrived.
router.post("/:id/mark-paid", requireRole(...CANCEL_ROLES), async (req: AuthedRequest, res) => {
  try {
    const booking = await markBookingPaidManually(req.params.id, {
      adminUserId: req.admin!.sub,
      actorLabel: req.admin!.email,
    });
    const excursion = await prisma.excursion.findUnique({ where: { id: booking.excursionId } });
    if (excursion) await sendBookingConfirmationEmail(booking, excursion);
    res.json(booking);
  } catch (err) {
    if (err instanceof BookingError) return res.status(err.status).json({ error: err.message });
    throw err;
  }
});

export default router;
