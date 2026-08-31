import { Response, NextFunction } from "express";
import { AdminRole } from "@prisma/client";
import { AuthedRequest } from "./requireAdmin";

/**
 * Role-based access control (spec §14). Must run after `requireAdmin` —
 * relies on `req.admin` already being populated from the verified JWT.
 *
 * Usage: router.post("/", requireRole("SUPER_ADMIN", "LOCATION_MANAGER"), handler)
 */
export function requireRole(...allowedRoles: AdminRole[]) {
  return (req: AuthedRequest, res: Response, next: NextFunction) => {
    if (!req.admin) {
      return res.status(401).json({ error: "Authentication required" });
    }
    if (!allowedRoles.includes(req.admin.role as AdminRole)) {
      return res.status(403).json({ error: "You do not have permission to perform this action" });
    }
    next();
  };
}

/**
 * Location-scoping check (spec §2.1/§14): SUPER_ADMIN has access to every
 * location; every other role is restricted to the location on their account.
 * Call after requireAdmin, passing the locationId of the resource being accessed.
 */
export function canAccessLocation(admin: { role: string; locationId: string | null }, locationId: string): boolean {
  if (admin.role === "SUPER_ADMIN") return true;
  return admin.locationId === locationId;
}
