import Link from "next/link";
import { api } from "@/lib/api";
import { notFound } from "next/navigation";
import { formatTimeRange } from "@/lib/time";
import { settingsApi } from "@/lib/settingsApi";
import BookingActions from "@/components/site/BookingActions";

export default async function ConfirmationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [booking, settings] = await Promise.all([api.getBooking(id).catch(() => null), settingsApi.getSettings()]);
  if (!booking) notFound();

  const paid = booking.paymentStatus === "PAID";
  const offlinePending = booking.paymentMethod === "offline" && !paid;

  return (
    <main className="site-body mx-auto max-w-xl px-4 py-20 text-center sm:px-6">
      <div
        className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full ${
          paid ? "bg-foam" : "bg-sand"
        }`}
      >
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
      <h1 className="font-display text-3xl font-bold text-abyss">
        {paid ? "Booking confirmed!" : offlinePending ? "Booking received — pending payment" : "Payment processing…"}
      </h1>
      <p className="mt-2 text-abyss/60">
        {paid
          ? `A confirmation has been sent to ${booking.guestEmail}.`
          : offlinePending
            ? "We've held your spot. Pay to the below details, then send your receipt to confirm."
            : "We're finalizing your payment. Refresh this page in a moment, or check your email shortly."}
      </p>

      {offlinePending && (settings.offlinePaymentInstructions || settings.offlinePaymentReceiptEmail) && (
        <div className="mt-6 rounded-xl border border-rule bg-sand p-5 text-left text-sm text-abyss">
          {settings.offlinePaymentInstructions && (
            <p className="whitespace-pre-line">{settings.offlinePaymentInstructions}</p>
          )}
          {settings.offlinePaymentReceiptEmail && (
            <p className={settings.offlinePaymentInstructions ? "mt-3" : ""}>
              Send your payment receipt — referencing booking ID{" "}
              <span className="font-semibold">{booking.bookingCode ?? booking.id}</span> — to{" "}
              <a href={`mailto:${settings.offlinePaymentReceiptEmail}`} className="font-semibold underline">
                {settings.offlinePaymentReceiptEmail}
              </a>
              .
            </p>
          )}
        </div>
      )}

      <div className="mt-8 rounded-2xl border border-rule p-6 text-left text-sm shadow-sm">
        <Row label="Excursion" value={booking.excursion?.title} />
        <Row
          label="Date & time"
          value={
            booking.slot
              ? `${booking.slot.date.slice(0, 10)} · ${formatTimeRange(
                  booking.slot.time,
                  booking.excursion?.durationMinutes ?? 0
                )}`
              : "—"
          }
        />
        <Row label="Guests" value={String(booking.totalGuests)} />
        <Row label="Total" value={`$${booking.amountTotal}`} bold />
        <div className="flex justify-between py-1.5">
          <span className="text-abyss/45">Booking reference</span>
          <span className="font-mono text-xs text-abyss/60">{booking.bookingCode ?? booking.id}</span>
        </div>
      </div>

      <BookingActions pdfPath={`/bookings/${booking.id}/pdf`} />

      <Link href="/" className="mt-8 inline-block text-sm font-medium text-coral-ink hover:text-abyss print:hidden">
        ← Browse more excursions
      </Link>
    </main>
  );
}

function Row({ label, value, bold }: { label: string; value?: string; bold?: boolean }) {
  return (
    <div className="flex justify-between border-b border-rule py-1.5 last:border-0">
      <span className="text-abyss/45">{label}</span>
      <span className={bold ? "font-semibold text-abyss" : "font-medium text-abyss"}>{value}</span>
    </div>
  );
}
