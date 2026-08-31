import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { requireAdmin, AuthedRequest } from "../../middleware/requireAdmin";
import { requireRole } from "../../middleware/requireRole";
import { cancelEventBooking } from "../../services/eventService";

const router = Router();
router.use(requireAdmin);

const VIEW_ROLES = ["SUPER_ADMIN", "LOCATION_MANAGER", "BOOKING_STAFF", "FINANCE"] as const;
const CANCEL_ROLES = ["SUPER_ADMIN", "LOCATION_MANAGER", "BOOKING_STAFF"] as const;

// GET /api/admin/event-bookings?eventId= — the attendee list for an event
router.get("/", requireRole(...VIEW_ROLES), async (req, res) => {
  const { eventId } = req.query as { eventId?: string };
  if (!eventId) return res.status(400).json({ error: "eventId is required" });

  const bookings = await prisma.eventBooking.findMany({
    where: { eventId, status: { not: "CANCELLED" } },
    include: { tier: true },
    orderBy: { createdAt: "asc" },
  });
  res.json(bookings);
});

// POST /api/admin/event-bookings/:id/cancel
router.post("/:id/cancel", requireRole(...CANCEL_ROLES), async (req: AuthedRequest, res) => {
  const { reason } = req.body as { reason?: string };
  await cancelEventBooking(req.params.id, { adminUserId: req.admin!.sub, actorLabel: req.admin!.email }, reason);
  res.json({ ok: true });
});

export default router;
