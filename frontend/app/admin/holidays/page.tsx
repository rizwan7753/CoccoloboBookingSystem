"use client";

import { useEffect, useState } from "react";
import { adminApi, AdminHoliday, getStoredAdmin, canEditExcursions } from "@/lib/adminApi";
import { PageHeader, cardClass, inputClass, primaryButtonClass } from "@/components/admin/ui";

const DEFAULT_LOCATION_ID = "carambola-main"; // MVP: single location, seeded in prisma/seed.ts

function formatDate(iso: string) {
  return new Date(`${iso.slice(0, 10)}T00:00:00`).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function AdminHolidaysPage() {
  const [holidays, setHolidays] = useState<AdminHoliday[]>([]);
  const [loading, setLoading] = useState(true);

  const [date, setDate] = useState("");
  const [label, setLabel] = useState("");
  const [appliesToExcursions, setAppliesToExcursions] = useState(true);
  const [appliesToRentals, setAppliesToRentals] = useState(true);
  const [appliesToEvents, setAppliesToEvents] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const canEdit = canEditExcursions(getStoredAdmin()?.role);

  function load() {
    adminApi
      .listHolidays()
      .then(setHolidays)
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await adminApi.createHoliday({
        locationId: DEFAULT_LOCATION_ID,
        date,
        label,
        appliesToExcursions,
        appliesToRentals,
        appliesToEvents,
      });
      setDate("");
      setLabel("");
      setAppliesToExcursions(true);
      setAppliesToRentals(true);
      setAppliesToEvents(true);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add holiday");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleScope(holiday: AdminHoliday, field: "appliesToExcursions" | "appliesToRentals" | "appliesToEvents") {
    await adminApi.updateHoliday(holiday.id, { [field]: !holiday[field] });
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this closure? Booking will re-open for this date.")) return;
    await adminApi.deleteHoliday(id);
    setHolidays((prev) => prev.filter((h) => h.id !== id));
  }

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = holidays.filter((h) => h.date.slice(0, 10) >= today);
  const past = holidays.filter((h) => h.date.slice(0, 10) < today);

  function ScopeBadge({ active, label: l }: { active: boolean; label: string }) {
    return (
      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${active ? "bg-rose-100 text-rose-700" : "bg-stone-100 text-stone-400"}`}>
        {l}
      </span>
    );
  }

  return (
    <div>
      <PageHeader
        title="Holidays & closures"
        description="Block booking for a specific date across excursions, beach chairs, and/or events — e.g. a public holiday or weather closure. Shown to guests as 'Closed for {label}' when they try to book that date."
      />

      {canEdit && (
        <form onSubmit={handleCreate} className={`${cardClass} mb-6 max-w-2xl space-y-3 p-5`}>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-700">Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} required />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-700">Label</label>
              <input
                placeholder="e.g. Christmas Day"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className={inputClass}
                required
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">Applies to</label>
            <div className="flex gap-4 text-sm text-stone-600">
              <label className="flex items-center gap-1.5">
                <input type="checkbox" checked={appliesToExcursions} onChange={(e) => setAppliesToExcursions(e.target.checked)} />
                Excursions
              </label>
              <label className="flex items-center gap-1.5">
                <input type="checkbox" checked={appliesToRentals} onChange={(e) => setAppliesToRentals(e.target.checked)} />
                Beach chairs
              </label>
              <label className="flex items-center gap-1.5">
                <input type="checkbox" checked={appliesToEvents} onChange={(e) => setAppliesToEvents(e.target.checked)} />
                Events
              </label>
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button type="submit" disabled={submitting} className={primaryButtonClass}>
            {submitting ? "Adding…" : "Add closure"}
          </button>
        </form>
      )}

      <div className={`${cardClass} overflow-hidden`}>
        {loading ? (
          <p className="p-6 text-sm text-stone-400">Loading…</p>
        ) : holidays.length === 0 ? (
          <p className="p-6 text-sm text-stone-400">No holidays or closures configured.</p>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full min-w-[550px] text-left text-sm">
            <thead className="border-b border-stone-100 text-xs uppercase tracking-wide text-stone-400">
              <tr>
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Label</th>
                <th className="px-5 py-3 font-medium">Applies to</th>
                {canEdit && <th className="px-5 py-3"></th>}
              </tr>
            </thead>
            <tbody>
              {[...upcoming, ...past].map((h) => (
                <tr key={h.id} className={`border-b border-stone-50 last:border-0 hover:bg-stone-50/60 ${h.date.slice(0, 10) < today ? "opacity-50" : ""}`}>
                  <td className="px-5 py-3 font-medium text-stone-900">{formatDate(h.date)}</td>
                  <td className="px-5 py-3 text-stone-600">{h.label}</td>
                  <td className="px-5 py-3">
                    <div className="flex gap-1.5">
                      <button onClick={() => canEdit && handleToggleScope(h, "appliesToExcursions")} disabled={!canEdit}>
                        <ScopeBadge active={h.appliesToExcursions} label="Excursions" />
                      </button>
                      <button onClick={() => canEdit && handleToggleScope(h, "appliesToRentals")} disabled={!canEdit}>
                        <ScopeBadge active={h.appliesToRentals} label="Beach chairs" />
                      </button>
                      <button onClick={() => canEdit && handleToggleScope(h, "appliesToEvents")} disabled={!canEdit}>
                        <ScopeBadge active={h.appliesToEvents} label="Events" />
                      </button>
                    </div>
                  </td>
                  {canEdit && (
                    <td className="px-5 py-3 text-right">
                      <button onClick={() => handleDelete(h.id)} className="text-rose-600 hover:text-rose-800">
                        Remove
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
