"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { adminApi, AdminEvent, AdminEventBooking, getStoredAdmin, canCancelBookings } from "@/lib/adminApi";
import { PageHeader, Badge, cardClass, inputClass } from "@/components/admin/ui";

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
  const [bookings, setBookings] = useState<AdminEventBooking[]>([]);
  const [loading, setLoading] = useState(true);

  const canCancel = canCancelBookings(getStoredAdmin()?.role);

  useEffect(() => {
    adminApi.listEvents().then((list) => {
      setEvents(list);
      if (!eventId && list[0]) setEventId(list[0].id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function search() {
    if (!eventId) return;
    try {
      setBookings(await adminApi.listEventBookings(eventId));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (eventId) search();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  async function handleCancel(bookingId: string) {
    if (!confirm("Cancel this booking and release the tickets?")) return;
    await adminApi.cancelEventBooking(bookingId);
    search();
  }

  const totalTickets = bookings.reduce((sum, b) => sum + b.quantity, 0);

  return (
    <div>
      <PageHeader title="Event Bookings" description="The attendee list for a specific event." />

      <div className={`${cardClass} flex flex-wrap items-end gap-3 p-4`}>
        <div>
          <label className="mb-1 block text-xs font-medium text-stone-500">Event</label>
          <select value={eventId} onChange={(e) => setEventId(e.target.value)} className={inputClass}>
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.title} — {event.eventDate.slice(0, 10)}
              </option>
            ))}
          </select>
        </div>
      </div>

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
            <p className="p-6 text-sm text-stone-400">No bookings yet.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-stone-100 text-xs uppercase tracking-wide text-stone-400">
                <tr>
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
