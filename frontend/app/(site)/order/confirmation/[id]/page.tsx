import Link from "next/link";
import { notFound } from "next/navigation";
import { orderApi } from "@/lib/orderApi";
import { formatTimeRange } from "@/lib/time";
import { settingsApi } from "@/lib/settingsApi";
import BookingActions from "@/components/site/BookingActions";
import Row from "@/components/site/Row";

export default async function OrderConfirmationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [order, settings] = await Promise.all([orderApi.getOrder(id).catch(() => null), settingsApi.getSettings()]);
  if (!order) notFound();

  const paid = order.paymentStatus === "PAID";
  const offlinePending = order.paymentMethod === "offline" && !paid;
  const itemCount = order.bookings.length + order.rentalBookings.length + order.eventBookings.length;

  return (
    <main className="site-body mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
      <div className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full ${paid ? "bg-foam" : "bg-sand"}`}>
        {paid ? (
          <svg className="h-8 w-8 text-coral-ink" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : offlinePending ? (
          <svg className="h-8 w-8 text-coral-ink" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M12 9v4M12 17h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L14.71 3.86a2 2 0 0 0-3.42 0Z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <svg className="h-8 w-8 animate-pulse text-coral-ink" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
      <h1 className="font-display text-3xl text-abyss">
        {paid ? "Order confirmed!" : offlinePending ? "Order received — pending payment" : "Payment processing…"}
      </h1>
      <p className="mt-2 opacity-70">
        {paid
          ? `A confirmation has been sent to ${order.guestEmail}.`
          : offlinePending
            ? "We've held your spots. Pay to the below details, then send your receipt to confirm."
            : "We're finalizing your payment. Refresh this page in a moment, or check your email shortly."}
      </p>

      {offlinePending && (settings.offlinePaymentInstructions || settings.offlinePaymentReceiptEmail) && (
        <div className="mt-6 rounded-xl border border-rule bg-sand p-5 text-left text-sm text-abyss">
          {settings.offlinePaymentInstructions && <p className="whitespace-pre-line">{settings.offlinePaymentInstructions}</p>}
          {settings.offlinePaymentReceiptEmail && (
            <p className={settings.offlinePaymentInstructions ? "mt-3" : ""}>
              Send your payment receipt — referencing booking ID{" "}
              <span className="font-semibold">{order.bookingCode ?? order.id}</span> — to{" "}
              <a href={`mailto:${settings.offlinePaymentReceiptEmail}`} className="font-semibold underline">
                {settings.offlinePaymentReceiptEmail}
              </a>
              .
            </p>
          )}
        </div>
      )}

      <div className="mt-8 flex flex-col gap-4 text-left">
        {order.bookings.map((b) => (
          <div key={b.id} className="rounded-2xl border border-rule p-6 text-sm shadow-sm">
            <Row label="Excursion" value={b.excursion?.title} />
            <Row label="Date & time" value={b.slot ? `${b.slot.date.slice(0, 10)} · ${formatTimeRange(b.slot.time, b.excursion?.durationMinutes ?? 0)}` : "—"} />
            <Row label="Guests" value={String(b.totalGuests)} />
            <Row label="Amount" value={`$${b.amountTotal}`} bold />
          </div>
        ))}
        {order.rentalBookings.map((b) => (
          <div key={b.id} className="rounded-2xl border border-rule p-6 text-sm shadow-sm">
            <Row label="Beach chair" value={b.rentalItem?.name} />
            <Row label="Spot" value={b.spot?.code} />
            <Row label="Time" value={b.timeSlot ? `${b.timeSlot.label} (${b.timeSlot.startTime}–${b.timeSlot.endTime})` : undefined} />
            <Row label="Date" value={b.date.slice(0, 10)} />
            <Row label="Chairs" value={String(b.quantity)} />
            <Row label="Amount" value={`$${b.amountTotal}`} bold />
          </div>
        ))}
        {order.eventBookings.map((b) => (
          <div key={b.id} className="rounded-2xl border border-rule p-6 text-sm shadow-sm">
            <Row label="Event" value={b.event?.title} />
            <Row label="Ticket" value={b.tier?.name} />
            <Row label="Quantity" value={String(b.quantity)} />
            <Row label="Amount" value={`$${b.amountTotal}`} bold />
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-2xl border border-rule p-6 text-left text-sm shadow-sm">
        <Row label="Items" value={String(itemCount)} />
        <Row label="Total" value={`$${order.amountTotal}`} bold />
        <div className="flex justify-between py-1.5">
          <span className="text-abyss/45">Booking reference</span>
          <span className="font-mono text-xs text-abyss/60">{order.bookingCode ?? order.id}</span>
        </div>
      </div>

      <BookingActions pdfPath={`/orders/${order.id}/pdf`} />

      <Link href="/" className="mt-8 inline-block text-sm font-medium text-coral-ink hover:text-abyss print:hidden">
        ← Back to home
      </Link>
    </main>
  );
}
