"use client";

import { useEffect, useState } from "react";
import {
  adminApi,
  AdminRestaurantReservation,
  RestaurantReservationStatus,
  getStoredAdmin,
  canManageRestaurantReservations,
} from "@/lib/adminApi";
import { PageHeader, Badge, cardClass, inputClass, primaryButtonClass, secondaryButtonClass } from "@/components/admin/ui";
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

  const canManage = canManageRestaurantReservations(getStoredAdmin()?.permissions);

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
          <label className="mb-1 block text-xs font-medium text-admin-muted">Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputClass}>
            <option value="">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
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
          {reservations.length === 0 ? (
            <p className="p-6 text-sm text-admin-faint">No reservation requests found for this range.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left text-sm">
                <thead className="border-b border-admin-line-soft text-xs uppercase tracking-wide text-admin-faint">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">Reference</th>
                    <th className="px-4 py-2.5 font-medium">Date/Time</th>
                    <th className="px-4 py-2.5 font-medium">Guest</th>
                    <th className="px-4 py-2.5 font-medium">Contact</th>
                    <th className="px-4 py-2.5 font-medium">No of People</th>
                    <th className="max-w-[200px] px-4 py-2.5 font-medium">Notes</th>
                    <th className="px-4 py-2.5 font-medium">Status</th>
                    {canManage && <th className="px-4 py-2.5"></th>}
                  </tr>
                </thead>
                <tbody>
                  {reservations.map((r) => (
                    <tr key={r.id} className="border-b border-admin-line-soft align-top last:border-0 hover:bg-admin-surface-soft">
                      <td className="max-w-[130px] truncate px-4 py-2 font-mono text-xs text-admin-muted" title={r.bookingCode ?? r.id}>
                        {r.bookingCode ?? r.id}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2 text-admin-muted">
                        {r.date.slice(0, 10)}
                        <div className="text-xs text-admin-faint">{r.time}</div>
                      </td>
                      <td className="px-4 py-2 font-medium text-admin-ink">{r.guestName}</td>
                      <td className="px-4 py-2 text-admin-muted">
                        {r.guestEmail}
                        {r.guestPhone ? <div className="text-xs text-admin-faint">{r.guestPhone}</div> : null}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2 text-admin-muted">{r.partySize}</td>
                      <td className="max-w-[200px] truncate px-4 py-2 text-admin-muted" title={r.specialRequests ?? undefined}>
                        {r.specialRequests || "—"}
                      </td>
                      <td className="px-4 py-2">
                        {canManage ? (
                          <select
                            value={r.status}
                            onChange={(e) => handleStatusChange(r.id, e.target.value as RestaurantReservationStatus)}
                            className="rounded-md border border-admin-line px-2 py-1 text-sm"
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
                          <button onClick={() => handleDelete(r.id)} className="text-admin-danger-ink hover:text-admin-danger-ink">
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
