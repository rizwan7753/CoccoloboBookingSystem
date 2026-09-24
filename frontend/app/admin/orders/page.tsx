"use client";

import { useEffect, useState } from "react";
import { adminApi, getStoredAdmin, canCancelBookings, AdminOrder } from "@/lib/adminApi";
import { PageHeader, Badge, cardClass, inputClass } from "@/components/admin/ui";
import { DateRangeFilter } from "@/components/admin/DateRangeFilter";

function itemSummary(order: AdminOrder): string {
  return [
    ...order.bookings.map((b) => b.excursion?.title ?? "Excursion"),
    ...order.rentalBookings.map((b) => b.rentalItem?.name ?? "Beach chair"),
    ...order.eventBookings.map((b) => b.event?.title ?? "Event"),
  ].join(", ");
}

function itemCount(order: AdminOrder): number {
  return order.bookings.length + order.rentalBookings.length + order.eventBookings.length;
}

export default function AdminOrdersPage() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  async function search() {
    setLoading(true);
    try {
      setOrders(await adminApi.listOrders({ ...(from ? { from } : {}), ...(to ? { to } : {}) }));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    search();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCancel(orderId: string) {
    if (!confirm("Cancel this order and release capacity for every item in it?")) return;
    await adminApi.cancelOrder(orderId);
    search();
  }

  async function handleMarkPaid(orderId: string) {
    if (!confirm("Confirm this order as paid?")) return;
    await adminApi.markOrderPaid(orderId);
    search();
  }

  async function handleExport() {
    setExporting(true);
    setExportError(null);
    try {
      await adminApi.exportOrders({ ...(from ? { from } : {}), ...(to ? { to } : {}) });
    } catch (err) {
      setExportError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setExporting(false);
    }
  }

  const canCancel = canCancelBookings(getStoredAdmin()?.permissions);

  return (
    <div>
      <PageHeader title="Orders" description="Multi-item cart checkouts — a guest combining an excursion, beach chair, and/or event ticket into one payment." />

      <div className={`${cardClass} flex flex-wrap items-end gap-3 p-4`}>
        <DateRangeFilter from={from} to={to} onFromChange={setFrom} onToChange={setTo} />
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
          {orders.length === 0 ? (
            <p className="p-6 text-sm text-stone-400">No orders found for this range.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] table-fixed text-left text-sm">
                <colgroup>
                  <col className="w-[13%]" />
                  <col className="w-[27%]" />
                  <col className="w-[15%]" />
                  <col className="w-[17%]" />
                  <col className="w-[8%]" />
                  <col className="w-[8%]" />
                  {canCancel && <col className="w-[12%]" />}
                </colgroup>
                <thead className="border-b border-stone-100 text-xs uppercase tracking-wide text-stone-400">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">Reference</th>
                    <th className="px-4 py-2.5 font-medium">Items</th>
                    <th className="px-4 py-2.5 font-medium">Guest</th>
                    <th className="px-4 py-2.5 font-medium">Contact</th>
                    <th className="px-4 py-2.5 font-medium">Amount</th>
                    <th className="px-4 py-2.5 font-medium">Payment</th>
                    {canCancel && <th className="px-4 py-2.5"></th>}
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id} className="border-b border-stone-50 align-top last:border-0 hover:bg-stone-50/60">
                      <td className="truncate px-4 py-2 font-mono text-xs text-stone-500" title={o.bookingCode ?? o.id}>
                        {o.bookingCode ?? o.id}
                      </td>
                      <td className="truncate px-4 py-2 text-stone-700" title={itemSummary(o)}>
                        {itemSummary(o)}
                        <div className="text-xs text-stone-400">{itemCount(o)} item{itemCount(o) === 1 ? "" : "s"}</div>
                      </td>
                      <td className="truncate px-4 py-2 font-medium text-stone-900" title={o.guestName}>
                        {o.guestName}
                      </td>
                      <td className="truncate px-4 py-2 text-stone-600" title={`${o.guestEmail}${o.guestPhone ? ` · ${o.guestPhone}` : ""}`}>
                        {o.guestEmail}
                        {o.guestPhone ? <div className="text-xs text-stone-400">{o.guestPhone}</div> : null}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2 text-stone-600">${o.amountTotal}</td>
                      <td className="px-4 py-2">
                        <Badge status={o.status === "CANCELLED" ? "CANCELLED" : o.paymentStatus} />
                      </td>
                      {canCancel && (
                        <td className="px-4 py-2 text-right">
                          {o.status !== "CANCELLED" && (
                            <>
                              {o.paymentMethod === "offline" && o.paymentStatus !== "PAID" && (
                                <button onClick={() => handleMarkPaid(o.id)} className="mr-3 text-emerald-700 hover:text-emerald-900">
                                  Mark as paid
                                </button>
                              )}
                              <button onClick={() => handleCancel(o.id)} className="text-rose-600 hover:text-rose-800">
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
