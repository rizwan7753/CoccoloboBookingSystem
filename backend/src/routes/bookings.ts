import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { createBooking, markBookingPaid, BookingError } from "../services/bookingService";
import { createPaymentIntent, isStripeConfigured } from "../services/stripeService";
import { sendBookingConfirmationEmail } from "../services/emailService";

/** No real Stripe key configured, so skip the network call and auto-confirm — stripeService already
 *  logs a loud startup warning when this is the case, so it's never silent. */
const useDevPaymentBypass = !isStripeConfigured();

const router = Router();

const createBookingSchema = z.object({
  excursionId: z.string(),
  date: z.string(),
  time: z.string(),
  guestName: z.string().min(1),
  guestEmail: z.string().email(),
  guestPhone: z.string().optional(),
  roomNumber: z.string().optional(),
  specialRequests: z.string().optional(),
  adultCount: z.number().int().min(0),
  childCount: z.number().int().min(0).optional(),
});

// POST /api/bookings — creates a PENDING booking + holds capacity,
// then returns a Stripe PaymentIntent client secret to complete payment.
router.post("/", async (req, res) => {
  const parsed = createBookingSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
  }

  try {
    const booking = await createBooking(parsed.data);

    if (useDevPaymentBypass) {
      const confirmed = await markBookingPaid(booking.id, `dev_bypass_${booking.id}`);
      const excursion = await prisma.excursion.findUnique({ where: { id: confirmed.excursionId } });
      if (excursion) await sendBookingConfirmationEmail(confirmed, excursion);

      return res.status(201).json({
        bookingId: confirmed.id,
        amountTotal: confirmed.amountTotal,
        clientSecret: null,
        devBypass: true,
      });
    }

    const paymentIntent = await createPaymentIntent(Number(booking.amountTotal), booking.id);
    res.status(201).json({
      bookingId: booking.id,
      amountTotal: booking.amountTotal,
      clientSecret: paymentIntent.client_secret,
    });
  } catch (err) {
    if (err instanceof BookingError) return res.status(err.status).json({ error: err.message });
    // eslint-disable-next-line no-console
    console.error(err);
    res.status(500).json({ error: "Failed to create booking" });
  }
});

// GET /api/bookings/:id — booking status lookup (used by the confirmation page)
router.get("/:id", async (req, res) => {
  const booking = await prisma.booking.findUnique({
    where: { id: req.params.id },
    include: { excursion: true, slot: true },
  });
  if (!booking) return res.status(404).json({ error: "Booking not found" });
  res.json(booking);
});

export default router;
