import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { createEventBooking, markEventBookingPaid, EventError } from "../services/eventService";
import { createEventPaymentIntent, isStripeConfigured } from "../services/stripeService";
import { sendEventBookingConfirmationEmail } from "../services/emailService";

/** No real Stripe key configured, so skip the network call and auto-confirm — stripeService already
 *  logs a loud startup warning when this is the case, so it's never silent. */
const useDevPaymentBypass = !isStripeConfigured();

const router = Router();

const createEventBookingSchema = z.object({
  eventId: z.string(),
  tierId: z.string(),
  quantity: z.number().int().min(1),
  guestName: z.string().min(1),
  guestEmail: z.string().email(),
  guestPhone: z.string().optional(),
  roomNumber: z.string().optional(),
});

// POST /api/event-bookings — reserves `quantity` tickets at one tier.
router.post("/", async (req, res) => {
  const parsed = createEventBookingSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
  }

  try {
    const booking = await createEventBooking(parsed.data);

    if (useDevPaymentBypass) {
      const confirmed = await markEventBookingPaid(booking.id, `dev_bypass_${booking.id}`);
      const [event, tier] = await Promise.all([
        prisma.event.findUnique({ where: { id: confirmed.eventId } }),
        prisma.eventTicketTier.findUnique({ where: { id: confirmed.tierId } }),
      ]);
      if (event && tier) await sendEventBookingConfirmationEmail(confirmed, event, tier);

      return res.status(201).json({
        bookingId: confirmed.id,
        amountTotal: confirmed.amountTotal,
        clientSecret: null,
        devBypass: true,
      });
    }

    const paymentIntent = await createEventPaymentIntent(Number(booking.amountTotal), booking.id);
    res.status(201).json({
      bookingId: booking.id,
      amountTotal: booking.amountTotal,
      clientSecret: paymentIntent.client_secret,
    });
  } catch (err) {
    if (err instanceof EventError) return res.status(err.status).json({ error: err.message });
    // eslint-disable-next-line no-console
    console.error(err);
    res.status(500).json({ error: "Failed to create booking" });
  }
});

// GET /api/event-bookings/:id — booking status lookup (confirmation page)
router.get("/:id", async (req, res) => {
  const booking = await prisma.eventBooking.findUnique({
    where: { id: req.params.id },
    include: { event: true, tier: true },
  });
  if (!booking) return res.status(404).json({ error: "Booking not found" });
  res.json(booking);
});

export default router;
