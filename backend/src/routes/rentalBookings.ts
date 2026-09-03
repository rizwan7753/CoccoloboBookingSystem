import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { createRentalBooking, markRentalBookingPaid, RentalError } from "../services/rentalService";
import { createRentalPaymentIntent, isStripeConfigured } from "../services/stripeService";
import { chargeNmiToken } from "../services/nmiService";
import { sendRentalBookingConfirmationEmail, sendOfflinePaymentPendingEmail } from "../services/emailService";
import { streamBookingConfirmationPdf, PdfRow } from "../lib/bookingPdf";

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
  paymentMethod: z.enum(["stripe", "offline", "nmi"]).optional(),
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

    const booking = await createRentalBooking(parsed.data);

    // Offline is checked first and unconditionally — see bookings.ts for why.
    if (requestedMethod === "offline") {
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
        bookingId: booking.bookingCode ?? booking.id,
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
        bookingCode: booking.bookingCode,
        amountTotal: booking.amountTotal,
        clientSecret: null,
        offlinePending: true,
      });
    }

    // NMI — see bookings.ts for why this is checked explicitly too, and why
    // there's no clientSecret step (charge happens via POST /:id/nmi-charge).
    if (requestedMethod === "nmi") {
      await prisma.rentalBooking.update({
        where: { id: booking.id },
        data: { paymentMethod: "nmi", stripePaymentIntentId: `nmi_pending_${booking.id}` },
      });
      return res.status(201).json({
        bookingId: booking.id,
        bookingCode: booking.bookingCode,
        amountTotal: booking.amountTotal,
        clientSecret: null,
        nmiPending: true,
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
        bookingCode: confirmed.bookingCode,
        amountTotal: confirmed.amountTotal,
        clientSecret: null,
        devBypass: true,
      });
    }

    await prisma.rentalBooking.update({ where: { id: booking.id }, data: { paymentMethod: "stripe" } });
    const paymentIntent = await createRentalPaymentIntent(Number(booking.amountTotal), booking.id);
    res.status(201).json({
      bookingId: booking.id,
      bookingCode: booking.bookingCode,
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

// POST /api/rental-bookings/:id/nmi-charge — see bookings.ts for the pattern.
const nmiChargeSchema = z.object({ paymentToken: z.string().min(1) });
router.post("/:id/nmi-charge", async (req, res) => {
  const parsed = nmiChargeSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Missing payment token" });

  const booking = await prisma.rentalBooking.findUnique({ where: { id: req.params.id } });
  if (!booking) return res.status(404).json({ error: "Booking not found" });
  if (booking.paymentMethod !== "nmi") return res.status(400).json({ error: "This booking isn't set up for NMI payment" });
  if (booking.paymentStatus === "PAID") return res.status(400).json({ error: "This booking is already paid" });

  try {
    const result = await chargeNmiToken(Number(booking.amountTotal), parsed.data.paymentToken, booking.id);
    if (!result.approved) {
      return res.status(402).json({ error: result.responseText });
    }

    const confirmed = await markRentalBookingPaid(booking.id, result.transactionId || `nmi_${booking.id}`, "nmi");
    const [item, spot, timeSlot] = await Promise.all([
      prisma.rentalItem.findUnique({ where: { id: confirmed.rentalItemId } }),
      prisma.rentalSpot.findUnique({ where: { id: confirmed.spotId } }),
      prisma.rentalTimeSlot.findUnique({ where: { id: confirmed.timeSlotId } }),
    ]);
    if (item && spot && timeSlot) await sendRentalBookingConfirmationEmail(confirmed, item, spot, timeSlot);

    res.json({ approved: true, bookingId: confirmed.id });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
    res.status(500).json({ error: "Payment failed — please try again." });
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

// GET /api/rental-bookings/:id/pdf — see bookings.ts for the pattern.
router.get("/:id/pdf", async (req, res) => {
  const [booking, location] = await Promise.all([
    prisma.rentalBooking.findUnique({
      where: { id: req.params.id },
      include: { rentalItem: true, spot: true, timeSlot: true },
    }),
    prisma.location.findFirst(),
  ]);
  if (!booking) return res.status(404).json({ error: "Booking not found" });

  const paid = booking.paymentStatus === "PAID";
  const rows: PdfRow[] = [
    { label: "Rental", value: booking.rentalItem?.name ?? "" },
    { label: "Date", value: booking.date.toISOString().slice(0, 10) },
    ...(booking.timeSlot
      ? [{ label: "Time slot", value: `${booking.timeSlot.label} (${booking.timeSlot.startTime}-${booking.timeSlot.endTime})` }]
      : []),
    ...(booking.spot ? [{ label: "Spot", value: booking.spot.code }] : []),
    { label: "Chairs reserved", value: String(booking.quantity) },
    ...(booking.roomNumber ? [{ label: "Room/Villa", value: booking.roomNumber }] : []),
    { label: "Payment status", value: paid ? "Paid" : "Pending" },
    { label: "Total", value: `$${booking.amountTotal}` },
  ];

  streamBookingConfirmationPdf(res, {
    type: "rental",
    locationName: location?.name || "Booking confirmation",
    heading: booking.rentalItem?.name ?? "Booking confirmation",
    guestName: booking.guestName,
    statusLabel: paid ? "Your spot is reserved." : "Your booking is pending payment confirmation.",
    rows,
    bookingCode: booking.bookingCode ?? booking.id,
  });
});

export default router;
