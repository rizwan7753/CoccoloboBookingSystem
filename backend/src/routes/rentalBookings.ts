import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { createRentalBooking, markRentalBookingPaid, RentalError } from "../services/rentalService";
import { createRentalPaymentIntent, isStripeConfigured } from "../services/stripeService";
import { sendRentalBookingConfirmationEmail } from "../services/emailService";

/** No real Stripe key configured, so skip the network call and auto-confirm — stripeService already
 *  logs a loud startup warning when this is the case, so it's never silent. */
const useDevPaymentBypass = !isStripeConfigured();

const router = Router();

const createRentalBookingSchema = z.object({
  rentalItemId: z.string(),
  spotId: z.string(),
  timeSlotId: z.string(),
  date: z.string(),
  guestName: z.string().min(1),
  guestEmail: z.string().email(),
  guestPhone: z.string().optional(),
  roomNumber: z.string().optional(),
  adultCount: z.number().int().min(0),
  childCount: z.number().int().min(0).optional(),
});

// POST /api/rental-bookings — reserves a specific spot for a specific date.
router.post("/", async (req, res) => {
  const parsed = createRentalBookingSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
  }

  try {
    const booking = await createRentalBooking(parsed.data);

    if (useDevPaymentBypass) {
      const confirmed = await markRentalBookingPaid(booking.id, `dev_bypass_${booking.id}`);
      const [item, spot, timeSlot] = await Promise.all([
        prisma.rentalItem.findUnique({ where: { id: confirmed.rentalItemId } }),
        prisma.rentalSpot.findUnique({ where: { id: confirmed.spotId } }),
        prisma.rentalTimeSlot.findUnique({ where: { id: confirmed.timeSlotId } }),
      ]);
      if (item && spot && timeSlot) await sendRentalBookingConfirmationEmail(confirmed, item, spot, timeSlot);

      return res.status(201).json({
        bookingId: confirmed.id,
        amountTotal: confirmed.amountTotal,
        clientSecret: null,
        devBypass: true,
      });
    }

    const paymentIntent = await createRentalPaymentIntent(Number(booking.amountTotal), booking.id);
    res.status(201).json({
      bookingId: booking.id,
      amountTotal: booking.amountTotal,
      clientSecret: paymentIntent.client_secret,
    });
  } catch (err) {
    if (err instanceof RentalError) return res.status(err.status).json({ error: err.message });
    // eslint-disable-next-line no-console
    console.error(err);
    res.status(500).json({ error: "Failed to create booking" });
  }
});

// GET /api/rental-bookings/:id — booking status lookup (confirmation page)
router.get("/:id", async (req, res) => {
  const booking = await prisma.rentalBooking.findUnique({
    where: { id: req.params.id },
    include: { rentalItem: true, spot: true, timeSlot: true },
  });
  if (!booking) return res.status(404).json({ error: "Booking not found" });
  res.json(booking);
});

export default router;
