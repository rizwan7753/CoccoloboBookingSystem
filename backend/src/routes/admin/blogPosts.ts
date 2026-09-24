import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { getDefaultLocationId } from "../../lib/location";
import { requireAdmin, AuthedRequest } from "../../middleware/requireAdmin";
import { requirePermission } from "../../middleware/requirePermission";
import { logAudit } from "../../lib/auditLog";

const router = Router();
router.use(requireAdmin);


const blogPostSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  excerpt: z.string().min(1),
  body: z.string().optional(),
  imageUrl: z.string().optional(),
  readMinutes: z.number().int().min(1).optional(),
  status: z.enum(["DRAFT", "PUBLISHED"]).optional(),
  sortOrder: z.number().int().optional(),
});

// GET /api/admin/blog-posts — every post, draft and published
router.get("/", requirePermission("content.view"), async (_req, res) => {
  const posts = await prisma.blogPost.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }] });
  res.json(posts);
});

// POST /api/admin/blog-posts — create
router.post("/", requirePermission("content.manage"), async (req: AuthedRequest, res) => {
  const parsed = blogPostSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });

  try {
    const post = await prisma.blogPost.create({
      data: {
        ...parsed.data,
        locationId: await getDefaultLocationId(),
        publishedAt: parsed.data.status === "PUBLISHED" ? new Date() : null,
      },
    });
    await logAudit({ adminUserId: req.admin!.sub, actorLabel: req.admin!.email }, "blogPost.created", "BlogPost", post.id, {
      title: post.title,
    });
    res.status(201).json(post);
  } catch {
    res.status(409).json({ error: "A post with this slug already exists" });
  }
});

// PUT /api/admin/blog-posts/:id — update
router.put("/:id", requirePermission("content.manage"), async (req: AuthedRequest, res) => {
  const parsed = blogPostSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });

  try {
    const existing = await prisma.blogPost.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: "Post not found" });

    const nowPublishing = parsed.data.status === "PUBLISHED" && existing.status !== "PUBLISHED";
    const post = await prisma.blogPost.update({
      where: { id: req.params.id },
      data: { ...parsed.data, ...(nowPublishing ? { publishedAt: new Date() } : {}) },
    });
    await logAudit({ adminUserId: req.admin!.sub, actorLabel: req.admin!.email }, "blogPost.updated", "BlogPost", post.id, {
      changedFields: Object.keys(parsed.data),
    });
    res.json(post);
  } catch {
    res.status(409).json({ error: "A post with this slug already exists" });
  }
});

// DELETE /api/admin/blog-posts/:id
router.delete("/:id", requirePermission("content.manage"), async (req: AuthedRequest, res) => {
  await prisma.blogPost.delete({ where: { id: req.params.id } });
  await logAudit({ adminUserId: req.admin!.sub, actorLabel: req.admin!.email }, "blogPost.deleted", "BlogPost", req.params.id);
  res.status(204).send();
});

export default router;
