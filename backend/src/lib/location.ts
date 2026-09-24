import { prisma } from "./prisma";

/**
 * The single location this MVP runs. Looked up from the database rather than
 * hardcoded: its id differs between installs (e.g. a hosted database seeded
 * before the Carambola → Coccolobo rebrand still uses "carambola-main"), and
 * a hardcoded id that doesn't match fails every create with a foreign-key error.
 */
export async function getDefaultLocationId(): Promise<string> {
  const location = await prisma.location.findFirst({ orderBy: { createdAt: "asc" }, select: { id: true } });
  if (!location) throw Object.assign(new Error("No location is configured in the database"), { status: 500 });
  return location.id;
}
