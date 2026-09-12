import { Response, NextFunction } from "express";
import { AuthedRequest } from "./requireAdmin";
import { Permission } from "../lib/permissions";

/**
 * Permission-based access control (spec §14, now admin-editable — see
 * lib/permissions.ts and routes/admin/roles.ts). Must run after
 * `requireAdmin` — relies on `req.admin.permissions` already being populated.
 *
 * Usage: router.post("/", requirePermission("excursions.manage"), handler)
 * Passing more than one key requires only ONE of them to be granted.
 */
export function requirePermission(...allowed: Permission[]) {
  return (req: AuthedRequest, res: Response, next: NextFunction) => {
    if (!req.admin) {
      return res.status(401).json({ error: "Authentication required" });
    }
    if (!allowed.some((p) => req.admin!.permissions.includes(p))) {
      return res.status(403).json({ error: "You do not have permission to perform this action" });
    }
    next();
  };
}

/**
 * Location-scoping check (spec §2.1): an admin with no locationId (a
 * global/system role) can access every location; everyone else is
 * restricted to the location on their own account.
 */
export function canAccessLocation(admin: { locationId: string | null }, locationId: string): boolean {
  return admin.locationId === null || admin.locationId === locationId;
}
