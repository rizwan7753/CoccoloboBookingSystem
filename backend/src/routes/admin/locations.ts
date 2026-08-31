import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { requireAdmin } from "../../middleware/requireAdmin";

const router = Router();
router.use(requireAdmin);

// GET /api/admin/locations — any authenticated staff member (needed for the
// user-management "assign location" dropdown, and future multi-property UI).
router.get("/", async (_req, res) => {
  const locations = await prisma.location.findMany({ orderBy: { name: "asc" } });
  res.json(locations);
});

export default router;
