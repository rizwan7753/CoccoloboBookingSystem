import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { getDefaultLocationId } from "../../lib/location";
import { requireAdmin, AuthedRequest } from "../../middleware/requireAdmin";
import { requirePermission } from "../../middleware/requirePermission";
import { logAudit } from "../../lib/auditLog";

const router = Router();
router.use(requireAdmin);


const reviewSchema = z.object({
  itemType: z.enum(["EXCURSION", "RENTAL", "EVENT"]).nullable().optional(),
  itemId: z.string().nullable().optional(),
  itemTitle: z.string().nullable().optional(),
  rating: z.number().int().min(1).max(5),
  title: z.string().optional(),
  quote: z.string().min(1),
  authorName: z.string().min(1),
  authorInitials: z.string().optional(),
  authorMeta: z.string().optional(),
  status: z.enum(["DRAFT", "PENDING", "PUBLISHED", "REJECTED"]).optional(),
  sortOrder: z.number().int().optional(),
});

// GET /api/admin/reviews — every review. ?status=PENDING to filter (used by
// the moderation queue); otherwise everything, newest first.
router.get("/", requirePermission("content.view"), async (req, res) => {
  const status = typeof req.query.status === "string" ? req.query.status : undefined;
  const reviews = await prisma.review.findMany({
    where: status ? { status: status as "DRAFT" | "PENDING" | "PUBLISHED" | "REJECTED" } : undefined,
    orderBy: [{ status: "asc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
  });
  res.json(reviews);
});

// POST /api/admin/reviews — create a general homepage review (admin-authored).
// Per-item reviews normally arrive via the public guest submission endpoint
// instead, but an admin can still add one directly here if needed.
router.post("/", requirePermission("content.manage"), async (req: AuthedRequest, res) => {
  const parsed = reviewSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });

  const review = await prisma.review.create({
    data: { ...parsed.data, locationId: await getDefaultLocationId() },
  });
  await logAudit({ adminUserId: req.admin!.sub, actorLabel: req.admin!.email }, "review.created", "Review", review.id, {
    title: review.title,
  });
  res.status(201).json(review);
});

// PUT /api/admin/reviews/:id — update (including status changes)
router.put("/:id", requirePermission("content.manage"), async (req: AuthedRequest, res) => {
  const parsed = reviewSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });

  const review = await prisma.review.update({ where: { id: req.params.id }, data: parsed.data });
  await logAudit({ adminUserId: req.admin!.sub, actorLabel: req.admin!.email }, "review.updated", "Review", review.id, {
    changedFields: Object.keys(parsed.data),
  });
  res.json(review);
});

// POST /api/admin/reviews/:id/approve — publish a pending guest submission
router.post("/:id/approve", requirePermission("content.manage"), async (req: AuthedRequest, res) => {
  const review = await prisma.review.update({ where: { id: req.params.id }, data: { status: "PUBLISHED" } });
  await logAudit({ adminUserId: req.admin!.sub, actorLabel: req.admin!.email }, "review.approved", "Review", review.id);
  res.json(review);
});

// POST /api/admin/reviews/:id/reject — moderate out a pending guest submission
router.post("/:id/reject", requirePermission("content.manage"), async (req: AuthedRequest, res) => {
  const review = await prisma.review.update({ where: { id: req.params.id }, data: { status: "REJECTED" } });
  await logAudit({ adminUserId: req.admin!.sub, actorLabel: req.admin!.email }, "review.rejected", "Review", review.id);
  res.json(review);
});

// DELETE /api/admin/reviews/:id
router.delete("/:id", requirePermission("content.manage"), async (req: AuthedRequest, res) => {
  await prisma.review.delete({ where: { id: req.params.id } });
  await logAudit({ adminUserId: req.admin!.sub, actorLabel: req.admin!.email }, "review.deleted", "Review", req.params.id);
  res.status(204).send();
});

export default router;
