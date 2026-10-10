"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { adminApi, getStoredAdmin, canManageEvents, AdminEvent } from "@/lib/adminApi";
import { PageHeader, Badge, cardClass, primaryButtonClass } from "@/components/admin/ui";

function formatEventDate(iso: string) {
  return new Date(`${iso.slice(0, 10)}T00:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function AdminEventsPage() {
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const canEdit = canManageEvents(getStoredAdmin()?.permissions);

  useEffect(() => {
    adminApi
      .listEvents()
      .then(setEvents)
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("Delete this event? This cannot be undone.")) return;
    await adminApi.deleteEvent(id);
    setEvents((prev) => prev.filter((e) => e.id !== id));
  }

  return (
    <div>
      <PageHeader
        title="Events"
        description="One-off ticketed happenings — parties, live music, workshops."
        actions={
          canEdit && (
            <Link href="/admin/events/new" className={primaryButtonClass}>
              + New event
            </Link>
          )
        }
      />

      <div className={`${cardClass} overflow-hidden`}>
        {loading ? (
          <p className="p-6 text-sm text-admin-faint">Loading…</p>
        ) : events.length === 0 ? (
          <p className="p-6 text-sm text-admin-faint">No events yet.</p>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full min-w-[750px] text-left text-sm">
            <thead className="border-b border-admin-line-soft text-xs uppercase tracking-wide text-admin-faint">
              <tr>
                <th className="px-5 py-3 font-medium">Title</th>
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Tiers</th>
                <th className="px-5 py-3 font-medium">Bookings</th>
                {canEdit && <th className="px-5 py-3"></th>}
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id} className="border-b border-admin-line-soft last:border-0 hover:bg-admin-surface-soft">
                  <td className="px-5 py-3 font-medium text-admin-ink">{event.title}</td>
                  <td className="px-5 py-3 text-admin-muted">
                    {formatEventDate(event.eventDate)} · {event.startTime}
                  </td>
                  <td className="px-5 py-3">
                    <Badge status={event.status} />
                  </td>
                  <td className="px-5 py-3 text-admin-muted">{event.ticketTiers?.length ?? 0}</td>
                  <td className="px-5 py-3 text-admin-muted">{event._count?.bookings ?? 0}</td>
                  {canEdit && (
                    <td className="px-5 py-3 text-right">
                      <Link href={`/admin/events/${event.id}`} className="text-admin-primary-ink hover:text-admin-primary-ink">
                        Manage
                      </Link>{" "}
                      <span className="text-admin-faint">·</span>{" "}
                      <button onClick={() => handleDelete(event.id)} className="text-admin-danger-ink hover:text-admin-danger-ink">
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
