"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { adminApi, AdminEvent, getStoredAdmin, canEditExcursions } from "@/lib/adminApi";
import EventForm from "@/components/EventForm";
import { PageHeader, cardClass, inputClass, primaryButtonClass } from "@/components/admin/ui";

export default function EditEventPage() {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<AdminEvent | null>(null);
  const [loading, setLoading] = useState(true);

  const [tierName, setTierName] = useState("");
  const [tierDescription, setTierDescription] = useState("");
  const [tierPrice, setTierPrice] = useState(0);
  const [tierCapacity, setTierCapacity] = useState(50);
  const [tierError, setTierError] = useState<string | null>(null);

  const canEdit = canEditExcursions(getStoredAdmin()?.role);

  function loadEvent() {
    adminApi
      .getEvent(id)
      .then(setEvent)
      .finally(() => setLoading(false));
  }

  useEffect(loadEvent, [id]);

  async function handleAddTier(e: React.FormEvent) {
    e.preventDefault();
    setTierError(null);
    try {
      await adminApi.addEventTier(id, {
        name: tierName,
        description: tierDescription || undefined,
        price: tierPrice,
        capacity: tierCapacity,
      });
      setTierName("");
      setTierDescription("");
      setTierPrice(0);
      setTierCapacity(50);
      loadEvent();
    } catch (err) {
      setTierError(err instanceof Error ? err.message : "Failed to add tier");
    }
  }

  async function handleToggleTier(tierId: string, isActive: boolean) {
    await adminApi.updateEventTier(tierId, { isActive: !isActive });
    loadEvent();
  }

  async function handleDeleteTier(tierId: string) {
    if (!confirm("Remove this ticket tier? This cannot be undone.")) return;
    await adminApi.deleteEventTier(tierId);
    loadEvent();
  }

  if (loading) return <p className="text-sm text-stone-400">Loading…</p>;
  if (!event) return <p className="text-sm text-red-600">Event not found.</p>;

  const totalCapacity = event.ticketTiers?.reduce((sum, t) => sum + t.capacity, 0) ?? 0;

  return (
    <div className="space-y-8">
      <div>
        <PageHeader
          title={`Edit: ${event.title}`}
          actions={
            <Link href={`/admin/event-bookings?eventId=${event.id}`} className={primaryButtonClass}>
              View bookings
            </Link>
          }
        />
        <EventForm initial={event} />
      </div>

      {canEdit && (
        <div>
          <h2 className="mb-3 text-sm font-semibold text-stone-900">Ticket tiers</h2>
          <div className={`${cardClass} max-w-2xl p-5`}>
            <div className="space-y-2">
              {event.ticketTiers?.map((tier) => (
                <div
                  key={tier.id}
                  className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm ${
                    tier.isActive ? "border-stone-300 text-stone-700" : "border-stone-200 bg-stone-50 text-stone-400"
                  }`}
                >
                  <button onClick={() => handleToggleTier(tier.id, tier.isActive)} className="text-left hover:underline">
                    <span className="font-medium">{tier.name}</span> — ${tier.price} × {tier.capacity} capacity
                    {tier.description && <span className="block text-xs text-stone-400">{tier.description}</span>}
                  </button>
                  <button onClick={() => handleDeleteTier(tier.id)} className="ml-3 text-rose-500 hover:text-rose-700">
                    ×
                  </button>
                </div>
              ))}
              {(!event.ticketTiers || event.ticketTiers.length === 0) && (
                <p className="text-sm text-stone-400">No ticket tiers yet — add at least one before going live.</p>
              )}
            </div>

            <p className="mt-4 text-sm font-medium text-stone-700">Total capacity: {totalCapacity} tickets</p>

            <form onSubmit={handleAddTier} className="mt-3 grid grid-cols-2 gap-2">
              <input placeholder="Tier name (e.g. VIP)" value={tierName} onChange={(e) => setTierName(e.target.value)} className={inputClass} required />
              <input placeholder="Description (optional)" value={tierDescription} onChange={(e) => setTierDescription(e.target.value)} className={inputClass} />
              <input
                type="number"
                step="0.01"
                min={0}
                placeholder="Price ($)"
                value={tierPrice}
                onChange={(e) => setTierPrice(Number(e.target.value))}
                className={inputClass}
                required
              />
              <input
                type="number"
                min={1}
                placeholder="Capacity"
                value={tierCapacity}
                onChange={(e) => setTierCapacity(Number(e.target.value))}
                className={inputClass}
                required
              />
              <button type="submit" className={`${primaryButtonClass} col-span-2`}>
                Add tier
              </button>
            </form>
            {tierError && <p className="mt-2 text-sm text-red-600">{tierError}</p>}
            <p className="mt-2 text-xs text-stone-400">Click a tier&apos;s name to activate/deactivate it. × removes it entirely.</p>
          </div>
        </div>
      )}
    </div>
  );
}
