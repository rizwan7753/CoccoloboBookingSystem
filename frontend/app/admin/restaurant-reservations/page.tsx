"use client";

import { useEffect, useState } from "react";
import {
  adminApi,
  AdminRestaurantReservation,
  RestaurantReservationStatus,
  getStoredAdmin,
  canCancelBookings,
} from "@/lib/adminApi";
import { PageHeader, Badge, cardClass, inputClass } from "@/components/admin/ui";
import { DateRangeFilter } from "@/components/admin/DateRangeFilter";

const STATUSES: RestaurantReservationStatus[] = ["NEW", "CONTACTED", "CONFIRMED", "DECLINED"];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function AdminRestaurantReservationsPage() {
  const [from, setFrom] = useState(todayISO());
  const [to, setTo] = useState("");
  const [status, setStatus] = useState("");
  const [reservations, setReservations] = useState<AdminRestaurantReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const canManage = canCancelBookings(getStoredAdmin()?.role);

  async function search() {
    setLoading(true);
    try {
      setReservations(await adminApi.listRestaurantReservations({ from, to: to || undefined, status: status || undefined }));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    search();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleStatusChange(id: string, newStatus: RestaurantReservationStatus) {
    await adminApi.updateRestaurantReservationStatus(id, newStatus);
    search();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this reservation request?")) return;
    await adminApi.deleteRestaurantReservation(id);
    search();
  }

  async function handleExport() {
    setExporting(true);
    setExportError(null);
    try {
      await adminApi.exportRestaurantReservations({ from, to: to || undefined, status: status || undefined });
    } catch (err) {
      setExportError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div>
      <PageHeader title="Restaurant reservations" description="Table reservation requests — no payment, follow up by phone or email to confirm." />

      <div className={`${cardClass} flex flex-wrap items-end gap-3 p-4`}>
        <DateRangeFilter from={from} to={to} onFromChange={setFrom} onToChange={setTo} />
        <div>
          <label className="mb-1 block text-xs font-medium text-stone-500">Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputClass}>
            <option value="">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <button onClick={search} className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-800">
          Search
        </button>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 transition hover:border-teal-600 hover:text-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {exporting ? "Exporting…" : "Export to Excel"}
        </button>
      </div>
      {exportError && <p className="mt-2 text-sm text-red-600">{exportError}</p>}

      {loading ? (
        <p className="mt-6 text-sm text-stone-400">Loading…</p>
      ) : (
        <div className={`${cardClass} mt-6 overflow-hidden`}>
          {reservations.length === 0 ? (
            <p className="p-6 text-sm text-stone-400">No reservation requests found for this range.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[750px] text-left text-sm">
                <thead className="border-b border-stone-100 text-xs uppercase tracking-wide text-stone-400">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">Date/Time</th>
                    <th className="px-4 py-2.5 font-medium">Guest</th>
                    <th className="px-4 py-2.5 font-medium">Contact</th>
                    <th className="px-4 py-2.5 font-medium">Party</th>
                    <th className="max-w-[200px] px-4 py-2.5 font-medium">Notes</th>
                    <th className="px-4 py-2.5 font-medium">Status</th>
                    {canManage && <th className="px-4 py-2.5"></th>}
                  </tr>
                </thead>
                <tbody>
                  {reservations.map((r) => (
                    <tr key={r.id} className="border-b border-stone-50 align-top last:border-0 hover:bg-stone-50/60">
                      <td className="whitespace-nowrap px-4 py-2 text-stone-600">
                        {r.date.slice(0, 10)}
                        <div className="text-xs text-stone-400">{r.time}</div>
                      </td>
                      <td className="px-4 py-2 font-medium text-stone-900">{r.guestName}</td>
                      <td className="px-4 py-2 text-stone-600">
                        {r.guestEmail}
                        {r.guestPhone ? <div className="text-xs text-stone-400">{r.guestPhone}</div> : null}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2 text-stone-600">{r.partySize}</td>
                      <td className="max-w-[200px] truncate px-4 py-2 text-stone-600" title={r.specialRequests ?? undefined}>
                        {r.specialRequests || "—"}
                      </td>
                      <td className="px-4 py-2">
                        {canManage ? (
                          <select
                            value={r.status}
                            onChange={(e) => handleStatusChange(r.id, e.target.value as RestaurantReservationStatus)}
                            className="rounded-md border border-stone-300 px-2 py-1 text-sm"
                          >
                            {STATUSES.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <Badge status={r.status} />
                        )}
                      </td>
                      {canManage && (
                        <td className="whitespace-nowrap px-4 py-2 text-right">
                          <button onClick={() => handleDelete(r.id)} className="text-rose-600 hover:text-rose-800">
                            Delete
                          </button>
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
