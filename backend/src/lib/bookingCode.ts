import { Prisma } from "@prisma/client";

const PREFIX = "COCO";

export type BookingCodeType = "EXC" | "BCH" | "EVT";

function dateKeyFor(date: Date): string {
  return date.toISOString().slice(0, 10).replace(/-/g, "");
}

/**
 * Allocates the next per-day, per-type serial and formats a human-readable
 * booking code, e.g. COCO_EXC_20260903_0007 — meant to be read aloud or typed
 * by a guest/staff member, unlike the opaque cuid primary key.
 *
 * Must be called inside the same transaction that creates the booking, so a
 * booking that fails to create never burns a serial number.
 *
 * Uses MySQL's `INSERT ... ON DUPLICATE KEY UPDATE` with `LAST_INSERT_ID(expr)`
 * to atomically increment-and-read the counter in one statement — the
 * sequence row's id is the deterministic "<type>_<dateKey>" key, so this
 * needs no separate SELECT ... FOR UPDATE.
 */
export async function nextBookingCode(tx: Prisma.TransactionClient, type: BookingCodeType, date: Date): Promise<string> {
  const dateKey = dateKeyFor(date);
  const id = `${type}_${dateKey}`;

  // LAST_INSERT_ID(expr) only fires on the ON DUPLICATE KEY UPDATE branch by
  // default — on a genuinely new row (no prior booking that day/type) MySQL
  // never runs that branch, so the very first serial would read back as 0
  // unless the INSERT's own VALUES also route through LAST_INSERT_ID(1).
  await tx.$executeRaw`
    INSERT INTO booking_sequences (id, type, dateKey, counter)
    VALUES (${id}, ${type}, ${dateKey}, LAST_INSERT_ID(1))
    ON DUPLICATE KEY UPDATE counter = LAST_INSERT_ID(counter + 1)
  `;
  const rows = await tx.$queryRaw<{ n: bigint | number }[]>`SELECT LAST_INSERT_ID() AS n`;
  const serial = Number(rows[0]?.n ?? 1);

  return `${PREFIX}_${type}_${dateKey}_${String(serial).padStart(4, "0")}`;
}
