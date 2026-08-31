"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { adminApi, getStoredAdmin, canCancelBookings } from "@/lib/adminApi";
import { Excursion } from "@/lib/api";
import { formatTimeRange } from "@/lib/time";
import { PageHeader, Badge, cardClass, primaryButtonClass, inputClass } from "@/components/admin/ui";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function ManifestPage() {
  return (
    <Suspense fallback={null}>
      <ManifestPageInner />
    </Suspense>
  );
}

function ManifestPageInner() {
  const searchParams = useSearchParams();
  const [excursions, setExcursions] = useState<Excursion[]>([]);
  const [excursionId, setExcursionId] = useState("");
  const [date, setDate] = useState(searchParams.get("date") || todayISO());
  const [time, setTime] = useState("");
  const [manifest, setManifest] = useState<Awaited<ReturnType<typeof adminApi.getManifest>> | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    adminApi.listExcursions().then((list) => {
      setExcursions(list);
      if (list[0]) {
        setExcursionId(list[0].id);
        setTime(list[0].departureTimes?.[0]?.time || "");
      }
    });
  }, []);

  async function search() {
    if (!excursionId || !date || !time) return;
    try {
      setManifest(await adminApi.getManifest(excursionId, date, time));
    } finally {
      setLoading(false);
    }
  }

  // Wraps search() with the loading flag for the manual "Search" button —
  // kept separate from search() itself so the effect below (which also
  // calls search()) doesn't trip the synchronous-setState-in-effect rule.
  function handleSearchClick() {
    setLoading(true);
    search();
  }

  // Auto-run the search once we have an excursion selected (covers the
  // ?date= deep link from the dashboard calendar).
  useEffect(() => {
    if (excursionId && time) search();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [excursionId, time]);

  async function handleCancel(bookingId: string) {
    if (!confirm("Cancel this booking and release its capacity?")) return;
    await adminApi.cancelBooking(bookingId);
    search();
  }

  const selected = excursions.find((e) => e.id === excursionId);
  const canCancel = canCancelBookings(getStoredAdmin()?.role);

  return (
    <div>
      <PageHeader title="Daily manifest" description="Passenger list for a specific excursion departure." />

      <div className={`${cardClass} flex flex-wrap items-end gap-3 p-4`}>
        <div>
          <label className="mb-1 block text-xs font-medium text-stone-500">Excursion</label>
          <select
            value={excursionId}
            onChange={(e) => {
              setExcursionId(e.target.value);
              const ex = excursions.find((x) => x.id === e.target.value);
              setTime(ex?.departureTimes?.[0]?.time || "");
            }}
            className={inputClass}
          >
            {excursions.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.title}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-stone-500">Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-stone-500">Departure time</label>
          <select value={time} onChange={(e) => setTime(e.target.value)} className={inputClass}>
            {selected?.departureTimes?.map((dt) => (
              <option key={dt.id} value={dt.time}>
                {selected ? formatTimeRange(dt.time, selected.durationMinutes) : dt.time}
              </option>
            ))}
          </select>
        </div>
        <button onClick={handleSearchClick} className={primaryButtonClass}>
          Search
        </button>
      </div>

      {loading && <p className="mt-6 text-sm text-stone-400">Loading…</p>}

      {manifest && !loading && (
        <div className={`${cardClass} mt-6 overflow-hidden`}>
          {!manifest.slot ? (
            <p className="p-6 text-sm text-stone-400">No bookings for this departure yet.</p>
          ) : (
            <>
              <div className="flex items-center justify-between border-b border-stone-100 px-5 py-3">
                <p className="text-sm text-stone-600">
                  <span className="font-semibold text-stone-900">{manifest.bookings.length}</span> booking(s) ·{" "}
                  <span className="font-semibold text-stone-900">
                    {manifest.slot.bookedCount}/{manifest.slot.capacity}
                  </span>{" "}
                  guests
                </p>
              </div>
              <table className="w-full text-left text-sm">
                <thead className="border-b border-stone-100 text-xs uppercase tracking-wide text-stone-400">
                  <tr>
                    <th className="px-5 py-3 font-medium">Guest</th>
                    <th className="px-5 py-3 font-medium">Contact</th>
                    <th className="px-5 py-3 font-medium">Guests</th>
                    <th className="px-5 py-3 font-medium">Room</th>
                    <th className="px-5 py-3 font-medium">Notes</th>
                    <th className="px-5 py-3 font-medium">Payment</th>
                    {canCancel && <th className="px-5 py-3"></th>}
                  </tr>
                </thead>
                <tbody>
                  {manifest.bookings.map((b) => (
                    <tr key={b.id} className="border-b border-stone-50 align-top last:border-0 hover:bg-stone-50/60">
                      <td className="px-5 py-3 font-medium text-stone-900">{b.guestName}</td>
                      <td className="px-5 py-3 text-stone-600">
                        {b.guestEmail}
                        {b.guestPhone ? <div className="text-stone-400">{b.guestPhone}</div> : null}
                      </td>
                      <td className="px-5 py-3 text-stone-600">
                        {b.adultCount}A / {b.childCount}C
                      </td>
                      <td className="px-5 py-3 text-stone-600">{b.roomNumber || "—"}</td>
                      <td className="max-w-xs px-5 py-3 text-stone-600">{b.specialRequests || "—"}</td>
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
            </>
          )}
        </div>
      )}
    </div>
  );
}
