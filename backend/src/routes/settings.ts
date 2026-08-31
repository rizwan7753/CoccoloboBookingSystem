import { Router } from "express";
import { prisma } from "../lib/prisma";

const router = Router();

// GET /api/settings — public, branding-relevant fields only (no SMTP/credentials).
router.get("/", async (_req, res) => {
  const location = await prisma.location.findFirst();
  if (!location) return res.status(404).json({ error: "No location configured" });
  res.json({ name: location.name, timezone: location.timezone, currency: location.currency });
});

export default router;
