"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminApi, AdminEvent } from "@/lib/adminApi";
import { inputClass, primaryButtonClass, cardClass } from "@/components/admin/ui";
import ImageUploadField from "@/components/ImageUploadField";
import MultiImageUploadField from "@/components/MultiImageUploadField";
import { slugify } from "@/lib/slugify";


export default function EventForm({ initial }: { initial?: AdminEvent }) {
  const router = useRouter();
  const isEdit = Boolean(initial?.id);

  const [title, setTitle] = useState(initial?.title || "");
  const [slug, setSlug] = useState(initial?.slug || "");
  const [slugTouched, setSlugTouched] = useState(Boolean(initial?.slug));

  function handleTitleChange(value: string) {
    setTitle(value);
    if (!slugTouched) setSlug(slugify(value));
  }
  const [description, setDescription] = useState(initial?.description || "");
  const [eventDate, setEventDate] = useState(initial?.eventDate?.slice(0, 10) || "");
  const [startTime, setStartTime] = useState(initial?.startTime || "19:00");
  const [endTime, setEndTime] = useState(initial?.endTime || "");
  const [venue, setVenue] = useState(initial?.venue || "");
  const [mapUrl, setMapUrl] = useState(initial?.mapUrl || "");
  const [status, setStatus] = useState(initial?.status || "DRAFT");
  const [cardImageUrl, setCardImageUrl] = useState(initial?.cardImageUrl || "");
  const [headerImageUrl, setHeaderImageUrl] = useState(initial?.headerImageUrl || "");
  const [images, setImages] = useState<string[]>(initial?.images ?? []);

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const payload = {
      title,
      slug,
      description,
      eventDate,
      startTime,
      endTime: endTime || undefined,
      venue,
      mapUrl,
      status,
      cardImageUrl: cardImageUrl || undefined,
      headerImageUrl: headerImageUrl || undefined,
      images,
    };
    try {
      if (isEdit && initial) {
        await adminApi.updateEvent(initial.id, payload);
        router.push(`/admin/events/${initial.id}`);
      } else {
        const created = await adminApi.createEvent(payload);
        router.push(`/admin/events/${created.id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save event");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className={`${cardClass} max-w-2xl space-y-4 p-6`}>
      <div>
        <label className="mb-1 block text-sm font-medium text-stone-700">Title</label>
        <input value={title} onChange={(e) => handleTitleChange(e.target.value)} className={inputClass} required />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-stone-700">Slug (URL)</label>
        <input
          value={slug}
          onChange={(e) => {
            setSlug(e.target.value);
            setSlugTouched(true);
          }}
          className={inputClass}
          required
        />
        <p className="mt-1 text-xs text-stone-400">Auto-generated from the title — edit if you want a different URL.</p>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-stone-700">Description</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className={inputClass} required />
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
      <MultiImageUploadField
        label="Gallery"
        value={images}
        onChange={setImages}
        hint="Extra photos shown as a gallery on the detail page, in addition to the header image above."
      />

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">Event date</label>
          <input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className={inputClass} required />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">Start time</label>
          <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className={inputClass} required />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">End time (optional)</label>
          <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className={inputClass} />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-stone-700">Venue</label>
        <input value={venue} onChange={(e) => setVenue(e.target.value)} className={inputClass} placeholder="e.g. Coccolobo Beach Club main lawn" />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-stone-700">Map URL (optional)</label>
        <input value={mapUrl} onChange={(e) => setMapUrl(e.target.value)} className={inputClass} />
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

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button type="submit" disabled={submitting} className={primaryButtonClass}>
        {submitting ? "Saving…" : isEdit ? "Save changes" : "Create & manage tickets"}
      </button>
    </form>
  );
}
