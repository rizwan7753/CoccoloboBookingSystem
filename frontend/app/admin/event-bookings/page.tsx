"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { adminApi, AdminEvent, AdminEventBooking, getStoredAdmin, canCancelBookings } from "@/lib/adminApi";
import { PageHeader, Badge, cardClass, primaryButtonClass, inputClass } from "@/components/admin/ui";
import { DateRangeFilter } from "@/components/admin/DateRangeFilter";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function EventBookingsPage() {
  return (
    <Suspense fallback={null}>
      <EventBookingsPageInner />
    </Suspense>
  );
}

function EventBookingsPageInner() {
  const searchParams = useSearchParams();
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [eventId, setEventId] = useState(searchParams.get("eventId") || "");
  const [from, setFrom] = useState(todayISO());
  const [to, setTo] = useState("");
  const [bookings, setBookings] = useState<AdminEventBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const canCancel = canCancelBookings(getStoredAdmin()?.role);

  useEffect(() => {
    adminApi.listEvents().then(setEvents);
  }, []);

  async function search() {
    setLoading(true);
    try {
      setBookings(await adminApi.listEventBookings({ eventId: eventId || undefined, from, to: to || undefined }));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    search();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCancel(bookingId: string) {
    if (!confirm("Cancel this booking and release the tickets?")) return;
    await adminApi.cancelEventBooking(bookingId);
    search();
  }

  async function handleMarkPaid(bookingId: string) {
    if (!confirm("Confirm this booking as paid?")) return;
    await adminApi.markEventBookingPaid(bookingId);
    search();
  }

  async function handleExport() {
    setExporting(true);
    setExportError(null);
    try {
      await adminApi.exportEventBookings({ eventId: eventId || undefined, from, to: to || undefined });
    } catch (err) {
      setExportError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setExporting(false);
    }
  }

  const totalTickets = bookings.reduce((sum, b) => sum + b.quantity, 0);

  return (
    <div>
      <PageHeader title="Event Bookings" description="Attendees across all events, upcoming by default." />

      <div className={`${cardClass} flex flex-wrap items-end gap-3 p-4`}>
        <div>
          <label className="mb-1 block text-xs font-medium text-stone-500">Event</label>
          <select value={eventId} onChange={(e) => setEventId(e.target.value)} className={inputClass}>
            <option value="">All events</option>
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.title} — {event.eventDate.slice(0, 10)}
              </option>
            ))}
          </select>
        </div>
        <DateRangeFilter from={from} to={to} onFromChange={setFrom} onToChange={setTo} />
        <button onClick={search} className={primaryButtonClass}>
          Search
        </button>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 transition hover:border-fuchsia-600 hover:text-fuchsia-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {exporting ? "Exporting…" : "Export to Excel"}
        </button>
      </div>
      {exportError && <p className="mt-2 text-sm text-red-600">{exportError}</p>}

      {loading && <p className="mt-6 text-sm text-stone-400">Loading…</p>}

      {!loading && (
        <div className={`${cardClass} mt-6 overflow-hidden`}>
          <div className="flex items-center justify-between border-b border-stone-100 px-5 py-3">
            <p className="text-sm text-stone-600">
              <span className="font-semibold text-stone-900">{bookings.length}</span> booking(s) ·{" "}
              <span className="font-semibold text-stone-900">{totalTickets}</span> ticket(s) sold
            </p>
          </div>
          {bookings.length === 0 ? (
            <p className="p-6 text-sm text-stone-400">No bookings found for this range.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-stone-100 text-xs uppercase tracking-wide text-stone-400">
                <tr>
                  <th className="px-5 py-3 font-medium">Reference</th>
                  {!eventId && <th className="px-5 py-3 font-medium">Event</th>}
                  <th className="px-5 py-3 font-medium">Guest</th>
                  <th className="px-5 py-3 font-medium">Tier</th>
                  <th className="px-5 py-3 font-medium">Qty</th>
                  <th className="px-5 py-3 font-medium">Payment</th>
                  {canCancel && <th className="px-5 py-3"></th>}
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.id} className="border-b border-stone-50 last:border-0 hover:bg-stone-50/60">
                    <td className="px-5 py-3 font-mono text-xs text-stone-500">{b.bookingCode ?? b.id}</td>
                    {!eventId && (
                      <td className="px-5 py-3 text-stone-600">
                        {b.event?.title}
                        <div className="text-xs text-stone-400">{b.event?.eventDate.slice(0, 10)}</div>
                      </td>
                    )}
                    <td className="px-5 py-3 text-stone-900">
                      {b.guestName}
                      <div className="text-xs text-stone-400">{b.guestEmail}</div>
                    </td>
                    <td className="px-5 py-3 text-stone-600">{b.tier.name}</td>
                    <td className="px-5 py-3 text-stone-600">{b.quantity}</td>
                    <td className="px-5 py-3">
                      <Badge status={b.paymentStatus} />
                    </td>
                    {canCancel && (
                      <td className="px-5 py-3 text-right">
                        {b.paymentMethod === "offline" && b.paymentStatus !== "PAID" && (
                          <button
                            onClick={() => handleMarkPaid(b.id)}
                            className="mr-3 text-emerald-700 hover:text-emerald-900"
                          >
                            Mark as paid
                          </button>
                        )}
                        <button onClick={() => handleCancel(b.id)} className="text-rose-600 hover:text-rose-800">
                          Cancel
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
