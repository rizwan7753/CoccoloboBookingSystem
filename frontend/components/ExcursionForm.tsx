"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminApi } from "@/lib/adminApi";
import { Excursion } from "@/lib/api";
import { inputClass, primaryButtonClass, cardClass } from "@/components/admin/ui";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DEFAULT_LOCATION_ID = "carambola-main"; // MVP: single location, seeded in prisma/seed.ts

export default function ExcursionForm({ initial }: { initial?: Excursion }) {
  const router = useRouter();
  const isEdit = Boolean(initial?.id);

  const [title, setTitle] = useState(initial?.title || "");
  const [slug, setSlug] = useState(initial?.slug || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [included, setIncluded] = useState(initial?.included || "");
  const [excluded, setExcluded] = useState(initial?.excluded || "");
  const [whatToBring, setWhatToBring] = useState(initial?.whatToBring || "");
  const [durationMinutes, setDurationMinutes] = useState(initial?.durationMinutes || 120);
  const [pricingType, setPricingType] = useState<"PER_GUEST" | "FLAT_RATE">(initial?.pricingType || "PER_GUEST");
  const [priceAdult, setPriceAdult] = useState(Number(initial?.priceAdult) || 0);
  const [priceChild, setPriceChild] = useState(Number(initial?.priceChild) || 0);
  const [capacityDefault, setCapacityDefault] = useState(initial?.capacityDefault || 20);
  const [cutoffTime, setCutoffTime] = useState(initial?.cutoffTime || "21:00");
  const [meetingPoint, setMeetingPoint] = useState(initial?.meetingPoint || "");
  const [status, setStatus] = useState(initial?.status || "DRAFT");
  const [time, setTime] = useState(initial?.departureTimes?.[0]?.time || "09:00");
  const [days, setDays] = useState<number[]>(initial?.departureTimes?.[0]?.daysOfWeek || [0, 1, 2, 3, 4, 5, 6]);

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function toggleDay(d: number) {
    setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort()));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const payload = {
      locationId: DEFAULT_LOCATION_ID,
      title,
      slug,
      description,
      included,
      excluded,
      whatToBring,
      durationMinutes: Number(durationMinutes),
      pricingType,
      priceAdult: Number(priceAdult),
      priceChild: Number(priceChild),
      capacityDefault: Number(capacityDefault),
      cutoffTime,
      meetingPoint,
      status,
      departureTimes: [{ time, daysOfWeek: days }],
    };
    try {
      if (isEdit && initial) {
        await adminApi.updateExcursion(initial.id, payload);
      } else {
        await adminApi.createExcursion(payload);
      }
      router.push("/admin/excursions");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save excursion");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className={`${cardClass} max-w-2xl space-y-4 p-6`}>
      <div>
        <label className="mb-1 block text-sm font-medium text-stone-700">Title</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} required />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-stone-700">Slug (URL)</label>
        <input value={slug} onChange={(e) => setSlug(e.target.value)} className={inputClass} required />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-stone-700">Description</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className={inputClass} required />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-stone-700">What&apos;s included</label>
        <textarea
          value={included}
          onChange={(e) => setIncluded(e.target.value)}
          rows={2}
          className={inputClass}
          placeholder="e.g. Beach chair, umbrella, WiFi access, welcome drink"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-stone-700">What&apos;s not included</label>
        <textarea
          value={excluded}
          onChange={(e) => setExcluded(e.target.value)}
          rows={2}
          className={inputClass}
          placeholder="e.g. Food and drinks sold separately, gratuities"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-stone-700">What to bring</label>
        <textarea
          value={whatToBring}
          onChange={(e) => setWhatToBring(e.target.value)}
          rows={2}
          className={inputClass}
          placeholder="e.g. Swimsuit, towel, sunscreen"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-stone-700">Meeting point</label>
        <input value={meetingPoint} onChange={(e) => setMeetingPoint(e.target.value)} className={inputClass} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">Duration (min)</label>
          <input type="number" value={durationMinutes} onChange={(e) => setDurationMinutes(Number(e.target.value))} className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">Default capacity</label>
          <input type="number" value={capacityDefault} onChange={(e) => setCapacityDefault(Number(e.target.value))} className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">Pricing</label>
          <select value={pricingType} onChange={(e) => setPricingType(e.target.value as "PER_GUEST" | "FLAT_RATE")} className={inputClass}>
            <option value="PER_GUEST">Per guest (adult/child)</option>
            <option value="FLAT_RATE">Flat rate for the whole booking</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">
            {pricingType === "FLAT_RATE" ? "Flat price ($)" : "Price — adult ($)"}
          </label>
          <input type="number" step="0.01" value={priceAdult} onChange={(e) => setPriceAdult(Number(e.target.value))} className={inputClass} />
          {pricingType === "FLAT_RATE" && (
            <p className="mt-1 text-xs text-stone-400">
              Charged once per booking regardless of guest count — e.g. &quot;$400 for up to {capacityDefault || "N"} guests.&quot;
            </p>
          )}
        </div>
        {pricingType === "PER_GUEST" && (
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">Price — child ($)</label>
            <input type="number" step="0.01" value={priceChild} onChange={(e) => setPriceChild(Number(e.target.value))} className={inputClass} />
          </div>
        )}
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">Cut-off time (evening before)</label>
          <input type="time" value={cutoffTime} onChange={(e) => setCutoffTime(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputClass}>
            <option value="DRAFT">Draft</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="SOLD_OUT">Sold out</option>
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-stone-700">Departure time</label>
        <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className={`${inputClass} w-40`} />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-stone-700">Departure days</label>
        <div className="flex gap-2">
          {DAYS.map((label, i) => (
            <button
              type="button"
              key={label}
              onClick={() => toggleDay(i)}
              className={`rounded-md border px-2.5 py-1 text-xs font-medium transition ${
                days.includes(i) ? "border-teal-700 bg-teal-700 text-white" : "border-stone-300 text-stone-600 hover:border-teal-600"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button type="submit" disabled={submitting} className={primaryButtonClass}>
        {submitting ? "Saving…" : isEdit ? "Save changes" : "Create excursion"}
      </button>
    </form>
  );
}
