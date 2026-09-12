import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { requireAdmin, AuthedRequest } from "../../middleware/requireAdmin";
import { requirePermission } from "../../middleware/requirePermission";
import { logAudit } from "../../lib/auditLog";
import { PERMISSIONS, PERMISSION_GROUPS, isPermission } from "../../lib/permissions";

const router = Router();
router.use(requireAdmin);
router.use(requirePermission("staff.manage"));

const roleSchema = z.object({
  name: z.string().min(1).max(60),
  permissions: z.array(z.string()).refine((perms) => perms.every(isPermission), "Unknown permission key"),
});

function serialize(role: { id: string; name: string; isSystem: boolean; createdAt: Date; permissions: { permission: string }[]; _count?: { adminUsers: number } }) {
  return {
    id: role.id,
    name: role.name,
    isSystem: role.isSystem,
    createdAt: role.createdAt,
    permissions: role.permissions.map((p) => p.permission),
    staffCount: role._count?.adminUsers ?? 0,
  };
}

// GET /api/admin/roles — the catalog of assignable permission keys (grouped for
// the UI) plus every role and what it's currently granted.
router.get("/", async (_req, res) => {
  const roles = await prisma.role.findMany({
    include: { permissions: true, _count: { select: { adminUsers: true } } },
    orderBy: [{ isSystem: "desc" }, { createdAt: "asc" }],
  });
  res.json({ permissionGroups: PERMISSION_GROUPS, roles: roles.map(serialize) });
});

// POST /api/admin/roles — create a custom role
router.post("/", async (req: AuthedRequest, res) => {
  const parsed = roleSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });

  const existing = await prisma.role.findUnique({ where: { name: parsed.data.name } });
  if (existing) return res.status(409).json({ error: "A role with this name already exists" });

  const role = await prisma.role.create({
    data: {
      name: parsed.data.name,
      permissions: { create: parsed.data.permissions.map((permission) => ({ permission })) },
    },
    include: { permissions: true, _count: { select: { adminUsers: true } } },
  });

  await logAudit({ adminUserId: req.admin!.sub, actorLabel: req.admin!.email }, "role.created", "Role", role.id, { name: role.name });

  res.status(201).json(serialize(role));
});

// PUT /api/admin/roles/:id — rename (custom roles only) and/or change permissions
router.put("/:id", async (req: AuthedRequest, res) => {
  const role = await prisma.role.findUnique({ where: { id: req.params.id } });
  if (!role) return res.status(404).json({ error: "Role not found" });

  const schema = z.object({
    name: z.string().min(1).max(60).optional(),
    permissions: z
      .array(z.string())
      .refine((perms) => perms.every(isPermission), "Unknown permission key")
      .optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });

  if (parsed.data.name && role.isSystem && parsed.data.name !== role.name) {
    return res.status(400).json({ error: "Built-in roles can't be renamed" });
  }
  // Super Admin always keeps every permission — prevents an admin from
  // accidentally locking every account with that role (including their own)
  // out of the system.
  if (role.id === "SUPER_ADMIN" && parsed.data.permissions) {
    const missing = PERMISSIONS.filter((p) => !parsed.data!.permissions!.includes(p));
    if (missing.length > 0) return res.status(400).json({ error: "Super Admin must keep every permission" });
  }
  if (parsed.data.name) {
    const clash = await prisma.role.findUnique({ where: { name: parsed.data.name } });
    if (clash && clash.id !== role.id) return res.status(409).json({ error: "A role with this name already exists" });
  }

  const updated = await prisma.$transaction(async (tx) => {
    if (parsed.data.permissions) {
      await tx.rolePermission.deleteMany({ where: { roleId: role.id } });
      await tx.rolePermission.createMany({ data: parsed.data.permissions!.map((permission) => ({ roleId: role.id, permission })) });
    }
    if (parsed.data.name) {
      await tx.role.update({ where: { id: role.id }, data: { name: parsed.data.name } });
    }
    return tx.role.findUniqueOrThrow({
      where: { id: role.id },
      include: { permissions: true, _count: { select: { adminUsers: true } } },
    });
  });

  await logAudit(
    { adminUserId: req.admin!.sub, actorLabel: req.admin!.email },
    "role.updated",
    "Role",
    role.id,
    { changedFields: Object.keys(parsed.data) }
  );

  res.json(serialize(updated));
});

// DELETE /api/admin/roles/:id — any role (including built-ins) can be deleted
// once no staff account uses it. Super Admin is the one exception: it's the
// role the app always keeps at full permissions (see PUT above), so deleting
// it would remove the only guaranteed way back to full access.
router.delete("/:id", async (req: AuthedRequest, res) => {
  const role = await prisma.role.findUnique({ where: { id: req.params.id }, include: { _count: { select: { adminUsers: true } } } });
  if (!role) return res.status(404).json({ error: "Role not found" });
  if (role.id === "SUPER_ADMIN") return res.status(400).json({ error: "The Super Admin role can't be deleted" });
  if (role._count.adminUsers > 0) {
    return res.status(400).json({ error: "This role is still assigned to one or more staff accounts — reassign them first" });
  }

  await prisma.role.delete({ where: { id: role.id } });

  await logAudit({ adminUserId: req.admin!.sub, actorLabel: req.admin!.email }, "role.deleted", "Role", role.id, { name: role.name });

  res.status(204).send();
});

export default router;
