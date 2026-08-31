import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { requireAdmin, AuthedRequest } from "../../middleware/requireAdmin";
import { requireRole } from "../../middleware/requireRole";
import { parseDateOnly } from "../../lib/dateOnly";
import { logAudit } from "../../lib/auditLog";

const router = Router();
router.use(requireAdmin);

const VIEW_ROLES = ["SUPER_ADMIN", "LOCATION_MANAGER", "BOOKING_STAFF", "FINANCE"] as const;
const EDIT_ROLES = ["SUPER_ADMIN", "LOCATION_MANAGER"] as const;

const eventSchema = z.object({
  locationId: z.string(),
  title: z.string().min(1),
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/, "slug must be lowercase, alphanumeric, hyphen-separated"),
  description: z.string().min(1),
  images: z.array(z.string()).optional(),
  eventDate: z.string(), // "2026-12-31"
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  venue: z.string().optional(),
  mapUrl: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "DRAFT", "SOLD_OUT"]).optional(),
});

// GET /api/admin/events — all events regardless of status/date
router.get("/", requireRole(...VIEW_ROLES), async (_req, res) => {
  const events = await prisma.event.findMany({
    include: { ticketTiers: true, _count: { select: { bookings: true } } },
    orderBy: { eventDate: "desc" },
  });
  res.json(events);
});

router.get("/:id", requireRole(...VIEW_ROLES), async (req, res) => {
  const event = await prisma.event.findUnique({
    where: { id: req.params.id },
    include: { ticketTiers: { orderBy: { price: "asc" } } },
  });
  if (!event) return res.status(404).json({ error: "Event not found" });
  res.json(event);
});

// POST /api/admin/events — create
router.post("/", requireRole(...EDIT_ROLES), async (req: AuthedRequest, res) => {
  const parsed = eventSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });

  const { eventDate, ...data } = parsed.data;
  const event = await prisma.event.create({ data: { ...data, eventDate: parseDateOnly(eventDate) } });

  await logAudit(
    { adminUserId: req.admin!.sub, actorLabel: req.admin!.email },
    "event.created",
    "Event",
    event.id,
    { title: event.title }
  );

  res.status(201).json(event);
});

// PUT /api/admin/events/:id — update
router.put("/:id", requireRole(...EDIT_ROLES), async (req: AuthedRequest, res) => {
  const parsed = eventSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });

  const { eventDate, ...data } = parsed.data;
  const event = await prisma.event.update({
    where: { id: req.params.id },
    data: { ...data, eventDate: eventDate ? parseDateOnly(eventDate) : undefined },
  });

  await logAudit(
    { adminUserId: req.admin!.sub, actorLabel: req.admin!.email },
    "event.updated",
    "Event",
    event.id,
    { changedFields: Object.keys(parsed.data) }
  );

  res.json(event);
});

// DELETE /api/admin/events/:id
router.delete("/:id", requireRole(...EDIT_ROLES), async (req: AuthedRequest, res) => {
  await prisma.event.delete({ where: { id: req.params.id } });

  await logAudit(
    { adminUserId: req.admin!.sub, actorLabel: req.admin!.email },
    "event.deleted",
    "Event",
    req.params.id
  );

  res.status(204).send();
});

// --- Ticket tier management ---

// POST /api/admin/events/:id/tiers — add a ticket tier
router.post("/:id/tiers", requireRole(...EDIT_ROLES), async (req: AuthedRequest, res) => {
  const schema = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    price: z.number().nonnegative(),
    capacity: z.number().int().positive(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });

  try {
    const tier = await prisma.eventTicketTier.create({ data: { eventId: req.params.id, ...parsed.data } });
    await logAudit(
      { adminUserId: req.admin!.sub, actorLabel: req.admin!.email },
      "event_tier.created",
      "EventTicketTier",
      tier.id,
      { name: tier.name, price: tier.price.toString(), capacity: tier.capacity }
    );
    res.status(201).json(tier);
  } catch {
    res.status(409).json({ error: "A tier with this name already exists for this event" });
  }
});

// PUT /api/admin/events/tiers/:tierId
router.put("/tiers/:tierId", requireRole(...EDIT_ROLES), async (req, res) => {
  const schema = z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    price: z.number().nonnegative().optional(),
    capacity: z.number().int().positive().optional(),
    isActive: z.boolean().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });

  const tier = await prisma.eventTicketTier.update({ where: { id: req.params.tierId }, data: parsed.data });
  res.json(tier);
});

// DELETE /api/admin/events/tiers/:tierId
router.delete("/tiers/:tierId", requireRole(...EDIT_ROLES), async (req, res) => {
  await prisma.eventTicketTier.delete({ where: { id: req.params.tierId } });
  res.status(204).send();
});

export default router;
