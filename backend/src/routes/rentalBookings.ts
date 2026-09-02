import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { createRentalBooking, markRentalBookingPaid, RentalError } from "../services/rentalService";
import { createRentalPaymentIntent, isStripeConfigured } from "../services/stripeService";
import { sendRentalBookingConfirmationEmail, sendOfflinePaymentPendingEmail } from "../services/emailService";

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
  paymentMethod: z.enum(["stripe", "offline"]).optional(),
});

// POST /api/rental-bookings — reserves a specific spot for a specific date.
router.post("/", async (req, res) => {
  const parsed = createRentalBookingSchema.safeParse(req.body);
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

    const booking = await createRentalBooking(parsed.data);

    // Offline is checked first and unconditionally — see bookings.ts for why.
    if (parsed.data.paymentMethod === "offline") {
      const [item, spot, timeSlot] = await Promise.all([
        prisma.rentalItem.findUnique({ where: { id: booking.rentalItemId } }),
        prisma.rentalSpot.findUnique({ where: { id: booking.spotId } }),
        prisma.rentalTimeSlot.findUnique({ where: { id: booking.timeSlotId } }),
      ]);
      await prisma.rentalBooking.update({
        where: { id: booking.id },
        data: { paymentMethod: "offline", stripePaymentIntentId: `offline_${booking.id}` },
      });
      await sendOfflinePaymentPendingEmail({
        guestEmail: booking.guestEmail,
        guestName: booking.guestName,
        title: item?.name ?? "your rental",
        amountTotal: booking.amountTotal,
        bookingId: booking.id,
        details: [
          `Date: ${booking.date.toISOString().slice(0, 10)}`,
          timeSlot ? `Time slot: ${timeSlot.label} (${timeSlot.startTime}-${timeSlot.endTime})` : "",
          spot ? `Spot: ${spot.code}` : "",
          `Chairs reserved: ${booking.quantity}`,
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
      const confirmed = await markRentalBookingPaid(booking.id, `dev_bypass_${booking.id}`, "stripe");
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

    await prisma.rentalBooking.update({ where: { id: booking.id }, data: { paymentMethod: "stripe" } });
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
