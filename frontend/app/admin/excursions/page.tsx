"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { adminApi, getStoredAdmin, canEditExcursions } from "@/lib/adminApi";
import { Excursion } from "@/lib/api";
import { PageHeader, Badge, cardClass, primaryButtonClass } from "@/components/admin/ui";

export default function AdminExcursionsPage() {
  const [excursions, setExcursions] = useState<Excursion[]>([]);
  const [loading, setLoading] = useState(true);
  const canEdit = canEditExcursions(getStoredAdmin()?.permissions);

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
          <p className="p-6 text-sm text-admin-faint">Loading…</p>
        ) : excursions.length === 0 ? (
          <p className="p-6 text-sm text-admin-faint">No excursions yet.</p>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full min-w-[650px] text-left text-sm">
            <thead className="border-b border-admin-line-soft text-xs uppercase tracking-wide text-admin-faint">
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
                <tr key={ex.id} className="border-b border-admin-line-soft last:border-0 hover:bg-admin-surface-soft">
                  <td className="px-5 py-3 font-medium text-admin-ink">{ex.title}</td>
                  <td className="px-5 py-3">
                    <Badge status={ex.status} />
                  </td>
                  <td className="px-5 py-3 text-admin-muted">
                    ${ex.priceAdult}
                    <span className="ml-1 text-xs text-admin-faint">
                      {ex.pricingType === "FLAT_RATE" ? "flat" : "/ adult"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-admin-muted">{ex.capacityDefault}</td>
                  {canEdit && (
                    <td className="px-5 py-3 text-right">
                      <Link href={`/admin/excursions/${ex.id}`} className="text-admin-primary-ink hover:text-admin-primary-ink">
                        Edit
                      </Link>{" "}
                      <span className="text-admin-faint">·</span>{" "}
                      <button onClick={() => handleDelete(ex.id)} className="text-admin-danger-ink hover:text-admin-danger-ink">
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
