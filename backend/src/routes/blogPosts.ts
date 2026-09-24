import { Router } from "express";
import { prisma } from "../lib/prisma";

const router = Router();

// GET /api/blog-posts — public: published posts only, newest/admin-ordered first
router.get("/", async (_req, res) => {
  const posts = await prisma.blogPost.findMany({
    where: { status: "PUBLISHED" },
    orderBy: [{ sortOrder: "asc" }, { publishedAt: "desc" }],
  });
  res.json(posts);
});

// GET /api/blog-posts/:slug — public detail page
router.get("/:slug", async (req, res) => {
  const post = await prisma.blogPost.findUnique({ where: { slug: req.params.slug } });
  if (!post || post.status !== "PUBLISHED") {
    return res.status(404).json({ error: "Post not found" });
  }
  res.json(post);
});

export default router;
