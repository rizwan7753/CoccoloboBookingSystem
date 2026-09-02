"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminApi, AdminRentalItem } from "@/lib/adminApi";
import { inputClass, primaryButtonClass, cardClass } from "@/components/admin/ui";
import ImageUploadField from "@/components/ImageUploadField";

const DEFAULT_LOCATION_ID = "carambola-main"; // MVP: single location, seeded in prisma/seed.ts

export default function RentalItemForm({ initial }: { initial?: AdminRentalItem }) {
  const router = useRouter();
  const isEdit = Boolean(initial?.id);

  const [name, setName] = useState(initial?.name || "");
  const [slug, setSlug] = useState(initial?.slug || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [durationMinutes, setDurationMinutes] = useState(initial?.durationMinutes || 240);
  const [priceAdult, setPriceAdult] = useState(Number(initial?.priceAdult) || 0);
  const [priceChild, setPriceChild] = useState(Number(initial?.priceChild) || 0);
  const [status, setStatus] = useState(initial?.status || "DRAFT");
  const [cardImageUrl, setCardImageUrl] = useState(initial?.cardImageUrl || "");
  const [headerImageUrl, setHeaderImageUrl] = useState(initial?.headerImageUrl || "");

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const payload = {
      locationId: DEFAULT_LOCATION_ID,
      name,
      slug,
      description,
      durationMinutes: Number(durationMinutes),
      priceAdult: Number(priceAdult),
      priceChild: Number(priceChild),
      status,
      cardImageUrl: cardImageUrl || undefined,
      headerImageUrl: headerImageUrl || undefined,
    };
    try {
      if (isEdit && initial) {
        await adminApi.updateRental(initial.id, payload);
        router.push(`/admin/rentals/${initial.id}`);
      } else {
        const created = await adminApi.createRental(payload);
        router.push(`/admin/rentals/${created.id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save rental item");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className={`${cardClass} max-w-2xl space-y-4 p-6`}>
      <div>
        <label className="mb-1 block text-sm font-medium text-stone-700">Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} required />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-stone-700">Slug (URL)</label>
        <input value={slug} onChange={(e) => setSlug(e.target.value)} className={inputClass} required />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-stone-700">Description</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className={inputClass} required />
      </div>

      <ImageUploadField
        label="Card image (listing thumbnail)"
        value={cardImageUrl}
        onChange={setCardImageUrl}
        hint="Recommended: 1200×800px landscape (3:2), under 500KB. Cropped to fill — avoid portrait photos."
      />
      <ImageUploadField
        label="Header image (detail page top)"
        value={headerImageUrl}
        onChange={setHeaderImageUrl}
        hint="Recommended: 1920×600px wide landscape (~3:1), under 500KB. Spans the full page width — a tall or square photo will get heavily cropped."
      />

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">Session duration (min)</label>
          <input
            type="number"
            min={15}
            step={15}
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(Math.max(15, Number(e.target.value)))}
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">Price — adult ($)</label>
          <input type="number" step="0.01" value={priceAdult} onChange={(e) => setPriceAdult(Number(e.target.value))} className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">Price — child ($)</label>
          <input type="number" step="0.01" value={priceChild} onChange={(e) => setPriceChild(Number(e.target.value))} className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputClass}>
            <option value="DRAFT">Draft</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button type="submit" disabled={submitting} className={primaryButtonClass}>
        {submitting ? "Saving…" : isEdit ? "Save changes" : "Create & manage spots"}
      </button>
    </form>
  );
}
