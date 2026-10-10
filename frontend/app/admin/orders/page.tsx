"use client";

import { useEffect, useState } from "react";
import { adminApi, getStoredAdmin, canCancelBookings, AdminOrder } from "@/lib/adminApi";
import { PageHeader, Badge, cardClass, inputClass, primaryButtonClass, secondaryButtonClass } from "@/components/admin/ui";
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
          {orders.length === 0 ? (
            <p className="p-6 text-sm text-admin-faint">No orders found for this range.</p>
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
                <thead className="border-b border-admin-line-soft text-xs uppercase tracking-wide text-admin-faint">
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
                    <tr key={o.id} className="border-b border-admin-line-soft align-top last:border-0 hover:bg-admin-surface-soft">
                      <td className="truncate px-4 py-2 font-mono text-xs text-admin-muted" title={o.bookingCode ?? o.id}>
                        {o.bookingCode ?? o.id}
                      </td>
                      <td className="truncate px-4 py-2 text-admin-ink-soft" title={itemSummary(o)}>
                        {itemSummary(o)}
                        <div className="text-xs text-admin-faint">{itemCount(o)} item{itemCount(o) === 1 ? "" : "s"}</div>
                      </td>
                      <td className="truncate px-4 py-2 font-medium text-admin-ink" title={o.guestName}>
                        {o.guestName}
                      </td>
                      <td className="truncate px-4 py-2 text-admin-muted" title={`${o.guestEmail}${o.guestPhone ? ` · ${o.guestPhone}` : ""}`}>
                        {o.guestEmail}
                        {o.guestPhone ? <div className="text-xs text-admin-faint">{o.guestPhone}</div> : null}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2 text-admin-muted">${o.amountTotal}</td>
                      <td className="px-4 py-2">
                        <Badge status={o.status === "CANCELLED" ? "CANCELLED" : o.paymentStatus} />
                      </td>
                      {canCancel && (
                        <td className="px-4 py-2 text-right">
                          {o.status !== "CANCELLED" && (
                            <>
                              {o.paymentMethod === "offline" && o.paymentStatus !== "PAID" && (
                                <button onClick={() => handleMarkPaid(o.id)} className="mr-3 text-admin-success-ink hover:text-admin-success-ink">
                                  Mark as paid
                                </button>
                              )}
                              <button onClick={() => handleCancel(o.id)} className="text-admin-danger-ink hover:text-admin-danger-ink">
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
