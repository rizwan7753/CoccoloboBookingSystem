import { Router } from "express";
import { prisma } from "../lib/prisma";
import { getTierAvailability, EventError } from "../services/eventService";
import { getHolidayForDate } from "../services/holidayService";

const router = Router();

// GET /api/events — public listing: active, upcoming (or today) events only
router.get("/", async (_req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const events = await prisma.event.findMany({
    where: { status: "ACTIVE", eventDate: { gte: new Date(`${today}T00:00:00.000Z`) } },
    orderBy: { eventDate: "asc" },
  });
  res.json(await withHolidayLabel(events));
});

// GET /api/events/:slug — public detail page
router.get("/:slug", async (req, res) => {
  const event = await prisma.event.findUnique({ where: { slug: req.params.slug } });
  if (!event || event.status !== "ACTIVE") {
    return res.status(404).json({ error: "Event not found" });
  }
  const [withLabel] = await withHolidayLabel([event]);
  res.json(withLabel);
});

// GET /api/events/:id/availability — live per-tier remaining ticket counts
router.get("/:id/availability", async (req, res) => {
  try {
    const tiers = await getTierAvailability(req.params.id);
    res.json(tiers);
  } catch (err) {
    if (err instanceof EventError) return res.status(err.status).json({ error: err.message });
    throw err;
  }
});

/** Tags each event with holidayLabel if its (fixed) date falls on a closure affecting events. */
async function withHolidayLabel<T extends { eventDate: Date }>(events: T[]) {
  return Promise.all(
    events.map(async (event) => {
      const holiday = await getHolidayForDate(event.eventDate.toISOString().slice(0, 10), "appliesToEvents");
      return { ...event, ...(holiday ? { holidayLabel: holiday.label } : {}) };
    })
  );
}

export default router;
