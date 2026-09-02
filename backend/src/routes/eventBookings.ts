import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { createEventBooking, markEventBookingPaid, EventError } from "../services/eventService";
import { createEventPaymentIntent, isStripeConfigured } from "../services/stripeService";
import { sendEventBookingConfirmationEmail, sendOfflinePaymentPendingEmail } from "../services/emailService";

const router = Router();

const createEventBookingSchema = z.object({
  eventId: z.string(),
  tierId: z.string(),
  quantity: z.number().int().min(1),
  guestName: z.string().min(1),
  guestEmail: z.string().email(),
  guestPhone: z.string().optional(),
  roomNumber: z.string().optional(),
  paymentMethod: z.enum(["stripe", "offline"]).optional(),
});

// POST /api/event-bookings — reserves `quantity` tickets at one tier.
router.post("/", async (req, res) => {
  const parsed = createEventBookingSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
  }

  try {
    const location = await prisma.location.findFirst();
    const useDevPaymentBypass = !(await isStripeConfigured());

    if (!useDevPaymentBypass) {
      if (!location?.stripeEnabled && !location?.offlinePaymentEnabled) {
        return res.status(400).json({ error: "No payment method is currently available — please contact us." });
      }
      const wantsOffline = parsed.data.paymentMethod === "offline";
      if (wantsOffline && !location?.offlinePaymentEnabled) {
        return res.status(400).json({ error: "Offline payment isn't available — please pay by card." });
      }
      if (!wantsOffline && location?.stripeEnabled === false) {
        return res.status(400).json({ error: "Card payment isn't available — please choose offline payment." });
      }
    }

    const booking = await createEventBooking(parsed.data);

    // Offline is checked first and unconditionally — see bookings.ts for why.
    if (parsed.data.paymentMethod === "offline") {
      const [event, tier] = await Promise.all([
        prisma.event.findUnique({ where: { id: booking.eventId } }),
        prisma.eventTicketTier.findUnique({ where: { id: booking.tierId } }),
      ]);
      await prisma.eventBooking.update({
        where: { id: booking.id },
        data: { paymentMethod: "offline", stripePaymentIntentId: `offline_${booking.id}` },
      });
      await sendOfflinePaymentPendingEmail({
        guestEmail: booking.guestEmail,
        guestName: booking.guestName,
        title: event?.title ?? "your event",
        amountTotal: booking.amountTotal,
        bookingId: booking.id,
        details: [
          event ? `Event date: ${event.eventDate.toISOString().slice(0, 10)} at ${event.startTime}` : "",
          event?.venue ? `Venue: ${event.venue}` : "",
          tier ? `${booking.quantity} x ${tier.name}` : `Quantity: ${booking.quantity}`,
        ].filter(Boolean),
        instructions: location?.offlinePaymentInstructions,
        receiptEmail: location?.offlinePaymentReceiptEmail,
      });
      return res.status(201).json({
        bookingId: booking.id,
        amountTotal: booking.amountTotal,
        clientSecret: null,
        offlinePending: true,
      });
    }

    if (useDevPaymentBypass) {
      const confirmed = await markEventBookingPaid(booking.id, `dev_bypass_${booking.id}`, "stripe");
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

    await prisma.eventBooking.update({ where: { id: booking.id }, data: { paymentMethod: "stripe" } });
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
