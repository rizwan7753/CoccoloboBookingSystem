import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { verifyPassword, signAdminToken } from "../lib/auth";

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// POST /api/auth/login — admin/staff login
router.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input" });

  const { email, password } = parsed.data;
  const admin = await prisma.adminUser.findUnique({ where: { email } });
  if (!admin || !(await verifyPassword(password, admin.passwordHash))) {
    return res.status(401).json({ error: "Invalid email or password" });
  }
  if (!admin.isActive) {
    return res.status(403).json({ error: "This account has been deactivated. Contact your administrator." });
  }

  const token = signAdminToken({
    sub: admin.id,
    email: admin.email,
    role: admin.role,
    locationId: admin.locationId,
  });

  res.json({
    token,
    admin: {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      locationId: admin.locationId,
    },
  });
});

export default router;
