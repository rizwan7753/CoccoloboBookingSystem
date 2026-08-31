import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { requireAdmin } from "../../middleware/requireAdmin";
import { requireRole } from "../../middleware/requireRole";

const router = Router();
router.use(requireAdmin);
router.use(requireRole("SUPER_ADMIN"));

// GET /api/admin/audit-log?entityType=&entityId=&limit=
router.get("/", async (req, res) => {
  const { entityType, entityId, limit } = req.query as { entityType?: string; entityId?: string; limit?: string };

  const logs = await prisma.auditLog.findMany({
    where: {
      entityType: entityType || undefined,
      entityId: entityId || undefined,
    },
    orderBy: { createdAt: "desc" },
    take: Math.min(Number(limit) || 100, 500),
  });
  res.json(logs);
});

export default router;
