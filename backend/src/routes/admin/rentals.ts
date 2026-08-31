import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { requireAdmin, AuthedRequest } from "../../middleware/requireAdmin";
import { requireRole } from "../../middleware/requireRole";
import { logAudit } from "../../lib/auditLog";

const router = Router();
router.use(requireAdmin);

const VIEW_ROLES = ["SUPER_ADMIN", "LOCATION_MANAGER", "BOOKING_STAFF", "FINANCE"] as const;
const EDIT_ROLES = ["SUPER_ADMIN", "LOCATION_MANAGER"] as const;

const rentalItemSchema = z.object({
  locationId: z.string(),
  name: z.string().min(1),
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/, "slug must be lowercase, alphanumeric, hyphen-separated"),
  description: z.string().min(1),
  images: z.array(z.string()).optional(),
  durationMinutes: z.number().int().positive().optional(),
  priceAdult: z.number().nonnegative(),
  priceChild: z.number().nonnegative().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "DRAFT", "SOLD_OUT"]).optional(),
});

// GET /api/admin/rentals — all rental items regardless of status
router.get("/", requireRole(...VIEW_ROLES), async (_req, res) => {
  const items = await prisma.rentalItem.findMany({
    include: { spots: true, timeSlots: true, _count: { select: { bookings: true } } },
    orderBy: { createdAt: "desc" },
  });
  res.json(items);
});

router.get("/:id", requireRole(...VIEW_ROLES), async (req, res) => {
  const item = await prisma.rentalItem.findUnique({
    where: { id: req.params.id },
    include: {
      spots: { orderBy: { code: "asc" } },
      timeSlots: { orderBy: { startTime: "asc" } },
    },
  });
  if (!item) return res.status(404).json({ error: "Rental item not found" });
  res.json(item);
});

// POST /api/admin/rentals — create
router.post("/", requireRole(...EDIT_ROLES), async (req: AuthedRequest, res) => {
  const parsed = rentalItemSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });

  const item = await prisma.rentalItem.create({ data: parsed.data });

  await logAudit(
    { adminUserId: req.admin!.sub, actorLabel: req.admin!.email },
    "rental_item.created",
    "RentalItem",
    item.id,
    { name: item.name }
  );

  res.status(201).json(item);
});

// PUT /api/admin/rentals/:id — update
router.put("/:id", requireRole(...EDIT_ROLES), async (req: AuthedRequest, res) => {
  const parsed = rentalItemSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });

  const item = await prisma.rentalItem.update({ where: { id: req.params.id }, data: parsed.data });

  await logAudit(
    { adminUserId: req.admin!.sub, actorLabel: req.admin!.email },
    "rental_item.updated",
    "RentalItem",
    item.id,
    { changedFields: Object.keys(parsed.data) }
  );

  res.json(item);
});

// DELETE /api/admin/rentals/:id
router.delete("/:id", requireRole(...EDIT_ROLES), async (req: AuthedRequest, res) => {
  await prisma.rentalItem.delete({ where: { id: req.params.id } });

  await logAudit(
    { adminUserId: req.admin!.sub, actorLabel: req.admin!.email },
    "rental_item.deleted",
    "RentalItem",
    req.params.id
  );

  res.status(204).send();
});

// --- Spot management ---

// POST /api/admin/rentals/:id/spots — add a spot (e.g. "Row A", holding `quantity` chairs)
router.post("/:id/spots", requireRole(...EDIT_ROLES), async (req: AuthedRequest, res) => {
  const schema = z.object({ code: z.string().min(1), quantity: z.number().int().positive() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });

  try {
    const spot = await prisma.rentalSpot.create({
      data: { rentalItemId: req.params.id, code: parsed.data.code, quantity: parsed.data.quantity },
    });
    await logAudit(
      { adminUserId: req.admin!.sub, actorLabel: req.admin!.email },
      "rental_spot.created",
      "RentalSpot",
      spot.id,
      { code: spot.code, quantity: spot.quantity }
    );
    res.status(201).json(spot);
  } catch {
    res.status(409).json({ error: "A spot with this code already exists for this rental item" });
  }
});

// PUT /api/admin/rentals/spots/:spotId — rename, change quantity, or activate/deactivate a spot
router.put("/spots/:spotId", requireRole(...EDIT_ROLES), async (req, res) => {
  const schema = z.object({
    code: z.string().min(1).optional(),
    quantity: z.number().int().positive().optional(),
    isActive: z.boolean().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });

  const spot = await prisma.rentalSpot.update({ where: { id: req.params.spotId }, data: parsed.data });
  res.json(spot);
});

// DELETE /api/admin/rentals/spots/:spotId
router.delete("/spots/:spotId", requireRole(...EDIT_ROLES), async (req, res) => {
  await prisma.rentalSpot.delete({ where: { id: req.params.spotId } });
  res.status(204).send();
});

// --- Time slot management ---

// POST /api/admin/rentals/:id/time-slots — add a bookable time window (e.g. "Morning", 09:00-13:00)
router.post("/:id/time-slots", requireRole(...EDIT_ROLES), async (req: AuthedRequest, res) => {
  const schema = z.object({
    label: z.string().min(1),
    startTime: z.string().regex(/^\d{2}:\d{2}$/),
    endTime: z.string().regex(/^\d{2}:\d{2}$/),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });

  try {
    const timeSlot = await prisma.rentalTimeSlot.create({ data: { rentalItemId: req.params.id, ...parsed.data } });
    await logAudit(
      { adminUserId: req.admin!.sub, actorLabel: req.admin!.email },
      "rental_time_slot.created",
      "RentalTimeSlot",
      timeSlot.id,
      { label: timeSlot.label, startTime: timeSlot.startTime, endTime: timeSlot.endTime }
    );
    res.status(201).json(timeSlot);
  } catch {
    res.status(409).json({ error: "A time slot with this label already exists for this rental item" });
  }
});

function formatTime12h(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + minutes;
  return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

// POST /api/admin/rentals/:id/time-slots/generate — carve an operating
// window into consecutive slots of the item's durationMinutes (e.g.
// 09:00-17:00 with a 4h duration -> "9:00 AM - 1:00 PM", "1:00 PM - 5:00 PM").
// Skips any slot whose label already exists rather than erroring.
router.post("/:id/time-slots/generate", requireRole(...EDIT_ROLES), async (req: AuthedRequest, res) => {
  const schema = z.object({
    operatingStart: z.string().regex(/^\d{2}:\d{2}$/),
    operatingEnd: z.string().regex(/^\d{2}:\d{2}$/),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });

  const item = await prisma.rentalItem.findUnique({ where: { id: req.params.id } });
  if (!item) return res.status(404).json({ error: "Rental item not found" });

  const toMinutes = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };
  const startMin = toMinutes(parsed.data.operatingStart);
  const endMin = toMinutes(parsed.data.operatingEnd);
  if (endMin <= startMin) return res.status(400).json({ error: "operatingEnd must be after operatingStart" });

  const created = [];
  const skipped = [];
  for (let cursor = startMin; cursor + item.durationMinutes <= endMin; cursor += item.durationMinutes) {
    const startTime = `${String(Math.floor(cursor / 60)).padStart(2, "0")}:${String(cursor % 60).padStart(2, "0")}`;
    const endTime = addMinutes(startTime, item.durationMinutes);
    const label = `${formatTime12h(startTime)} - ${formatTime12h(endTime)}`;
    try {
      const slot = await prisma.rentalTimeSlot.create({
        data: { rentalItemId: item.id, label, startTime, endTime },
      });
      created.push(slot);
    } catch {
      skipped.push(label);
    }
  }

  if (created.length > 0) {
    await logAudit(
      { adminUserId: req.admin!.sub, actorLabel: req.admin!.email },
      "rental_time_slot.generated",
      "RentalItem",
      item.id,
      { count: created.length, durationMinutes: item.durationMinutes }
    );
  }

  res.status(201).json({ created, skipped });
});

// PUT /api/admin/rentals/time-slots/:timeSlotId
router.put("/time-slots/:timeSlotId", requireRole(...EDIT_ROLES), async (req, res) => {
  const schema = z.object({
    label: z.string().min(1).optional(),
    startTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    endTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    isActive: z.boolean().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });

  const timeSlot = await prisma.rentalTimeSlot.update({ where: { id: req.params.timeSlotId }, data: parsed.data });
  res.json(timeSlot);
});

// DELETE /api/admin/rentals/time-slots/:timeSlotId
router.delete("/time-slots/:timeSlotId", requireRole(...EDIT_ROLES), async (req, res) => {
  await prisma.rentalTimeSlot.delete({ where: { id: req.params.timeSlotId } });
  res.status(204).send();
});

export default router;
