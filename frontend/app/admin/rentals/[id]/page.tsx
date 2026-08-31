"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { adminApi, AdminRentalItem, getStoredAdmin, canEditExcursions } from "@/lib/adminApi";
import RentalItemForm from "@/components/RentalItemForm";
import { PageHeader, cardClass, inputClass, primaryButtonClass } from "@/components/admin/ui";

export default function EditRentalPage() {
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<AdminRentalItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [newSpotCode, setNewSpotCode] = useState("");
  const [newSpotQuantity, setNewSpotQuantity] = useState(1);
  const [spotError, setSpotError] = useState<string | null>(null);

  const [newSlotLabel, setNewSlotLabel] = useState("");
  const [newSlotStart, setNewSlotStart] = useState("09:00");
  const [newSlotEnd, setNewSlotEnd] = useState("13:00");
  const [slotError, setSlotError] = useState<string | null>(null);

  const [operatingStart, setOperatingStart] = useState("09:00");
  const [operatingEnd, setOperatingEnd] = useState("17:00");
  const [generateMessage, setGenerateMessage] = useState<string | null>(null);
  const [generateError, setGenerateError] = useState<string | null>(null);

  const canEdit = canEditExcursions(getStoredAdmin()?.role);

  function loadItem() {
    adminApi
      .getRental(id)
      .then(setItem)
      .finally(() => setLoading(false));
  }

  useEffect(loadItem, [id]);

  async function handleAddSpot(e: React.FormEvent) {
    e.preventDefault();
    setSpotError(null);
    try {
      await adminApi.addRentalSpot(id, newSpotCode, newSpotQuantity);
      setNewSpotCode("");
      setNewSpotQuantity(1);
      loadItem();
    } catch (err) {
      setSpotError(err instanceof Error ? err.message : "Failed to add spot");
    }
  }

  async function handleToggleSpot(spotId: string, isActive: boolean) {
    await adminApi.updateRentalSpot(spotId, { isActive: !isActive });
    loadItem();
  }

  async function handleDeleteSpot(spotId: string) {
    if (!confirm("Remove this spot? This cannot be undone.")) return;
    await adminApi.deleteRentalSpot(spotId);
    loadItem();
  }

  async function handleAddTimeSlot(e: React.FormEvent) {
    e.preventDefault();
    setSlotError(null);
    try {
      await adminApi.addRentalTimeSlot(id, { label: newSlotLabel, startTime: newSlotStart, endTime: newSlotEnd });
      setNewSlotLabel("");
      loadItem();
    } catch (err) {
      setSlotError(err instanceof Error ? err.message : "Failed to add time slot");
    }
  }

  async function handleToggleTimeSlot(timeSlotId: string, isActive: boolean) {
    await adminApi.updateRentalTimeSlot(timeSlotId, { isActive: !isActive });
    loadItem();
  }

  async function handleDeleteTimeSlot(timeSlotId: string) {
    if (!confirm("Remove this time slot? This cannot be undone.")) return;
    await adminApi.deleteRentalTimeSlot(timeSlotId);
    loadItem();
  }

  async function handleGenerateSlots(e: React.FormEvent) {
    e.preventDefault();
    setGenerateError(null);
    setGenerateMessage(null);
    try {
      const result = await adminApi.generateRentalTimeSlots(id, { operatingStart, operatingEnd });
      setGenerateMessage(
        result.created.length > 0
          ? `Created ${result.created.length} slot${result.created.length === 1 ? "" : "s"}.${
              result.skipped.length > 0 ? ` Skipped ${result.skipped.length} that already existed.` : ""
            }`
          : "No new slots created — they may already exist, or the operating window is shorter than one session."
      );
      loadItem();
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : "Failed to generate time slots");
    }
  }

  if (loading) return <p className="text-sm text-stone-400">Loading…</p>;
  if (!item) return <p className="text-sm text-red-600">Rental item not found.</p>;

  return (
    <div className="space-y-8">
      <div>
        <PageHeader
          title={`Edit: ${item.name}`}
          actions={
            <Link href={`/admin/rental-bookings?rentalItemId=${item.id}`} className={primaryButtonClass}>
              View bookings
            </Link>
          }
        />
        <RentalItemForm initial={item} />
      </div>

      {canEdit && (
        <div>
          <h2 className="mb-3 text-sm font-semibold text-stone-900">Spots</h2>
          <div className={`${cardClass} max-w-2xl p-5`}>
            <div className="flex flex-wrap gap-2">
              {item.spots?.map((spot) => (
                <div
                  key={spot.id}
                  className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-sm ${
                    spot.isActive ? "border-stone-300 text-stone-700" : "border-stone-200 bg-stone-50 text-stone-400"
                  }`}
                >
                  <button onClick={() => handleToggleSpot(spot.id, spot.isActive)} className="hover:underline">
                    {spot.code} <span className="text-stone-400">({spot.quantity} chairs)</span>
                  </button>
                  <button onClick={() => handleDeleteSpot(spot.id)} className="text-rose-500 hover:text-rose-700">
                    ×
                  </button>
                </div>
              ))}
              {(!item.spots || item.spots.length === 0) && <p className="text-sm text-stone-400">No spots yet.</p>}
            </div>

            <p className="mt-4 text-sm font-medium text-stone-700">
              Total chairs: {item.spots?.reduce((sum, s) => sum + s.quantity, 0) ?? 0}
            </p>

            <form onSubmit={handleAddSpot} className="mt-3 flex gap-2">
              <input
                placeholder="e.g. Row C"
                value={newSpotCode}
                onChange={(e) => setNewSpotCode(e.target.value)}
                className={inputClass}
                required
              />
              <input
                type="number"
                min={1}
                placeholder="Chairs"
                value={newSpotQuantity}
                onChange={(e) => setNewSpotQuantity(Math.max(1, Number(e.target.value)))}
                className={`${inputClass} w-28`}
                required
              />
              <button type="submit" className={primaryButtonClass}>
                Add spot
              </button>
            </form>
            {spotError && <p className="mt-2 text-sm text-red-600">{spotError}</p>}
            <p className="mt-2 text-xs text-stone-400">
              Click a spot&apos;s name to activate/deactivate it. × removes it entirely. A spot holds multiple chairs —
              one booking can take more than one.
            </p>
          </div>
        </div>
      )}

      {canEdit && (
        <div>
          <h2 className="mb-3 text-sm font-semibold text-stone-900">Time slots</h2>
          <div className={`${cardClass} max-w-2xl p-5`}>
            <div className="flex flex-wrap gap-2">
              {item.timeSlots?.map((slot) => (
                <div
                  key={slot.id}
                  className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-sm ${
                    slot.isActive ? "border-stone-300 text-stone-700" : "border-stone-200 bg-stone-50 text-stone-400"
                  }`}
                >
                  <button onClick={() => handleToggleTimeSlot(slot.id, slot.isActive)} className="hover:underline">
                    {slot.label} <span className="text-stone-400">({slot.startTime}–{slot.endTime})</span>
                  </button>
                  <button onClick={() => handleDeleteTimeSlot(slot.id)} className="text-rose-500 hover:text-rose-700">
                    ×
                  </button>
                </div>
              ))}
              {(!item.timeSlots || item.timeSlots.length === 0) && (
                <p className="text-sm text-stone-400">No time slots yet — add at least one before going live.</p>
              )}
            </div>

            <div className="mt-4 rounded-lg border border-stone-200 bg-stone-50 p-3">
              <p className="text-sm font-medium text-stone-700">
                Generate slots from the {item.durationMinutes}-minute session duration
              </p>
              <form onSubmit={handleGenerateSlots} className="mt-2 flex flex-wrap items-end gap-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-stone-500">Operating hours from</label>
                  <input type="time" value={operatingStart} onChange={(e) => setOperatingStart(e.target.value)} className={`${inputClass} w-32`} required />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-stone-500">to</label>
                  <input type="time" value={operatingEnd} onChange={(e) => setOperatingEnd(e.target.value)} className={`${inputClass} w-32`} required />
                </div>
                <button type="submit" className={primaryButtonClass}>
                  Generate slots
                </button>
              </form>
              {generateMessage && <p className="mt-2 text-sm text-emerald-700">{generateMessage}</p>}
              {generateError && <p className="mt-2 text-sm text-red-600">{generateError}</p>}
              <p className="mt-2 text-xs text-stone-400">
                Splits the operating window into consecutive {item.durationMinutes}-minute slots (e.g. 9:00 AM–5:00 PM
                at 240 min → two 4-hour slots). Change the session duration above and re-generate to adjust slot length.
                Existing slots with the same time range are left alone.
              </p>
            </div>

            <details className="mt-4">
              <summary className="cursor-pointer text-sm font-medium text-stone-700">Or add one manually</summary>
              <form onSubmit={handleAddTimeSlot} className="mt-2 flex flex-wrap gap-2">
                <input
                  placeholder="e.g. Morning"
                  value={newSlotLabel}
                  onChange={(e) => setNewSlotLabel(e.target.value)}
                  className={inputClass}
                  required
                />
                <input type="time" value={newSlotStart} onChange={(e) => setNewSlotStart(e.target.value)} className={`${inputClass} w-32`} required />
                <input type="time" value={newSlotEnd} onChange={(e) => setNewSlotEnd(e.target.value)} className={`${inputClass} w-32`} required />
                <button type="submit" className={primaryButtonClass}>
                  Add time slot
                </button>
              </form>
              {slotError && <p className="mt-2 text-sm text-red-600">{slotError}</p>}
            </details>

            <p className="mt-3 text-xs text-stone-400">
              Click a time slot&apos;s name to activate/deactivate it. × removes it entirely. Each spot&apos;s chair
              count resets per time slot — the same chair can be booked in the morning and again in the afternoon.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
