"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { adminApi, AdminEvent, AdminEventBooking, getStoredAdmin, canCancelBookings } from "@/lib/adminApi";
import { PageHeader, Badge, cardClass, primaryButtonClass, inputClass } from "@/components/admin/ui";
import { DateRangeFilter } from "@/components/admin/DateRangeFilter";

// toISOString() gives UTC's calendar date, which can be a day off from the
// browser's actual local "today" — read the local getters instead.
function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
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
  const dateParam = searchParams.get("date");
  const [from, setFrom] = useState(dateParam || todayISO());
  const [to, setTo] = useState(dateParam || "");
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
            <div className="overflow-x-auto">
            <table className="w-full min-w-[750px] text-left text-sm">
              <thead className="border-b border-stone-100 text-xs uppercase tracking-wide text-stone-400">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Reference</th>
                  {!eventId && <th className="max-w-[180px] px-4 py-2.5 font-medium">Event</th>}
                  <th className="max-w-[180px] px-4 py-2.5 font-medium">Guest</th>
                  <th className="px-4 py-2.5 font-medium">Tier</th>
                  <th className="px-4 py-2.5 font-medium">Qty</th>
                  <th className="px-4 py-2.5 font-medium">Payment</th>
                  {canCancel && <th className="px-4 py-2.5"></th>}
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.id} className="border-b border-stone-50 align-top last:border-0 hover:bg-stone-50/60">
                    <td className="max-w-[130px] truncate px-4 py-2 font-mono text-xs text-stone-500" title={b.bookingCode ?? b.id}>
                      {b.bookingCode ?? b.id}
                    </td>
                    {!eventId && (
                      <td className="max-w-[180px] truncate px-4 py-2 text-stone-600" title={b.event?.title}>
                        {b.event?.title}
                        <div className="text-xs text-stone-400">{b.event?.eventDate.slice(0, 10)}</div>
                      </td>
                    )}
                    <td className="max-w-[180px] truncate px-4 py-2 text-stone-900" title={`${b.guestName} · ${b.guestEmail}`}>
                      {b.guestName}
                      <div className="truncate text-xs text-stone-400">{b.guestEmail}</div>
                    </td>
                    <td className="max-w-[140px] truncate px-4 py-2 text-stone-600">{b.tier.name}</td>
                    <td className="whitespace-nowrap px-4 py-2 text-stone-600">{b.quantity}</td>
                    <td className="px-4 py-2">
                      <Badge status={b.status === "CANCELLED" ? "CANCELLED" : b.paymentStatus} />
                    </td>
                    {canCancel && (
                      <td className="whitespace-nowrap px-4 py-2 text-right">
                        {b.status !== "CANCELLED" && (
                          <>
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
                          </>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
