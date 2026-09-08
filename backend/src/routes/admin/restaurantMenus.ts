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

const sectionsInclude = {
  sections: {
    orderBy: { sortOrder: "asc" as const },
    include: { items: { orderBy: { sortOrder: "asc" as const } } },
  },
};

const menuItemSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().nonnegative().optional(),
});

const menuSectionSchema = z.object({
  heading: z.string().min(1),
  subheading: z.string().optional(),
  items: z.array(menuItemSchema).optional(),
});

const menuSchema = z.object({
  locationId: z.string(),
  title: z.string().min(1),
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/, "slug must be lowercase, alphanumeric, hyphen-separated"),
  description: z.string().optional(),
  timings: z.string().optional(),
  imageUrl: z.string().optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
  sections: z.array(menuSectionSchema).optional(),
});

function sectionsCreateData(sections: z.infer<typeof menuSectionSchema>[]) {
  return sections.map((section, sectionIndex) => ({
    heading: section.heading,
    subheading: section.subheading,
    sortOrder: sectionIndex,
    items: section.items
      ? {
          create: section.items.map((item, itemIndex) => ({
            name: item.name,
            description: item.description,
            price: item.price,
            sortOrder: itemIndex,
          })),
        }
      : undefined,
  }));
}

// GET /api/admin/restaurant-menus — every menu regardless of active status
router.get("/", requireRole(...VIEW_ROLES), async (_req, res) => {
  const menus = await prisma.restaurantMenu.findMany({ orderBy: { sortOrder: "asc" }, include: sectionsInclude });
  res.json(menus);
});

router.get("/:id", requireRole(...VIEW_ROLES), async (req, res) => {
  const menu = await prisma.restaurantMenu.findUnique({ where: { id: req.params.id }, include: sectionsInclude });
  if (!menu) return res.status(404).json({ error: "Menu not found" });
  res.json(menu);
});

// POST /api/admin/restaurant-menus — create, with its sections/items nested
router.post("/", requireRole(...EDIT_ROLES), async (req: AuthedRequest, res) => {
  const parsed = menuSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });

  const existing = await prisma.restaurantMenu.findUnique({ where: { slug: parsed.data.slug } });
  if (existing) return res.status(409).json({ error: "A menu with this slug already exists" });

  const { sections, ...data } = parsed.data;
  const menu = await prisma.restaurantMenu.create({
    data: { ...data, sections: sections ? { create: sectionsCreateData(sections) } : undefined },
    include: sectionsInclude,
  });
  await logAudit(
    { adminUserId: req.admin!.sub, actorLabel: req.admin!.email },
    "restaurant_menu.created",
    "RestaurantMenu",
    menu.id,
    { title: menu.title }
  );
  res.status(201).json(menu);
});

// PUT /api/admin/restaurant-menus/:id — update. Sending `sections` replaces
// the entire section/item list wholesale (same pattern as
// Excursion.departureTimes) — cascading deletes clean up the old items, so
// the save flow is just "delete all, recreate from what was submitted".
router.put("/:id", requireRole(...EDIT_ROLES), async (req: AuthedRequest, res) => {
  const parsed = menuSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });

  const { sections, ...data } = parsed.data;

  const menu = await prisma.$transaction(async (tx) => {
    if (sections) {
      await tx.restaurantMenuSection.deleteMany({ where: { menuId: req.params.id } });
    }
    const updated = await tx.restaurantMenu.update({
      where: { id: req.params.id },
      data: { ...data, sections: sections ? { create: sectionsCreateData(sections) } : undefined },
      include: sectionsInclude,
    });

    await logAudit(
      { adminUserId: req.admin!.sub, actorLabel: req.admin!.email },
      "restaurant_menu.updated",
      "RestaurantMenu",
      updated.id,
      { changedFields: Object.keys(data), sectionsReplaced: Boolean(sections) },
      tx
    );

    return updated;
  });

  res.json(menu);
});

// DELETE /api/admin/restaurant-menus/:id
router.delete("/:id", requireRole(...EDIT_ROLES), async (req: AuthedRequest, res) => {
  await prisma.restaurantMenu.delete({ where: { id: req.params.id } });
  await logAudit(
    { adminUserId: req.admin!.sub, actorLabel: req.admin!.email },
    "restaurant_menu.deleted",
    "RestaurantMenu",
    req.params.id
  );
  res.status(204).send();
});

export default router;
