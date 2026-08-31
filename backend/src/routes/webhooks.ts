import { Router } from "express";
import { stripe } from "../services/stripeService";
import { markBookingPaid, releaseBooking } from "../services/bookingService";
import { markRentalBookingPaid, cancelRentalBooking } from "../services/rentalService";
import { markEventBookingPaid, cancelEventBooking } from "../services/eventService";
import { prisma } from "../lib/prisma";
import {
  sendBookingConfirmationEmail,
  sendRentalBookingConfirmationEmail,
  sendEventBookingConfirmationEmail,
} from "../services/emailService";

const router = Router();

// POST /api/webhooks/stripe — mounted with express.raw() body parsing (see index.ts)
router.post("/stripe", async (req, res) => {
  const signature = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    event = webhookSecret
      ? stripe.webhooks.constructEvent(req.body, signature as string, webhookSecret)
      : JSON.parse(req.body.toString());
  } catch (err) {
    return res.status(400).send(`Webhook signature verification failed`);
  }

  if (event.type === "payment_intent.succeeded") {
    const pi = event.data.object as {
      id: string;
      metadata: { bookingId?: string; rentalBookingId?: string; eventBookingId?: string };
    };

    if (pi.metadata?.bookingId) {
      const booking = await markBookingPaid(pi.metadata.bookingId, pi.id);
      const excursion = await prisma.excursion.findUnique({ where: { id: booking.excursionId } });
      if (excursion) await sendBookingConfirmationEmail(booking, excursion);
    }

    if (pi.metadata?.rentalBookingId) {
      const booking = await markRentalBookingPaid(pi.metadata.rentalBookingId, pi.id);
      const [item, spot, timeSlot] = await Promise.all([
        prisma.rentalItem.findUnique({ where: { id: booking.rentalItemId } }),
        prisma.rentalSpot.findUnique({ where: { id: booking.spotId } }),
        prisma.rentalTimeSlot.findUnique({ where: { id: booking.timeSlotId } }),
      ]);
      if (item && spot && timeSlot) await sendRentalBookingConfirmationEmail(booking, item, spot, timeSlot);
    }

    if (pi.metadata?.eventBookingId) {
      const booking = await markEventBookingPaid(pi.metadata.eventBookingId, pi.id);
      const [evt, tier] = await Promise.all([
        prisma.event.findUnique({ where: { id: booking.eventId } }),
        prisma.eventTicketTier.findUnique({ where: { id: booking.tierId } }),
      ]);
      if (evt && tier) await sendEventBookingConfirmationEmail(booking, evt, tier);
    }
  }

  if (event.type === "payment_intent.payment_failed" || event.type === "payment_intent.canceled") {
    const pi = event.data.object as {
      metadata: { bookingId?: string; rentalBookingId?: string; eventBookingId?: string };
    };
    if (pi.metadata?.bookingId) await releaseBooking(pi.metadata.bookingId);
    if (pi.metadata?.rentalBookingId) await cancelRentalBooking(pi.metadata.rentalBookingId);
    if (pi.metadata?.eventBookingId) await cancelEventBooking(pi.metadata.eventBookingId);
  }

  res.json({ received: true });
});

export default router;
