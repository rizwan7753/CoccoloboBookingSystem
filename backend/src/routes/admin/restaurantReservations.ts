import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { requireAdmin, AuthedRequest } from "../../middleware/requireAdmin";
import { requirePermission } from "../../middleware/requirePermission";
import { parseDateOnly } from "../../lib/dateOnly";
import { logAudit } from "../../lib/auditLog";
import { sendExcel } from "../../lib/excelExport";

const router = Router();
router.use(requireAdmin);

const STATUSES = ["NEW", "CONTACTED", "CONFIRMED", "DECLINED"] as const;

// Shared by GET / and GET /export — defaults to today onward when from/to are omitted.
function queryReservations(query: { from?: string; to?: string; status?: string }) {
  const fromDate = parseDateOnly(query.from || new Date().toISOString().slice(0, 10));
  const toDate = query.to ? parseDateOnly(query.to) : undefined;

  return prisma.restaurantReservation.findMany({
    where: {
      status: (query.status as string) || undefined,
      date: { gte: fromDate, ...(toDate ? { lte: toDate } : {}) },
    },
    orderBy: [{ date: "asc" }, { time: "asc" }],
  });
}

// GET /api/admin/restaurant-reservations?from=&to=&status=
router.get("/", requirePermission("restaurant.view"), async (req, res) => {
  const reservations = await queryReservations(req.query as { from?: string; to?: string; status?: string });
  res.json(reservations);
});

// GET /api/admin/restaurant-reservations/export?from=&to=&status=
router.get("/export", requirePermission("restaurant.view"), async (req, res) => {
  const reservations = await queryReservations(req.query as { from?: string; to?: string; status?: string });
  await sendExcel(
    res,
    `restaurant-reservations-${new Date().toISOString().slice(0, 10)}.xlsx`,
    "Reservations",
    [
      { header: "Reference", key: "bookingCode", width: 24 },
      { header: "Guest name", key: "guestName", width: 22 },
      { header: "Email", key: "guestEmail", width: 26 },
      { header: "Phone", key: "guestPhone", width: 16 },
      { header: "No of People", key: "partySize", width: 12 },
      { header: "Date", key: "date", width: 12 },
      { header: "Time", key: "time", width: 10 },
      { header: "Status", key: "status", width: 14 },
      { header: "Notes", key: "specialRequests", width: 30 },
      { header: "Created", key: "createdAt", width: 20 },
    ],
    reservations.map((r) => ({
      bookingCode: r.bookingCode ?? "",
      guestName: r.guestName,
      guestEmail: r.guestEmail,
      guestPhone: r.guestPhone ?? "",
      partySize: r.partySize,
      date: r.date.toISOString().slice(0, 10),
      time: r.time,
      status: r.status,
      specialRequests: r.specialRequests ?? "",
      createdAt: r.createdAt.toISOString(),
    }))
  );
});

// PUT /api/admin/restaurant-reservations/:id/status — staff update after following up with the guest
router.put("/:id/status", requirePermission("restaurant.manage_reservations"), async (req: AuthedRequest, res) => {
  const parsed = z.object({ status: z.enum(STATUSES) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid status" });

  const reservation = await prisma.restaurantReservation.update({
    where: { id: req.params.id },
    data: { status: parsed.data.status },
  });
  await logAudit(
    { adminUserId: req.admin!.sub, actorLabel: req.admin!.email },
    "restaurant_reservation.status_updated",
    "RestaurantReservation",
    reservation.id,
    { status: reservation.status }
  );
  res.json(reservation);
});

// DELETE /api/admin/restaurant-reservations/:id — remove a spam/duplicate enquiry
router.delete("/:id", requirePermission("restaurant.manage_reservations"), async (req: AuthedRequest, res) => {
  await prisma.restaurantReservation.delete({ where: { id: req.params.id } });
  await logAudit(
    { adminUserId: req.admin!.sub, actorLabel: req.admin!.email },
    "restaurant_reservation.deleted",
    "RestaurantReservation",
    req.params.id
  );
  res.status(204).send();
});

export default router;
