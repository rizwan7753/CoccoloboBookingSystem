import Link from "next/link";
import { notFound } from "next/navigation";
import { eventApi } from "@/lib/eventApi";

export default async function EventConfirmationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const booking = await eventApi.getBooking(id).catch(() => null);
  if (!booking) notFound();

  const paid = booking.paymentStatus === "PAID";

  return (
    <main className="mx-auto max-w-xl px-4 py-20 text-center sm:px-6">
      <div className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full ${paid ? "bg-fuchsia-100" : "bg-stone-100"}`}>
        {paid ? (
          <svg className="h-8 w-8 text-fuchsia-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <svg className="h-8 w-8 animate-pulse text-stone-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
      <h1 className="font-display text-3xl font-bold text-stone-900">{paid ? "Tickets confirmed!" : "Payment processing…"}</h1>
      <p className="mt-2 text-stone-500">
        {paid
          ? `A confirmation has been sent to ${booking.guestEmail}.`
          : "We're finalizing your payment. Refresh this page in a moment, or check your email shortly."}
      </p>

      <div className="mt-8 rounded-2xl border border-stone-200 p-6 text-left text-sm shadow-sm">
        <Row label="Event" value={booking.event?.title} />
        <Row label="Ticket" value={booking.tier?.name} />
        <Row label="Quantity" value={String(booking.quantity)} />
        <Row label="Total" value={`$${booking.amountTotal}`} bold />
        <div className="flex justify-between py-1.5">
          <span className="text-stone-400">Booking reference</span>
          <span className="font-mono text-xs text-stone-500">{booking.id}</span>
        </div>
      </div>

      <Link href="/events" className="mt-8 inline-block text-sm font-medium text-fuchsia-700 hover:text-fuchsia-800">
        ← Browse more events
      </Link>
    </main>
  );
}

function Row({ label, value, bold }: { label: string; value?: string; bold?: boolean }) {
  return (
    <div className="flex justify-between border-b border-stone-100 py-1.5 last:border-0">
      <span className="text-stone-400">{label}</span>
      <span className={bold ? "font-semibold text-stone-900" : "font-medium text-stone-700"}>{value}</span>
    </div>
  );
}
