import { Router } from "express";
import { prisma } from "../lib/prisma";
import { getSpotAvailability, RentalError } from "../services/rentalService";

const router = Router();

// GET /api/rentals — public listing (active only)
router.get("/", async (_req, res) => {
  const items = await prisma.rentalItem.findMany({
    where: { status: "ACTIVE" },
    orderBy: { name: "asc" },
  });
  res.json(items);
});

// GET /api/rentals/:slug — public detail page, with its bookable time slots
router.get("/:slug", async (req, res) => {
  const item = await prisma.rentalItem.findUnique({
    where: { slug: req.params.slug },
    include: { timeSlots: { where: { isActive: true }, orderBy: { startTime: "asc" } } },
  });
  if (!item || item.status !== "ACTIVE") {
    return res.status(404).json({ error: "Rental not found" });
  }
  res.json(item);
});

// GET /api/rentals/:id/availability?date=YYYY-MM-DD&timeSlotId= — per-spot availability for one day + time slot
router.get("/:id/availability", async (req, res) => {
  const { date, timeSlotId } = req.query as { date?: string; timeSlotId?: string };
  if (!date || !timeSlotId) return res.status(400).json({ error: "date and timeSlotId query params are required" });

  try {
    const spots = await getSpotAvailability(req.params.id, date, timeSlotId);
    res.json(spots);
  } catch (err) {
    if (err instanceof RentalError) return res.status(err.status).json({ error: err.message });
    throw err;
  }
});

export default router;
