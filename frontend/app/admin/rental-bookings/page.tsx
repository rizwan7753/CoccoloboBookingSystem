"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { adminApi, AdminRentalItem, AdminRentalBooking, getStoredAdmin, canCancelBookings } from "@/lib/adminApi";
import { PageHeader, Badge, cardClass, primaryButtonClass, inputClass } from "@/components/admin/ui";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function RentalBookingsPage() {
  return (
    <Suspense fallback={null}>
      <RentalBookingsPageInner />
    </Suspense>
  );
}

function RentalBookingsPageInner() {
  const searchParams = useSearchParams();
  const [items, setItems] = useState<AdminRentalItem[]>([]);
  const [itemId, setItemId] = useState(searchParams.get("rentalItemId") || "");
  const [date, setDate] = useState(searchParams.get("date") || todayISO());
  const [bookings, setBookings] = useState<AdminRentalBooking[]>([]);
  const [loading, setLoading] = useState(true);

  const canCancel = canCancelBookings(getStoredAdmin()?.role);

  useEffect(() => {
    adminApi.listRentals().then((list) => {
      setItems(list);
      if (!itemId && list[0]) setItemId(list[0].id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function search() {
    if (!itemId || !date) return;
    try {
      setBookings(await adminApi.listRentalBookings(itemId, date));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (itemId && date) search();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemId]);

  function handleSearchClick() {
    setLoading(true);
    search();
  }

  async function handleCancel(bookingId: string) {
    if (!confirm("Cancel this reservation and free the spot?")) return;
    await adminApi.cancelRentalBooking(bookingId);
    search();
  }

  const selectedItem = items.find((i) => i.id === itemId);

  return (
    <div>
      <PageHeader title="Beach Chair Bookings" description="Reservations for a specific rental item and date." />

      <div className={`${cardClass} flex flex-wrap items-end gap-3 p-4`}>
        <div>
          <label className="mb-1 block text-xs font-medium text-stone-500">Rental item</label>
          <select value={itemId} onChange={(e) => setItemId(e.target.value)} className={inputClass}>
            {items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-stone-500">Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
        </div>
        <button onClick={handleSearchClick} className={primaryButtonClass}>
          Search
        </button>
      </div>

      {loading && <p className="mt-6 text-sm text-stone-400">Loading…</p>}

      {!loading && (
        <div className={`${cardClass} mt-6 overflow-hidden`}>
          {selectedItem?.spots && selectedItem.spots.length > 0 && (
            <div className="flex flex-wrap gap-2 border-b border-stone-100 p-4">
              {selectedItem.spots.map((spot) => {
                const booked = bookings.filter((b) => b.spotId === spot.id).reduce((sum, b) => sum + b.quantity, 0);
                const remaining = Math.max(spot.quantity - booked, 0);
                return (
                  <span
                    key={spot.id}
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      remaining === 0 ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-800"
                    }`}
                  >
                    {spot.code}: {remaining} of {spot.quantity} left
                  </span>
                );
              })}
            </div>
          )}

          {bookings.length === 0 ? (
            <p className="p-6 text-sm text-stone-400">No reservations for this date.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-stone-100 text-xs uppercase tracking-wide text-stone-400">
                <tr>
                  <th className="px-5 py-3 font-medium">Spot</th>
                  <th className="px-5 py-3 font-medium">Guest</th>
                  <th className="px-5 py-3 font-medium">Chairs</th>
                  <th className="px-5 py-3 font-medium">Payment</th>
                  {canCancel && <th className="px-5 py-3"></th>}
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.id} className="border-b border-stone-50 last:border-0 hover:bg-stone-50/60">
                    <td className="px-5 py-3 font-medium text-stone-900">{b.spot.code}</td>
                    <td className="px-5 py-3 text-stone-600">
                      {b.guestName}
                      <div className="text-xs text-stone-400">{b.guestEmail}</div>
                    </td>
                    <td className="px-5 py-3 text-stone-600">
                      {b.quantity} <span className="text-stone-400">({b.adultCount}A / {b.childCount}C)</span>
                    </td>
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
