import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";

const router = Router();

const lookupSchema = z.object({
  bookingCode: z.string().min(1),
  email: z.string().email(),
});

const NOT_FOUND_MESSAGE = "We couldn't find a booking with that reference and email — check both and try again.";

// POST /api/booking-lookup — no-login "find my booking" for a guest who has
// their reference code (from the confirmation email/page) and the email they
// booked with. Requires BOTH to match, and always returns the same generic
// error either way, so this can't be used to enumerate booking codes or
// confirm whether an email address has any bookings.
router.post("/", async (req, res) => {
  const parsed = lookupSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "A booking reference and email are required" });

  const { bookingCode, email } = parsed.data;
  const code = bookingCode.trim().toUpperCase();

  if (code.startsWith("COCO_EXC_")) {
    const booking = await prisma.booking.findFirst({ where: { bookingCode: code, guestEmail: email } });
    if (booking) return res.json({ type: "excursion", bookingId: booking.id });
  } else if (code.startsWith("COCO_BCH_")) {
    const booking = await prisma.rentalBooking.findFirst({ where: { bookingCode: code, guestEmail: email } });
    if (booking) return res.json({ type: "rental", bookingId: booking.id });
  } else if (code.startsWith("COCO_EVT_")) {
    const booking = await prisma.eventBooking.findFirst({ where: { bookingCode: code, guestEmail: email } });
    if (booking) return res.json({ type: "event", bookingId: booking.id });
  }

  res.status(404).json({ error: NOT_FOUND_MESSAGE });
});

export default router;
