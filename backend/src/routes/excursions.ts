import { Router } from "express";
import { prisma } from "../lib/prisma";
import { getAvailability, BookingError } from "../services/bookingService";
import { parseDateOnly } from "../lib/dateOnly";
import { getNextDeparture } from "../lib/nextDeparture";

const router = Router();

// GET /api/excursions — public listing (active only), each with its next
// bookable departure so the guest site can show an "upcoming" list.
router.get("/", async (_req, res) => {
  const excursions = await prisma.excursion.findMany({
    where: { status: "ACTIVE" },
    include: { departureTimes: { where: { isActive: true } } },
    orderBy: { title: "asc" },
  });

  const withNextDeparture = excursions.map((ex) => ({
    ...ex,
    nextDeparture: getNextDeparture(
      ex.departureTimes.map((dt) => ({ time: dt.time, daysOfWeek: dt.daysOfWeek as number[], isActive: dt.isActive })),
      ex.cutoffTime
    ),
  }));

  // Soonest-departing excursions first — makes the homepage read as a genuine "what's coming up" list.
  withNextDeparture.sort((a, b) => {
    if (!a.nextDeparture) return 1;
    if (!b.nextDeparture) return -1;
    return `${a.nextDeparture.date}T${a.nextDeparture.time}`.localeCompare(`${b.nextDeparture.date}T${b.nextDeparture.time}`);
  });

  res.json(withNextDeparture);
});

// GET /api/excursions/:slug — public detail page
router.get("/:slug", async (req, res) => {
  const excursion = await prisma.excursion.findUnique({
    where: { slug: req.params.slug },
    include: { departureTimes: { where: { isActive: true } } },
  });
  if (!excursion || excursion.status !== "ACTIVE") {
    return res.status(404).json({ error: "Excursion not found" });
  }
  res.json(excursion);
});

// GET /api/excursions/:id/availability?from=YYYY-MM-DD&to=YYYY-MM-DD
router.get("/:id/availability", async (req, res) => {
  const { from, to } = req.query as { from?: string; to?: string };
  if (!from || !to) return res.status(400).json({ error: "from and to query params are required" });

  try {
    const days = await getAvailability(req.params.id, parseDateOnly(from), parseDateOnly(to));
    res.json(days);
  } catch (err) {
    if (err instanceof BookingError) return res.status(err.status).json({ error: err.message });
    throw err;
  }
});

export default router;
