import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { requireAdmin, AuthedRequest } from "../../middleware/requireAdmin";
import { requireRole } from "../../middleware/requireRole";
import { parseDateOnly } from "../../lib/dateOnly";
import { logAudit } from "../../lib/auditLog";

const router = Router();
router.use(requireAdmin);

// Excursion/capacity/schedule config is Location Manager+ per spec §14 —
// Booking Staff and Finance can view but not edit excursion setup.
const VIEW_ROLES = ["SUPER_ADMIN", "LOCATION_MANAGER", "BOOKING_STAFF", "FINANCE"] as const;
const EDIT_ROLES = ["SUPER_ADMIN", "LOCATION_MANAGER"] as const;

const departureTimeSchema = z.object({
  time: z.string().regex(/^\d{2}:\d{2}$/),
  daysOfWeek: z.array(z.number().int().min(0).max(6)),
});

const excursionSchema = z.object({
  locationId: z.string(),
  title: z.string().min(1),
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/, "slug must be lowercase, alphanumeric, hyphen-separated"),
  description: z.string().min(1),
  included: z.string().optional(),
  excluded: z.string().optional(),
  durationMinutes: z.number().int().positive(),
  meetingPoint: z.string().optional(),
  mapUrl: z.string().optional(),
  whatToBring: z.string().optional(),
  images: z.array(z.string()).optional(),
  cardImageUrl: z.string().optional(),
  headerImageUrl: z.string().optional(),
  pricingType: z.enum(["PER_GUEST", "FLAT_RATE"]).optional(),
  priceAdult: z.number().nonnegative(),
  priceChild: z.number().nonnegative().optional(),
  capacityDefault: z.number().int().positive(),
  cutoffTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "DRAFT", "SOLD_OUT"]).optional(),
  departureTimes: z.array(departureTimeSchema).optional(),
});

// GET /api/admin/excursions — all excursions regardless of status
router.get("/", requireRole(...VIEW_ROLES), async (_req, res) => {
  const excursions = await prisma.excursion.findMany({
    include: { departureTimes: true },
    orderBy: { createdAt: "desc" },
  });
  res.json(excursions);
});

router.get("/:id", requireRole(...VIEW_ROLES), async (req, res) => {
  const excursion = await prisma.excursion.findUnique({
    where: { id: req.params.id },
    include: { departureTimes: true },
  });
  if (!excursion) return res.status(404).json({ error: "Excursion not found" });
  res.json(excursion);
});

// POST /api/admin/excursions — create
router.post("/", requireRole(...EDIT_ROLES), async (req: AuthedRequest, res) => {
  const parsed = excursionSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });

  const { departureTimes, ...data } = parsed.data;
  const excursion = await prisma.excursion.create({
    data: {
      ...data,
      departureTimes: departureTimes ? { create: departureTimes } : undefined,
    },
    include: { departureTimes: true },
  });

  await logAudit(
    { adminUserId: req.admin!.sub, actorLabel: req.admin!.email },
    "excursion.created",
    "Excursion",
    excursion.id,
    { title: excursion.title }
  );

  res.status(201).json(excursion);
});

// PUT /api/admin/excursions/:id — update
router.put("/:id", requireRole(...EDIT_ROLES), async (req: AuthedRequest, res) => {
  const parsed = excursionSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });

  const { departureTimes, ...data } = parsed.data;

  const excursion = await prisma.$transaction(async (tx) => {
    if (departureTimes) {
      await tx.departureTime.deleteMany({ where: { excursionId: req.params.id } });
      await tx.departureTime.createMany({
        data: departureTimes.map((dt) => ({ ...dt, excursionId: req.params.id })),
      });
    }
    const updated = await tx.excursion.update({
      where: { id: req.params.id },
      data,
      include: { departureTimes: true },
    });

    await logAudit(
      { adminUserId: req.admin!.sub, actorLabel: req.admin!.email },
      "excursion.updated",
      "Excursion",
      updated.id,
      { changedFields: Object.keys(data) },
      tx
    );

    return updated;
  });

  res.json(excursion);
});

// DELETE /api/admin/excursions/:id
router.delete("/:id", requireRole(...EDIT_ROLES), async (req: AuthedRequest, res) => {
  await prisma.excursion.delete({ where: { id: req.params.id } });

  await logAudit(
    { adminUserId: req.admin!.sub, actorLabel: req.admin!.email },
    "excursion.deleted",
    "Excursion",
    req.params.id
  );

  res.status(204).send();
});

// POST /api/admin/excursions/:id/capacity-override — one-off capacity change for a specific date
router.post("/:id/capacity-override", requireRole(...EDIT_ROLES), async (req, res) => {
  const schema = z.object({ date: z.string(), time: z.string(), capacity: z.number().int().min(0) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input" });

  const date = parseDateOnly(parsed.data.date);
  const slot = await prisma.departureSlot.upsert({
    where: {
      excursionId_date_time: { excursionId: req.params.id, date, time: parsed.data.time },
    },
    update: { capacity: parsed.data.capacity },
    create: {
      excursionId: req.params.id,
      date,
      time: parsed.data.time,
      capacity: parsed.data.capacity,
    },
  });
  res.json(slot);
});

export default router;
