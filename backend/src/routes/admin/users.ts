import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { requireAdmin, AuthedRequest } from "../../middleware/requireAdmin";
import { requireRole } from "../../middleware/requireRole";
import { hashPassword } from "../../lib/auth";
import { logAudit } from "../../lib/auditLog";

const router = Router();
router.use(requireAdmin);
router.use(requireRole("SUPER_ADMIN")); // staff/role management is Super Admin only (spec §14)

const ROLES = ["SUPER_ADMIN", "LOCATION_MANAGER", "BOOKING_STAFF", "FINANCE", "TRAVEL_AGENT"] as const;

const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(ROLES),
  locationId: z.string().nullable().optional(),
});

const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  role: z.enum(ROLES).optional(),
  locationId: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
  password: z.string().min(8).optional(),
});

// GET /api/admin/users — list all staff/admin accounts
router.get("/", async (_req, res) => {
  const users = await prisma.adminUser.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      locationId: true,
      isActive: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });
  res.json(users);
});

// POST /api/admin/users — create a new staff/admin account
router.post("/", async (req: AuthedRequest, res) => {
  const parsed = createUserSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });

  const existing = await prisma.adminUser.findUnique({ where: { email: parsed.data.email } });
  if (existing) return res.status(409).json({ error: "A user with this email already exists" });

  const user = await prisma.adminUser.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      role: parsed.data.role,
      locationId: parsed.data.locationId ?? null,
      passwordHash: await hashPassword(parsed.data.password),
    },
    select: { id: true, name: true, email: true, role: true, locationId: true, isActive: true, createdAt: true },
  });

  await logAudit(
    { adminUserId: req.admin!.sub, actorLabel: req.admin!.email },
    "admin_user.created",
    "AdminUser",
    user.id,
    { email: user.email, role: user.role }
  );

  res.status(201).json(user);
});

// PUT /api/admin/users/:id — update role, location, active status, or reset password
router.put("/:id", async (req: AuthedRequest, res) => {
  const parsed = updateUserSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });

  if (req.params.id === req.admin!.sub && parsed.data.role && parsed.data.role !== "SUPER_ADMIN") {
    return res.status(400).json({ error: "You cannot demote your own account" });
  }
  if (req.params.id === req.admin!.sub && parsed.data.isActive === false) {
    return res.status(400).json({ error: "You cannot deactivate your own account" });
  }
  if (parsed.data.email) {
    const existing = await prisma.adminUser.findUnique({ where: { email: parsed.data.email } });
    if (existing && existing.id !== req.params.id) {
      return res.status(409).json({ error: "A user with this email already exists" });
    }
  }

  const { password, ...rest } = parsed.data;
  const user = await prisma.adminUser.update({
    where: { id: req.params.id },
    data: { ...rest, ...(password ? { passwordHash: await hashPassword(password) } : {}) },
    select: { id: true, name: true, email: true, role: true, locationId: true, isActive: true, createdAt: true },
  });

  await logAudit(
    { adminUserId: req.admin!.sub, actorLabel: req.admin!.email },
    "admin_user.updated",
    "AdminUser",
    user.id,
    { changedFields: Object.keys(rest) }
  );

  res.json(user);
});

// DELETE /api/admin/users/:id
router.delete("/:id", async (req: AuthedRequest, res) => {
  if (req.params.id === req.admin!.sub) {
    return res.status(400).json({ error: "You cannot delete your own account" });
  }
  await prisma.adminUser.delete({ where: { id: req.params.id } });

  await logAudit(
    { adminUserId: req.admin!.sub, actorLabel: req.admin!.email },
    "admin_user.deleted",
    "AdminUser",
    req.params.id
  );

  res.status(204).send();
});

export default router;
