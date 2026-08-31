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

const holidaySchema = z.object({
  locationId: z.string(),
  date: z.string(), // "2026-12-25"
  label: z.string().min(1),
  appliesToExcursions: z.boolean().optional(),
  appliesToRentals: z.boolean().optional(),
  appliesToEvents: z.boolean().optional(),
});

// GET /api/admin/holidays — every holiday, upcoming and past
router.get("/", requireRole(...VIEW_ROLES), async (_req, res) => {
  const holidays = await prisma.holiday.findMany({ orderBy: { date: "asc" } });
  res.json(holidays);
});

// POST /api/admin/holidays — create
router.post("/", requireRole(...EDIT_ROLES), async (req: AuthedRequest, res) => {
  const parsed = holidaySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });

  try {
    const holiday = await prisma.holiday.create({
      data: { ...parsed.data, date: parseDateOnly(parsed.data.date) },
    });
    await logAudit(
      { adminUserId: req.admin!.sub, actorLabel: req.admin!.email },
      "holiday.created",
      "Holiday",
      holiday.id,
      { date: parsed.data.date, label: holiday.label }
    );
    res.status(201).json(holiday);
  } catch {
    res.status(409).json({ error: "A holiday already exists for this date" });
  }
});

// PUT /api/admin/holidays/:id — update label/scope (date is immutable — delete and recreate to move it)
router.put("/:id", requireRole(...EDIT_ROLES), async (req: AuthedRequest, res) => {
  const schema = z.object({
    label: z.string().min(1).optional(),
    appliesToExcursions: z.boolean().optional(),
    appliesToRentals: z.boolean().optional(),
    appliesToEvents: z.boolean().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });

  const holiday = await prisma.holiday.update({ where: { id: req.params.id }, data: parsed.data });
  await logAudit(
    { adminUserId: req.admin!.sub, actorLabel: req.admin!.email },
    "holiday.updated",
    "Holiday",
    holiday.id,
    { changedFields: Object.keys(parsed.data) }
  );
  res.json(holiday);
});

// DELETE /api/admin/holidays/:id
router.delete("/:id", requireRole(...EDIT_ROLES), async (req: AuthedRequest, res) => {
  await prisma.holiday.delete({ where: { id: req.params.id } });
  await logAudit(
    { adminUserId: req.admin!.sub, actorLabel: req.admin!.email },
    "holiday.deleted",
    "Holiday",
    req.params.id
  );
  res.status(204).send();
});

export default router;
