import { Router } from "express";
import { prisma } from "../lib/prisma";

const router = Router();

const sectionsInclude = {
  sections: {
    orderBy: { sortOrder: "asc" as const },
    include: { items: { orderBy: { sortOrder: "asc" as const } } },
  },
};

// GET /api/restaurant-menus — public listing, active only, in display order
router.get("/", async (_req, res) => {
  const menus = await prisma.restaurantMenu.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    include: sectionsInclude,
  });
  res.json(menus);
});

// GET /api/restaurant-menus/:slug — public detail
router.get("/:slug", async (req, res) => {
  const menu = await prisma.restaurantMenu.findUnique({ where: { slug: req.params.slug }, include: sectionsInclude });
  if (!menu || !menu.isActive) return res.status(404).json({ error: "Menu not found" });
  res.json(menu);
});

export default router;
