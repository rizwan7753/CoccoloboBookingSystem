"use client";

import { useEffect, useState } from "react";
import { reviewApi, Review, ReviewItemType } from "@/lib/reviewApi";

const fieldClass =
  "w-full rounded-lg border border-rule bg-white px-3 py-2 text-sm text-abyss placeholder:text-abyss/45 focus:border-coral focus:outline-none";

function Stars({ rating, size = "1.05rem" }: { rating: number; size?: string }) {
  return (
    <div className="stars" role="img" aria-label={`${rating} out of 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} style={{ width: size, height: size }} className={i < rating ? "" : "off"} aria-hidden="true">
          <use href="#ic-star" />
        </svg>
      ))}
    </div>
  );
}

function StarPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex gap-1" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star${n === 1 ? "" : "s"}`}
          onClick={() => onChange(n)}
          className="p-0.5"
        >
          <svg className={`h-6 w-6 ${n <= value ? "text-coral-ink" : "text-abyss/20"}`} aria-hidden="true">
            <use href="#ic-star" />
          </svg>
        </button>
      ))}
    </div>
  );
}

function initialsFrom(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

/** Reviews scoped to one bookable item (excursion, beach chair, or event) —
 *  shown on its detail page. Guests can submit a review here; it lands
 *  PENDING and only appears once an admin approves it (routes/reviews.ts +
 *  the admin Reviews moderation queue). */
export default function ItemReviews({
  itemType,
  itemId,
  itemTitle,
}: {
  itemType: ReviewItemType;
  itemId: string;
  itemTitle: string;
}) {
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [rating, setRating] = useState(5);
  const [authorName, setAuthorName] = useState("");
  const [title, setTitle] = useState("");
  const [quote, setQuote] = useState("");

  useEffect(() => {
    reviewApi
      .listReviews({ itemType, itemId })
      .then(setReviews)
      .catch(() => setReviews([]));
  }, [itemType, itemId]);

  const avg = reviews && reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await reviewApi.submitReview({
        itemType,
        itemId,
        itemTitle,
        rating,
        title: title.trim() || undefined,
        quote: quote.trim(),
        authorName: authorName.trim(),
      });
      setSubmitted(true);
      setFormOpen(false);
      setRating(5);
      setAuthorName("");
      setTitle("");
      setQuote("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't submit your review — please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-10 border-t border-rule pt-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl text-abyss">Guest reviews</h2>
          {reviews && reviews.length > 0 && (
            <div className="mt-1 flex items-center gap-2 text-sm text-abyss/70">
              <Stars rating={Math.round(avg)} />
              <span>
                {avg.toFixed(1)} · {reviews.length} review{reviews.length === 1 ? "" : "s"}
              </span>
            </div>
          )}
        </div>
        {!formOpen && !submitted && (
          <button type="button" onClick={() => setFormOpen(true)} className="btn btn-ghost">
            Write a review
          </button>
        )}
      </div>

      {submitted && (
        <div className="mb-6 rounded-lg border border-rule bg-sand px-4 py-3 text-sm text-abyss">
          Thanks for your review — it&apos;s awaiting approval and will appear here once it&apos;s been checked.
        </div>
      )}

      {formOpen && (
        <form onSubmit={handleSubmit} className="mb-6 flex flex-col gap-3 rounded-xl border border-rule bg-shell p-5">
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide opacity-60">Your rating</label>
            <StarPicker value={rating} onChange={setRating} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide opacity-60">Your name</label>
            <input value={authorName} onChange={(e) => setAuthorName(e.target.value)} required className={fieldClass} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide opacity-60">Title (optional)</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className={fieldClass} placeholder="Sum it up in a few words" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide opacity-60">Your review</label>
            <textarea
              value={quote}
              onChange={(e) => setQuote(e.target.value)}
              required
              minLength={10}
              rows={4}
              className={fieldClass}
              placeholder={`What was your experience with ${itemTitle}?`}
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={submitting} className="btn flex-1 justify-center">
              {submitting ? "Submitting…" : "Submit review"}
            </button>
            <button type="button" onClick={() => setFormOpen(false)} className="btn btn-ghost">
              Cancel
            </button>
          </div>
        </form>
      )}

      {reviews === null ? (
        <p className="text-sm opacity-60">Loading reviews…</p>
      ) : reviews.length === 0 ? (
        <p className="text-sm opacity-60">No reviews yet — be the first to share how it went.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-rule">
          {reviews.map((r) => (
            <li key={r.id} className="flex gap-3 py-5 first:pt-0">
              <span className="rev-avatar flex-shrink-0" aria-hidden="true">
                {r.authorInitials || initialsFrom(r.authorName)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                  <span className="font-medium text-abyss">{r.authorName}</span>
                  <Stars rating={r.rating} size=".9rem" />
                </div>
                {r.authorMeta && <p className="text-xs opacity-55">{r.authorMeta}</p>}
                {r.title && <h3 className="font-display mt-1.5 text-base text-abyss">{r.title}</h3>}
                <p className="mt-1 text-sm leading-relaxed opacity-80">{r.quote}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
