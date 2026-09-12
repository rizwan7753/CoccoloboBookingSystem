import { Request, Response, NextFunction } from "express";
import { verifyAdminToken } from "../lib/auth";
import { prisma } from "../lib/prisma";

// What's attached to `req.admin` once authenticated — richer than the JWT
// payload itself. Permissions are re-read from the database on every request
// (not baked into the token) so editing a role's permissions, or an admin's
// role/active flag, takes effect immediately without waiting for re-login.
export interface AuthedAdmin {
  sub: string; // admin user id
  email: string;
  role: string; // Role.id
  roleName: string;
  locationId: string | null;
  permissions: string[];
}

export interface AuthedRequest extends Request {
  admin?: AuthedAdmin;
}

export async function requireAdmin(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid Authorization header" });
  }
  const token = header.slice("Bearer ".length);
  let sub: string;
  try {
    sub = verifyAdminToken(token).sub;
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  const user = await prisma.adminUser.findUnique({
    where: { id: sub },
    include: { roleRef: { include: { permissions: true } } },
  });
  if (!user || !user.isActive) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  req.admin = {
    sub: user.id,
    email: user.email,
    role: user.role,
    roleName: user.roleRef.name,
    locationId: user.locationId,
    permissions: user.roleRef.permissions.map((p) => p.permission),
  };
  next();
}
