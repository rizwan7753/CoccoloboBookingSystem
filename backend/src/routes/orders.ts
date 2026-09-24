import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { createOrder, getOrderWithItems, markOrderPaid, OrderError } from "../services/orderService";
import { createOrderPaymentIntent, isStripeConfigured } from "../services/stripeService";
import { chargeNmiToken } from "../services/nmiService";
import { sendOrderConfirmationEmail, sendOfflinePaymentPendingEmail, sendAdminNewBookingNotification } from "../services/emailService";
import { streamBookingConfirmationPdf, PdfRow } from "../lib/bookingPdf";

const router = Router();

const excursionItemSchema = z.object({
  type: z.literal("excursion"),
  excursionId: z.string(),
  date: z.string(),
  time: z.string(),
  specialRequests: z.string().optional(),
  adultCount: z.number().int().min(0),
  childCount: z.number().int().min(0).optional(),
});
const rentalItemSchema = z.object({
  type: z.literal("rental"),
  rentalItemId: z.string(),
  spotId: z.string(),
  timeSlotId: z.string(),
  date: z.string(),
  adultCount: z.number().int().min(0),
  childCount: z.number().int().min(0).optional(),
});
const eventItemSchema = z.object({
  type: z.literal("event"),
  eventId: z.string(),
  tierId: z.string(),
  quantity: z.number().int().min(1),
});

const createOrderSchema = z.object({
  items: z.array(z.discriminatedUnion("type", [excursionItemSchema, rentalItemSchema, eventItemSchema])).min(1),
  guestName: z.string().min(1),
  guestEmail: z.string().email(),
  guestPhone: z.string().optional(),
  roomNumber: z.string().optional(),
  paymentMethod: z.enum(["stripe", "offline", "nmi"]).optional(),
});

function summarizeItems(order: NonNullable<Awaited<ReturnType<typeof getOrderWithItems>>>): string[] {
  return [
    ...order.bookings.map((b) => `Excursion: ${b.excursion?.title ?? ""} — ${b.slot?.date.toISOString().slice(0, 10)} ${b.slot?.time}`),
    ...order.rentalBookings.map((b) => `Beach chair: ${b.rentalItem?.name ?? ""} (${b.spot?.code ?? ""}) — ${b.date.toISOString().slice(0, 10)}`),
    ...order.eventBookings.map((b) => `Event: ${b.event?.title ?? ""} — ${b.tier?.name ?? ""} x${b.quantity}`),
  ];
}

// POST /api/orders — same control flow as POST /api/bookings (and the other
// two single-item routes), just against a multi-item cart: creates a
// PENDING order + holds capacity for every item (all-or-nothing — see
// orderService.createOrder), then either confirms immediately (offline /
// dev bypass), returns a Stripe PaymentIntent client secret for the order's
// combined total, or leaves it PENDING awaiting an NMI charge.
router.post("/", async (req, res) => {
  const parsed = createOrderSchema.safeParse(req.body);
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

    const { order } = await createOrder({ ...parsed.data, items: parsed.data.items as any });
    const full = await getOrderWithItems(order.id);
    if (!full) throw new OrderError("Order not found after creation", 500);

    await sendAdminNewBookingNotification({
      type: "order",
      title: `Order — ${full.bookings.length + full.rentalBookings.length + full.eventBookings.length} item(s)`,
      guestName: full.guestName,
      guestEmail: full.guestEmail,
      guestPhone: full.guestPhone,
      roomNumber: full.roomNumber,
      amountTotal: full.amountTotal,
      paymentMethod: requestedMethod,
      bookingCode: full.bookingCode ?? full.id,
      details: summarizeItems(full),
    });

    // Offline is checked first and unconditionally — same rule as the
    // single-item flows: an explicit guest choice to pay offline is never
    // silently overridden by the dev bypass.
    if (requestedMethod === "offline") {
      await prisma.order.update({
        where: { id: order.id },
        data: { paymentMethod: "offline", stripePaymentIntentId: `offline_${order.id}` },
      });
      await sendOfflinePaymentPendingEmail({
        guestEmail: full.guestEmail,
        guestName: full.guestName,
        title: `your order (${summarizeItems(full).length} item${summarizeItems(full).length === 1 ? "" : "s"})`,
        amountTotal: full.amountTotal,
        bookingId: full.bookingCode ?? full.id,
        details: summarizeItems(full),
        instructions: location?.offlinePaymentInstructions,
        receiptEmail: location?.offlinePaymentReceiptEmail,
      });
      return res.status(201).json({
        orderId: order.id,
        bookingCode: order.bookingCode,
        amountTotal: order.amountTotal,
        clientSecret: null,
        offlinePending: true,
      });
    }

    if (requestedMethod === "nmi") {
      await prisma.order.update({
        where: { id: order.id },
        data: { paymentMethod: "nmi", stripePaymentIntentId: `nmi_pending_${order.id}` },
      });
      return res.status(201).json({
        orderId: order.id,
        bookingCode: order.bookingCode,
        amountTotal: order.amountTotal,
        clientSecret: null,
        nmiPending: true,
      });
    }

    if (useDevPaymentBypass) {
      const confirmed = await markOrderPaid(order.id, `dev_bypass_${order.id}`, "stripe");
      if (confirmed) await sendOrderConfirmationEmail(confirmed);
      return res.status(201).json({
        orderId: order.id,
        bookingCode: order.bookingCode,
        amountTotal: order.amountTotal,
        clientSecret: null,
        devBypass: true,
      });
    }

    await prisma.order.update({ where: { id: order.id }, data: { paymentMethod: "stripe" } });
    const paymentIntent = await createOrderPaymentIntent(Number(order.amountTotal), order.id);
    res.status(201).json({
      orderId: order.id,
      bookingCode: order.bookingCode,
      amountTotal: order.amountTotal,
      clientSecret: paymentIntent.client_secret,
    });
  } catch (err) {
    if (err instanceof OrderError) return res.status(err.status).json({ error: err.message });
    // eslint-disable-next-line no-console
    console.error(err);
    res.status(500).json({ error: "Failed to create order" });
  }
});

// POST /api/orders/:id/nmi-charge — charges the Collect.js token for an
// order created with paymentMethod=nmi. A decline leaves the order PENDING
// (capacity still held) so the guest can retry, same as every other flow.
const nmiChargeSchema = z.object({ paymentToken: z.string().min(1) });
router.post("/:id/nmi-charge", async (req, res) => {
  const parsed = nmiChargeSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Missing payment token" });

  const order = await prisma.order.findUnique({ where: { id: req.params.id } });
  if (!order) return res.status(404).json({ error: "Order not found" });
  if (order.paymentMethod !== "nmi") return res.status(400).json({ error: "This order isn't set up for NMI payment" });
  if (order.paymentStatus === "PAID") return res.status(400).json({ error: "This order is already paid" });

  try {
    const result = await chargeNmiToken(Number(order.amountTotal), parsed.data.paymentToken, order.id);
    if (!result.approved) {
      return res.status(402).json({ error: result.responseText });
    }

    const confirmed = await markOrderPaid(order.id, result.transactionId || `nmi_${order.id}`, "nmi");
    if (confirmed) await sendOrderConfirmationEmail(confirmed);

    res.json({ approved: true, orderId: order.id });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
    res.status(500).json({ error: "Payment failed — please try again." });
  }
});

// GET /api/orders/:id — order status + every line item (used by the
// confirmation page and find-my-booking)
router.get("/:id", async (req, res) => {
  const order = await getOrderWithItems(req.params.id);
  if (!order) return res.status(404).json({ error: "Order not found" });
  res.json(order);
});

// GET /api/orders/:id/pdf — printable/downloadable confirmation, same data
// shown on the order confirmation page.
router.get("/:id/pdf", async (req, res) => {
  const [order, location] = await Promise.all([getOrderWithItems(req.params.id), prisma.location.findFirst()]);
  if (!order) return res.status(404).json({ error: "Order not found" });

  const paid = order.paymentStatus === "PAID";
  const rows: PdfRow[] = [
    ...summarizeItems(order).map((line) => {
      const [label, ...rest] = line.split(":");
      return { label: label.trim(), value: rest.join(":").trim() };
    }),
    { label: "Payment status", value: paid ? "Paid" : "Pending" },
    { label: "Total", value: `$${order.amountTotal}` },
  ];

  streamBookingConfirmationPdf(res, {
    type: "order",
    locationName: location?.name || "Booking confirmation",
    heading: "Order confirmation",
    guestName: order.guestName,
    statusLabel: paid ? "Your order is confirmed." : "Your order is pending payment confirmation.",
    rows,
    bookingCode: order.bookingCode ?? order.id,
  });
});

export default router;
