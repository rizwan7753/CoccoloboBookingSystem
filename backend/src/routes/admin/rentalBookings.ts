import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { requireAdmin, AuthedRequest } from "../../middleware/requireAdmin";
import { requireRole } from "../../middleware/requireRole";
import { cancelRentalBooking } from "../../services/rentalService";
import { parseDateOnly } from "../../lib/dateOnly";

const router = Router();
router.use(requireAdmin);

const VIEW_ROLES = ["SUPER_ADMIN", "LOCATION_MANAGER", "BOOKING_STAFF", "FINANCE"] as const;
const CANCEL_ROLES = ["SUPER_ADMIN", "LOCATION_MANAGER", "BOOKING_STAFF"] as const;

// GET /api/admin/rental-bookings?rentalItemId=&date=&timeSlotId= — the day's
// reservations, optionally scoped to one time slot (timeSlotId omitted -> all slots for the date)
router.get("/", requireRole(...VIEW_ROLES), async (req, res) => {
  const { rentalItemId, date, timeSlotId } = req.query as { rentalItemId?: string; date?: string; timeSlotId?: string };
  if (!rentalItemId || !date) return res.status(400).json({ error: "rentalItemId and date are required" });

  const bookings = await prisma.rentalBooking.findMany({
    where: { rentalItemId, date: parseDateOnly(date), timeSlotId: timeSlotId || undefined },
    include: { spot: true, timeSlot: true },
    orderBy: [{ timeSlot: { startTime: "asc" } }, { spot: { code: "asc" } }],
  });
  res.json(bookings);
});

// POST /api/admin/rental-bookings/:id/cancel
router.post("/:id/cancel", requireRole(...CANCEL_ROLES), async (req: AuthedRequest, res) => {
  const { reason } = req.body as { reason?: string };
  await cancelRentalBooking(req.params.id, { adminUserId: req.admin!.sub, actorLabel: req.admin!.email }, reason);
  res.json({ ok: true });
});

export default router;
