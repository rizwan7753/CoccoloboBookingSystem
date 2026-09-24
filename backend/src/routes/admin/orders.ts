import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { requireAdmin, AuthedRequest } from "../../middleware/requireAdmin";
import { requirePermission } from "../../middleware/requirePermission";
import { releaseOrder, markOrderPaidManually, getOrderWithItems, OrderError } from "../../services/orderService";
import { sendOrderConfirmationEmail } from "../../services/emailService";
import { sendExcel } from "../../lib/excelExport";

const router = Router();
router.use(requireAdmin);

// Shared by GET / and GET /export — same "bookings.view"/"bookings.manage"
// permissions as the other three admin booking lists (excursion/rental/
// event), rather than a new permission key, so an order is just another
// kind of booking from a staff-permissions point of view.
function queryOrders(query: { status?: string; from?: string; to?: string }) {
  return prisma.order.findMany({
    where: {
      status: (query.status as any) || undefined,
      createdAt: {
        gte: query.from ? new Date(query.from) : undefined,
        lte: query.to ? new Date(query.to) : undefined,
      },
    },
    include: {
      bookings: { include: { excursion: true, slot: true } },
      rentalBookings: { include: { rentalItem: true, spot: true, timeSlot: true } },
      eventBookings: { include: { event: true, tier: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

function itemSummary(order: Awaited<ReturnType<typeof queryOrders>>[number]): string {
  return [
    ...order.bookings.map((b) => b.excursion?.title ?? "Excursion"),
    ...order.rentalBookings.map((b) => b.rentalItem?.name ?? "Beach chair"),
    ...order.eventBookings.map((b) => b.event?.title ?? "Event"),
  ].join(", ");
}

// GET /api/admin/orders?status=&from=&to=
router.get("/", requirePermission("bookings.view"), async (req, res) => {
  res.json(await queryOrders(req.query as any));
});

// GET /api/admin/orders/export?status=&from=&to= — same filters as the list
// view, downloaded as an .xlsx workbook.
router.get("/export", requirePermission("bookings.view"), async (req, res) => {
  const orders = await queryOrders(req.query as any);
  await sendExcel(
    res,
    `orders-${new Date().toISOString().slice(0, 10)}.xlsx`,
    "Orders",
    [
      { header: "Reference", key: "bookingCode", width: 24 },
      { header: "Items", key: "items", width: 40 },
      { header: "Item count", key: "itemCount", width: 10 },
      { header: "Guest name", key: "guestName", width: 22 },
      { header: "Email", key: "guestEmail", width: 26 },
      { header: "Phone", key: "guestPhone", width: 16 },
      { header: "Room", key: "roomNumber", width: 10 },
      { header: "Amount", key: "amountTotal", width: 12 },
      { header: "Currency", key: "currency", width: 10 },
      { header: "Status", key: "status", width: 14 },
      { header: "Payment status", key: "paymentStatus", width: 16 },
      { header: "Payment method", key: "paymentMethod", width: 16 },
      { header: "Source", key: "source", width: 16 },
      { header: "Order ID", key: "id", width: 26 },
      { header: "Created", key: "createdAt", width: 20 },
    ],
    orders.map((o) => ({
      bookingCode: o.bookingCode ?? "",
      items: itemSummary(o),
      itemCount: o.bookings.length + o.rentalBookings.length + o.eventBookings.length,
      guestName: o.guestName,
      guestEmail: o.guestEmail,
      guestPhone: o.guestPhone ?? "",
      roomNumber: o.roomNumber ?? "",
      amountTotal: Number(o.amountTotal),
      currency: o.currency,
      status: o.status,
      paymentStatus: o.paymentStatus,
      paymentMethod: o.paymentMethod ?? "",
      source: o.source,
      id: o.id,
      createdAt: o.createdAt.toISOString(),
    }))
  );
});

// GET /api/admin/orders/:id — full order detail, same shape the guest
// confirmation page reads.
router.get("/:id", requirePermission("bookings.view"), async (req, res) => {
  const order = await getOrderWithItems(req.params.id);
  if (!order) return res.status(404).json({ error: "Order not found" });
  res.json(order);
});

// POST /api/admin/orders/:id/cancel — staff-initiated cancellation, releases
// capacity for every line item in the order.
router.post("/:id/cancel", requirePermission("bookings.manage"), async (req: AuthedRequest, res) => {
  const { reason } = req.body as { reason?: string };
  await releaseOrder(req.params.id, { adminUserId: req.admin!.sub, actorLabel: req.admin!.email }, reason);
  res.json({ ok: true });
});

// POST /api/admin/orders/:id/mark-paid — confirm an offline (bank
// deposit/transfer) order once staff have verified the payment arrived.
router.post("/:id/mark-paid", requirePermission("bookings.manage"), async (req: AuthedRequest, res) => {
  try {
    const order = await markOrderPaidManually(req.params.id, {
      adminUserId: req.admin!.sub,
      actorLabel: req.admin!.email,
    });
    if (order) await sendOrderConfirmationEmail(order);
    res.json(order);
  } catch (err) {
    if (err instanceof OrderError) return res.status(err.status).json({ error: err.message });
    throw err;
  }
});

export default router;
