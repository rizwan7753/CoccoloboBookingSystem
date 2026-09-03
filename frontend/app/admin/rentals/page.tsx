"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { adminApi, getStoredAdmin, canEditExcursions, AdminRentalItem } from "@/lib/adminApi";
import { PageHeader, Badge, cardClass, primaryButtonClass } from "@/components/admin/ui";

export default function AdminRentalsPage() {
  const [items, setItems] = useState<AdminRentalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const canEdit = canEditExcursions(getStoredAdmin()?.role);

  useEffect(() => {
    adminApi
      .listRentals()
      .then(setItems)
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("Delete this rental item? This cannot be undone.")) return;
    await adminApi.deleteRental(id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  return (
    <div>
      <PageHeader
        title="Beach Chairs & Rentals"
        description="Same-day bookable equipment rentals, assigned to a specific numbered spot."
        actions={
          canEdit && (
            <Link href="/admin/rentals/new" className={primaryButtonClass}>
              + New rental item
            </Link>
          )
        }
      />

      <div className={`${cardClass} overflow-hidden`}>
        {loading ? (
          <p className="p-6 text-sm text-stone-400">Loading…</p>
        ) : items.length === 0 ? (
          <p className="p-6 text-sm text-stone-400">No rental items yet.</p>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="border-b border-stone-100 text-xs uppercase tracking-wide text-stone-400">
              <tr>
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Price (adult)</th>
                <th className="px-5 py-3 font-medium">Spots</th>
                <th className="px-5 py-3 font-medium">Total chairs</th>
                {canEdit && <th className="px-5 py-3"></th>}
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-stone-50 last:border-0 hover:bg-stone-50/60">
                  <td className="px-5 py-3 font-medium text-stone-900">{item.name}</td>
                  <td className="px-5 py-3">
                    <Badge status={item.status} />
                  </td>
                  <td className="px-5 py-3 text-stone-600">${item.priceAdult}</td>
                  <td className="px-5 py-3 text-stone-600">{item.spots?.length ?? 0}</td>
                  <td className="px-5 py-3 text-stone-600">
                    {item.spots?.reduce((sum, s) => sum + s.quantity, 0) ?? 0}
                  </td>
                  {canEdit && (
                    <td className="px-5 py-3 text-right">
                      <Link href={`/admin/rentals/${item.id}`} className="text-teal-700 hover:text-teal-900">
                        Manage
                      </Link>{" "}
                      <span className="text-stone-300">·</span>{" "}
                      <button onClick={() => handleDelete(item.id)} className="text-rose-600 hover:text-rose-800">
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
    </div>
  );
}
