"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { adminApi, getStoredAdmin, canEditExcursions } from "@/lib/adminApi";
import { Excursion } from "@/lib/api";
import { PageHeader, Badge, cardClass, primaryButtonClass } from "@/components/admin/ui";

export default function AdminExcursionsPage() {
  const [excursions, setExcursions] = useState<Excursion[]>([]);
  const [loading, setLoading] = useState(true);
  const canEdit = canEditExcursions(getStoredAdmin()?.role);

  useEffect(() => {
    adminApi
      .listExcursions()
      .then(setExcursions)
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("Delete this excursion? This cannot be undone.")) return;
    await adminApi.deleteExcursion(id);
    setExcursions((prev) => prev.filter((e) => e.id !== id));
  }

  return (
    <div>
      <PageHeader
        title="Excursions"
        description={!canEdit ? "View-only access — contact a Location Manager or Super Admin for changes." : undefined}
        actions={
          canEdit && (
            <Link href="/admin/excursions/new" className={primaryButtonClass}>
              + New excursion
            </Link>
          )
        }
      />

      <div className={`${cardClass} overflow-hidden`}>
        {loading ? (
          <p className="p-6 text-sm text-stone-400">Loading…</p>
        ) : excursions.length === 0 ? (
          <p className="p-6 text-sm text-stone-400">No excursions yet.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-stone-100 text-xs uppercase tracking-wide text-stone-400">
              <tr>
                <th className="px-5 py-3 font-medium">Title</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Price</th>
                <th className="px-5 py-3 font-medium">Capacity</th>
                {canEdit && <th className="px-5 py-3"></th>}
              </tr>
            </thead>
            <tbody>
              {excursions.map((ex) => (
                <tr key={ex.id} className="border-b border-stone-50 last:border-0 hover:bg-stone-50/60">
                  <td className="px-5 py-3 font-medium text-stone-900">{ex.title}</td>
                  <td className="px-5 py-3">
                    <Badge status={ex.status} />
                  </td>
                  <td className="px-5 py-3 text-stone-600">
                    ${ex.priceAdult}
                    <span className="ml-1 text-xs text-stone-400">
                      {ex.pricingType === "FLAT_RATE" ? "flat" : "/ adult"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-stone-600">{ex.capacityDefault}</td>
                  {canEdit && (
                    <td className="px-5 py-3 text-right">
                      <Link href={`/admin/excursions/${ex.id}`} className="text-teal-700 hover:text-teal-900">
                        Edit
                      </Link>{" "}
                      <span className="text-stone-300">·</span>{" "}
                      <button onClick={() => handleDelete(ex.id)} className="text-rose-600 hover:text-rose-800">
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
