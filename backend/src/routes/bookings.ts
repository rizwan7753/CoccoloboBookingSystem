import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { createBooking, markBookingPaid, BookingError } from "../services/bookingService";
import { createPaymentIntent, isStripeConfigured } from "../services/stripeService";
import { sendBookingConfirmationEmail, sendOfflinePaymentPendingEmail } from "../services/emailService";

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
  paymentMethod: z.enum(["stripe", "offline"]).optional(),
});

// POST /api/bookings — creates a PENDING booking + holds capacity,
// then returns a Stripe PaymentIntent client secret to complete payment.
router.post("/", async (req, res) => {
  const parsed = createBookingSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
  }

  try {
    const location = await prisma.location.findFirst();
    // No real Stripe key configured (DB or .env), so skip the network call and
    // auto-confirm — stripeService already logs a startup warning when this is
    // the case, so it's never silent. Resolved per-request now (not at module
    // load) since the key can change at runtime via the Settings page.
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

    const booking = await createBooking(parsed.data);

    // Offline is checked first and unconditionally — an explicit guest
    // choice to pay offline must never be silently overridden by the dev
    // bypass (which only stands in for the Stripe/card path when no real
    // key is configured). Offline bookings always stay PENDING until staff
    // manually verify payment, regardless of Stripe configuration state.
    if (parsed.data.paymentMethod === "offline") {
      const [excursion, slot] = await Promise.all([
        prisma.excursion.findUnique({ where: { id: booking.excursionId } }),
        prisma.departureSlot.findUnique({ where: { id: booking.slotId } }),
      ]);
      await prisma.booking.update({
        where: { id: booking.id },
        data: { paymentMethod: "offline", stripePaymentIntentId: `offline_${booking.id}` },
      });
      await sendOfflinePaymentPendingEmail({
        guestEmail: booking.guestEmail,
        guestName: booking.guestName,
        title: excursion?.title ?? "your excursion",
        amountTotal: booking.amountTotal,
        bookingId: booking.id,
        details: [
          slot ? `Date & time: ${slot.date.toISOString().slice(0, 10)} at ${slot.time}` : "",
          `Guests: ${booking.totalGuests} (Adults: ${booking.adultCount}, Children: ${booking.childCount})`,
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
      const confirmed = await markBookingPaid(booking.id, `dev_bypass_${booking.id}`, "stripe");
      const excursion = await prisma.excursion.findUnique({ where: { id: confirmed.excursionId } });
      if (excursion) await sendBookingConfirmationEmail(confirmed, excursion);

      return res.status(201).json({
        bookingId: confirmed.id,
        amountTotal: confirmed.amountTotal,
        clientSecret: null,
        devBypass: true,
      });
    }

    await prisma.booking.update({ where: { id: booking.id }, data: { paymentMethod: "stripe" } });
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
