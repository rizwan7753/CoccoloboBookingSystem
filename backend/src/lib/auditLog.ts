import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";

type Actor = { adminUserId: string | null; actorLabel: string };

/**
 * Records a booking-affecting action (spec §14: "Full activity log / audit
 * trail of who created, amended, or cancelled each booking, and when.").
 *
 * Accepts an optional `tx` so it can be called inside the same transaction
 * as the change it's logging (keeps the log and the change atomic) — falls
 * back to the standalone client otherwise.
 */
export async function logAudit(
  actor: Actor,
  action: string,
  entityType: string,
  entityId: string,
  detail?: Record<string, unknown>,
  tx?: Prisma.TransactionClient
) {
  const client = tx ?? prisma;
  await client.auditLog.create({
    data: {
      adminUserId: actor.adminUserId,
      actorLabel: actor.actorLabel,
      action,
      entityType,
      entityId,
      detail: detail as Prisma.InputJsonValue,
    },
  });
}
