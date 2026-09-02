"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { adminApi, AdminRentalItem, AdminRentalBooking, getStoredAdmin, canCancelBookings } from "@/lib/adminApi";
import { PageHeader, Badge, cardClass, primaryButtonClass, inputClass } from "@/components/admin/ui";
import { DateRangeFilter } from "@/components/admin/DateRangeFilter";

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
  const [from, setFrom] = useState(searchParams.get("date") || todayISO());
  const [to, setTo] = useState("");
  const [bookings, setBookings] = useState<AdminRentalBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const canCancel = canCancelBookings(getStoredAdmin()?.role);

  useEffect(() => {
    adminApi.listRentals().then(setItems);
  }, []);

  async function search() {
    setLoading(true);
    try {
      setBookings(await adminApi.listRentalBookings({ rentalItemId: itemId || undefined, from, to: to || undefined }));
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
    if (!confirm("Cancel this reservation and free the spot?")) return;
    await adminApi.cancelRentalBooking(bookingId);
    search();
  }

  async function handleMarkPaid(bookingId: string) {
    if (!confirm("Confirm this reservation as paid?")) return;
    await adminApi.markRentalBookingPaid(bookingId);
    search();
  }

  async function handleExport() {
    setExporting(true);
    setExportError(null);
    try {
      await adminApi.exportRentalBookings({ rentalItemId: itemId || undefined, from, to: to || undefined });
    } catch (err) {
      setExportError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setExporting(false);
    }
  }

  const selectedItem = items.find((i) => i.id === itemId);

  return (
    <div>
      <PageHeader title="Beach Chair Bookings" description="Reservations across all rental items, upcoming by default." />

      <div className={`${cardClass} flex flex-wrap items-end gap-3 p-4`}>
        <div>
          <label className="mb-1 block text-xs font-medium text-stone-500">Rental item</label>
          <select value={itemId} onChange={(e) => setItemId(e.target.value)} className={inputClass}>
            <option value="">All items</option>
            {items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
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
          className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 transition hover:border-amber-600 hover:text-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {exporting ? "Exporting…" : "Export to Excel"}
        </button>
      </div>
      {exportError && <p className="mt-2 text-sm text-red-600">{exportError}</p>}

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
            <p className="p-6 text-sm text-stone-400">No reservations found for this range.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-stone-100 text-xs uppercase tracking-wide text-stone-400">
                <tr>
                  {!itemId && <th className="px-5 py-3 font-medium">Item</th>}
                  <th className="px-5 py-3 font-medium">Date</th>
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
                    {!itemId && <td className="px-5 py-3 text-stone-600">{b.rentalItem?.name}</td>}
                    <td className="px-5 py-3 text-stone-600">{b.date.slice(0, 10)}</td>
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
