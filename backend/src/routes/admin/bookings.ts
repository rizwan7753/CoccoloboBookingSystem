import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { requireAdmin, AuthedRequest } from "../../middleware/requireAdmin";
import { requireRole } from "../../middleware/requireRole";
import { releaseBooking } from "../../services/bookingService";
import { parseDateOnly } from "../../lib/dateOnly";

const router = Router();
router.use(requireAdmin);

// Every staff role can view bookings/manifests; only Finance is read-only (spec §14).
const VIEW_ROLES = ["SUPER_ADMIN", "LOCATION_MANAGER", "BOOKING_STAFF", "FINANCE"] as const;
const CANCEL_ROLES = ["SUPER_ADMIN", "LOCATION_MANAGER", "BOOKING_STAFF"] as const;

// GET /api/admin/bookings?excursionId=&date=&status=
router.get("/", requireRole(...VIEW_ROLES), async (req, res) => {
  const { excursionId, date, status } = req.query as { excursionId?: string; date?: string; status?: string };

  const bookings = await prisma.booking.findMany({
    where: {
      excursionId: excursionId || undefined,
      status: (status as any) || undefined,
      slot: date ? { date: parseDateOnly(date) } : undefined,
    },
    include: { excursion: true, slot: true },
    orderBy: { createdAt: "desc" },
  });
  res.json(bookings);
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

export default router;
