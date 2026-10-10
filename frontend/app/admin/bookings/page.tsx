"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { adminApi, getStoredAdmin, canCancelBookings } from "@/lib/adminApi";
import { Booking, Excursion } from "@/lib/api";
import { formatTimeRange } from "@/lib/time";
import { PageHeader, Badge, cardClass, inputClass, primaryButtonClass, secondaryButtonClass } from "@/components/admin/ui";
import { DateRangeFilter } from "@/components/admin/DateRangeFilter";

// toISOString() gives UTC's calendar date, which can be a day off from the
// browser's actual local "today" — read the local getters instead.
function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function BookingsPage() {
  return (
    <Suspense fallback={null}>
      <BookingsPageInner />
    </Suspense>
  );
}

function BookingsPageInner() {
  const searchParams = useSearchParams();
  const [excursions, setExcursions] = useState<Excursion[]>([]);
  const [excursionId, setExcursionId] = useState(searchParams.get("excursionId") || "");
  const dateParam = searchParams.get("date");
  const [from, setFrom] = useState(dateParam || todayISO());
  const [to, setTo] = useState(dateParam || "");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  useEffect(() => {
    adminApi.listExcursions().then(setExcursions);
  }, []);

  async function search() {
    setLoading(true);
    try {
      setBookings(
        await adminApi.listBookings({
          ...(excursionId ? { excursionId } : {}),
          from,
          ...(to ? { to } : {}),
        })
      );
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
    if (!confirm("Cancel this booking and release its capacity?")) return;
    await adminApi.cancelBooking(bookingId);
    search();
  }

  async function handleMarkPaid(bookingId: string) {
    if (!confirm("Confirm this booking as paid?")) return;
    await adminApi.markBookingPaid(bookingId);
    search();
  }

  async function handleExport() {
    setExporting(true);
    setExportError(null);
    try {
      await adminApi.exportBookings({ ...(excursionId ? { excursionId } : {}), from, ...(to ? { to } : {}) });
    } catch (err) {
      setExportError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setExporting(false);
    }
  }

  const canCancel = canCancelBookings(getStoredAdmin()?.permissions);

  return (
    <div>
      <PageHeader title="Bookings" description="All excursion bookings, upcoming by default." />

      <div className={`${cardClass} flex flex-wrap items-end gap-3 p-4`}>
        <div>
          <label className="mb-1 block text-xs font-medium text-admin-muted">Excursion</label>
          <select value={excursionId} onChange={(e) => setExcursionId(e.target.value)} className={inputClass}>
            <option value="">All excursions</option>
            {excursions.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.title}
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
          className={secondaryButtonClass}
        >
          {exporting ? "Exporting…" : "Export to Excel"}
        </button>
      </div>
      {exportError && <p className="mt-2 text-sm text-admin-danger-ink">{exportError}</p>}

      {loading ? (
        <p className="mt-6 text-sm text-admin-faint">Loading…</p>
      ) : (
        <div className={`${cardClass} mt-6 overflow-hidden`}>
          {bookings.length === 0 ? (
            <p className="p-6 text-sm text-admin-faint">No bookings found for this range.</p>
          ) : (
            <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] table-fixed text-left text-sm">
              <colgroup>
                <col className="w-[12%]" />
                <col className="w-[13%]" />
                <col className="w-[13%]" />
                <col className="w-[11%]" />
                <col className="w-[15%]" />
                <col className="w-[7%]" />
                <col className="w-[7%]" />
                <col className="w-[8%]" />
                {canCancel && <col className="w-[14%]" />}
              </colgroup>
              <thead className="border-b border-admin-line-soft text-xs uppercase tracking-wide text-admin-faint">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Reference</th>
                  <th className="px-4 py-2.5 font-medium">Excursion</th>
                  <th className="px-4 py-2.5 font-medium">Date/Time</th>
                  <th className="px-4 py-2.5 font-medium">Guest</th>
                  <th className="px-4 py-2.5 font-medium">Contact</th>
                  <th className="px-4 py-2.5 font-medium">Guests</th>
                  <th className="px-4 py-2.5 font-medium">Room</th>
                  <th className="px-4 py-2.5 font-medium">Payment</th>
                  {canCancel && <th className="px-4 py-2.5"></th>}
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.id} className="border-b border-admin-line-soft align-top last:border-0 hover:bg-admin-surface-soft">
                    <td className="truncate px-4 py-2 font-mono text-xs text-admin-muted" title={b.bookingCode ?? b.id}>
                      {b.bookingCode ?? b.id}
                    </td>
                    <td className="truncate px-4 py-2 font-medium text-admin-ink" title={b.excursion?.title}>
                      {b.excursion?.title}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-admin-muted">
                      {b.slot?.date.slice(0, 10)}
                      {b.slot?.time && b.excursion ? (
                        <div className="whitespace-nowrap text-xs text-admin-faint">{formatTimeRange(b.slot.time, b.excursion.durationMinutes)}</div>
                      ) : null}
                    </td>
                    <td className="truncate px-4 py-2 font-medium text-admin-ink" title={b.guestName}>
                      {b.guestName}
                    </td>
                    <td className="truncate px-4 py-2 text-admin-muted" title={`${b.guestEmail}${b.guestPhone ? ` · ${b.guestPhone}` : ""}`}>
                      {b.guestEmail}
                      {b.guestPhone ? <div className="text-xs text-admin-faint">{b.guestPhone}</div> : null}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-admin-muted">
                      {b.adultCount}A / {b.childCount}C
                    </td>
                    <td className="truncate px-4 py-2 text-admin-muted">{b.roomNumber || "—"}</td>
                    <td className="px-4 py-2">
                      <Badge status={b.status === "CANCELLED" ? "CANCELLED" : b.paymentStatus} />
                    </td>
                    {canCancel && (
                      <td className="px-4 py-2 text-right">
                        {b.status !== "CANCELLED" && (
                          <>
                            {b.paymentMethod === "offline" && b.paymentStatus !== "PAID" && (
                              <button
                                onClick={() => handleMarkPaid(b.id)}
                                className="mr-3 text-admin-success-ink hover:text-admin-success-ink"
                              >
                                Mark as paid
                              </button>
                            )}
                            <button onClick={() => handleCancel(b.id)} className="text-admin-danger-ink hover:text-admin-danger-ink">
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
