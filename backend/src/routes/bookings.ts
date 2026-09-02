import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { createBooking, markBookingPaid, BookingError } from "../services/bookingService";
import { createPaymentIntent, isStripeConfigured } from "../services/stripeService";
import { chargeNmiToken } from "../services/nmiService";
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
  paymentMethod: z.enum(["stripe", "offline", "nmi"]).optional(),
});

// POST /api/bookings — creates a PENDING booking + holds capacity, then
// either confirms it immediately (offline / dev bypass), returns a Stripe
// PaymentIntent client secret, or leaves it PENDING awaiting an NMI charge
// via POST /:id/nmi-charge (NMI's Collect.js token is collected in the
// payment step, same UI position as Stripe's card form).
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
    // load) since the key can change at runtime via the Settings page. This
    // bypass only ever stands in for the default/Stripe path — an explicit
    // offline or NMI choice below is always honored regardless of it.
    const useDevPaymentBypass = !(await isStripeConfigured());
    const requestedMethod = parsed.data.paymentMethod ?? "stripe";

    if (!useDevPaymentBypass || requestedMethod !== "stripe") {
      const anyEnabled = location?.stripeEnabled || location?.offlinePaymentEnabled || location?.nmiEnabled;
      if (!anyEnabled) {
        return res.status(400).json({ error: "No payment method is currently available — please contact us." });
      }
      if (requestedMethod === "offline" && !location?.offlinePaymentEnabled) {
        return res.status(400).json({ error: "Offline payment isn't available — please choose another method." });
      }
      if (requestedMethod === "nmi" && !location?.nmiEnabled) {
        return res.status(400).json({ error: "That card payment option isn't available — please choose another method." });
      }
      if (requestedMethod === "stripe" && location?.stripeEnabled === false && !useDevPaymentBypass) {
        return res.status(400).json({ error: "Card payment isn't available — please choose another method." });
      }
    }

    const booking = await createBooking(parsed.data);

    // Offline is checked first and unconditionally — an explicit guest
    // choice to pay offline must never be silently overridden by the dev
    // bypass. Offline bookings always stay PENDING until staff manually
    // verify payment, regardless of Stripe configuration state.
    if (requestedMethod === "offline") {
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

    // NMI: also checked explicitly, also never overridden by the dev bypass.
    // Unlike Stripe there's no clientSecret step — the booking is left
    // PENDING with a placeholder stripePaymentIntentId (same trick as
    // offline, just to satisfy the unique constraint) and the guest's
    // Collect.js token is charged via POST /:id/nmi-charge from the payment
    // step, mirroring where Stripe's card form appears in the same UI.
    if (requestedMethod === "nmi") {
      await prisma.booking.update({
        where: { id: booking.id },
        data: { paymentMethod: "nmi", stripePaymentIntentId: `nmi_pending_${booking.id}` },
      });
      return res.status(201).json({
        bookingId: booking.id,
        amountTotal: booking.amountTotal,
        clientSecret: null,
        nmiPending: true,
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

// POST /api/bookings/:id/nmi-charge — charges the Collect.js token collected
// in the payment step for a booking created with paymentMethod=nmi. A
// decline leaves the booking PENDING (capacity still held) so the guest can
// retry with a fresh token, same UX as a declined Stripe card.
const nmiChargeSchema = z.object({ paymentToken: z.string().min(1) });
router.post("/:id/nmi-charge", async (req, res) => {
  const parsed = nmiChargeSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Missing payment token" });

  const booking = await prisma.booking.findUnique({ where: { id: req.params.id } });
  if (!booking) return res.status(404).json({ error: "Booking not found" });
  if (booking.paymentMethod !== "nmi") return res.status(400).json({ error: "This booking isn't set up for NMI payment" });
  if (booking.paymentStatus === "PAID") return res.status(400).json({ error: "This booking is already paid" });

  try {
    const result = await chargeNmiToken(Number(booking.amountTotal), parsed.data.paymentToken, booking.id);
    if (!result.approved) {
      return res.status(402).json({ error: result.responseText });
    }

    const confirmed = await markBookingPaid(booking.id, result.transactionId || `nmi_${booking.id}`, "nmi");
    const excursion = await prisma.excursion.findUnique({ where: { id: confirmed.excursionId } });
    if (excursion) await sendBookingConfirmationEmail(confirmed, excursion);

    res.json({ approved: true, bookingId: confirmed.id });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
    res.status(500).json({ error: "Payment failed — please try again." });
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
