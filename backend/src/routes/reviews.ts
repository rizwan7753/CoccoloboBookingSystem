import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { getDefaultLocationId } from "../lib/location";

const router = Router();

const ITEM_TYPES = ["EXCURSION", "RENTAL", "EVENT"] as const;

// GET /api/reviews — published reviews only.
// - No query params: general homepage testimonials (itemType/itemId null).
// - ?itemType=excursion&itemId=xxx: reviews for one specific bookable item,
//   shown on that item's own detail page.
router.get("/", async (req, res) => {
  const itemTypeRaw = typeof req.query.itemType === "string" ? req.query.itemType.toUpperCase() : undefined;
  const itemId = typeof req.query.itemId === "string" ? req.query.itemId : undefined;
  const itemType = itemTypeRaw && (ITEM_TYPES as readonly string[]).includes(itemTypeRaw) ? itemTypeRaw : undefined;

  const reviews = await prisma.review.findMany({
    where: {
      status: "PUBLISHED",
      itemType: itemType ? (itemType as (typeof ITEM_TYPES)[number]) : null,
      itemId: itemType ? itemId : null,
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    select: {
      id: true,
      rating: true,
      title: true,
      quote: true,
      authorName: true,
      authorInitials: true,
      authorMeta: true,
      createdAt: true,
      // itemType/itemId/guestEmail intentionally omitted — not needed by
      // guests and guestEmail is moderation-only.
    },
  });
  res.json(reviews);
});

const submitSchema = z.object({
  itemType: z.enum(ITEM_TYPES),
  itemId: z.string().min(1),
  itemTitle: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(120).optional(),
  quote: z.string().min(10, "Please write at least a sentence.").max(2000),
  authorName: z.string().min(1).max(120),
  authorMeta: z.string().max(120).optional(),
  guestEmail: z.string().email().optional(),
});

// POST /api/reviews — public guest submission, scoped to one bookable item.
// Always created as PENDING regardless of what's sent — publishing happens
// only via admin approval (routes/admin/reviews.ts).
router.post("/", async (req, res) => {
  const parsed = submitSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });

  const review = await prisma.review.create({
    data: { ...parsed.data, locationId: await getDefaultLocationId(), status: "PENDING" },
  });
  res.status(201).json({ id: review.id, status: review.status });
});

export default router;
