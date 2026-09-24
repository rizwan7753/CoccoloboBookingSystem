"use client";

import { useEffect, useState } from "react";
import { adminApi, AdminReview, AdminReviewStatus, getStoredAdmin, canManageContent } from "@/lib/adminApi";
import { PageHeader, cardClass, inputClass, primaryButtonClass, Badge } from "@/components/admin/ui";

const emptyForm = {
  rating: 5,
  title: "",
  quote: "",
  authorName: "",
  authorInitials: "",
  authorMeta: "",
  status: "PUBLISHED" as AdminReviewStatus,
};

const ITEM_TYPE_LABELS: Record<string, string> = {
  EXCURSION: "Excursion",
  RENTAL: "Beach chair",
  EVENT: "Event",
};

function ScopeLabel({ review }: { review: AdminReview }) {
  if (!review.itemType || !review.itemTitle) {
    return <span className="text-stone-400">General (homepage)</span>;
  }
  return (
    <span>
      <span className="text-stone-400">{ITEM_TYPE_LABELS[review.itemType] ?? review.itemType}:</span> {review.itemTitle}
    </span>
  );
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"pending" | "all">("pending");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [actioningId, setActioningId] = useState<string | null>(null);

  const canEdit = canManageContent(getStoredAdmin()?.permissions);

  function load() {
    setLoading(true);
    adminApi
      .listReviews()
      .then(setReviews)
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  const pending = reviews.filter((r) => r.status === "PENDING");
  const visible = tab === "pending" ? pending : reviews;

  function startCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
    setShowForm(true);
  }

  function startEdit(review: AdminReview) {
    setEditingId(review.id);
    setForm({
      rating: review.rating,
      title: review.title ?? "",
      quote: review.quote,
      authorName: review.authorName,
      authorInitials: review.authorInitials ?? "",
      authorMeta: review.authorMeta ?? "",
      status: review.status,
    });
    setError(null);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const payload = {
      rating: Number(form.rating),
      title: form.title.trim() || undefined,
      quote: form.quote.trim(),
      authorName: form.authorName.trim(),
      authorInitials: form.authorInitials.trim() || undefined,
      authorMeta: form.authorMeta.trim() || undefined,
      status: form.status,
    };
    try {
      if (editingId) {
        await adminApi.updateReview(editingId, payload);
      } else {
        await adminApi.createReview(payload);
      }
      setShowForm(false);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save review");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleApprove(id: string) {
    setActioningId(id);
    try {
      await adminApi.approveReview(id);
      load();
    } finally {
      setActioningId(null);
    }
  }

  async function handleReject(id: string) {
    setActioningId(id);
    try {
      await adminApi.rejectReview(id);
      load();
    } finally {
      setActioningId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this review? This can't be undone.")) return;
    await adminApi.deleteReview(id);
    setReviews((prev) => prev.filter((r) => r.id !== id));
  }

  return (
    <div>
      <PageHeader
        title="Reviews"
        description="Guest testimonials shown on the homepage and on each excursion/beach chair/event's own page. Guest-submitted reviews land here as Pending until you approve or reject them."
        actions={
          canEdit && !showForm ? (
            <button onClick={startCreate} className={primaryButtonClass}>
              Add homepage review
            </button>
          ) : undefined
        }
      />

      <div className="mb-4 flex gap-1 border-b border-stone-200">
        <button
          onClick={() => setTab("pending")}
          className={`px-4 py-2 text-sm font-medium ${tab === "pending" ? "border-b-2 border-teal-700 text-teal-800" : "text-stone-500 hover:text-stone-800"}`}
        >
          Pending {pending.length > 0 && <span className="ml-1 rounded-full bg-amber-100 px-1.5 py-0.5 text-xs text-amber-800">{pending.length}</span>}
        </button>
        <button
          onClick={() => setTab("all")}
          className={`px-4 py-2 text-sm font-medium ${tab === "all" ? "border-b-2 border-teal-700 text-teal-800" : "text-stone-500 hover:text-stone-800"}`}
        >
          All reviews
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className={`${cardClass} mb-6 max-w-2xl space-y-4 p-5`}>
          <p className="text-xs text-stone-400">
            This adds a general testimonial shown on the homepage. Reviews scoped to a specific excursion/chair/event come from guests via that
            item&apos;s page — approve or reject those instead of creating them here.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-700">Rating</label>
              <select
                value={form.rating}
                onChange={(e) => setForm((f) => ({ ...f, rating: Number(e.target.value) }))}
                className={inputClass}
              >
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>
                    {n} star{n === 1 ? "" : "s"}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-700">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as AdminReviewStatus }))}
                className={inputClass}
              >
                <option value="PUBLISHED">Published</option>
                <option value="DRAFT">Draft</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">Title (optional)</label>
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Worth every dollar of the cabana"
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">Quote</label>
            <textarea
              value={form.quote}
              onChange={(e) => setForm((f) => ({ ...f, quote: e.target.value }))}
              rows={4}
              required
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-700">Author name</label>
              <input
                value={form.authorName}
                onChange={(e) => setForm((f) => ({ ...f, authorName: e.target.value }))}
                placeholder="Marcus D."
                required
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-700">Initials (optional)</label>
              <input
                value={form.authorInitials}
                onChange={(e) => setForm((f) => ({ ...f, authorInitials: e.target.value }))}
                placeholder="MD"
                maxLength={3}
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-700">Meta (optional)</label>
              <input
                value={form.authorMeta}
                onChange={(e) => setForm((f) => ({ ...f, authorMeta: e.target.value }))}
                placeholder="Tampa, FL · August 2026"
                className={inputClass}
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-2">
            <button type="submit" disabled={submitting} className={primaryButtonClass}>
              {submitting ? "Saving…" : editingId ? "Save changes" : "Add review"}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="rounded-lg px-4 py-2 text-sm font-medium text-stone-500 hover:bg-stone-100">
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className={`${cardClass} overflow-hidden`}>
        {loading ? (
          <p className="p-6 text-sm text-stone-400">Loading…</p>
        ) : visible.length === 0 ? (
          <p className="p-6 text-sm text-stone-400">
            {tab === "pending" ? "No reviews waiting on approval." : "No reviews yet."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[750px] text-left text-sm">
              <thead className="border-b border-stone-100 text-xs uppercase tracking-wide text-stone-400">
                <tr>
                  <th className="px-5 py-3 font-medium">Rating</th>
                  <th className="px-5 py-3 font-medium">Review</th>
                  <th className="px-5 py-3 font-medium">Shown on</th>
                  <th className="px-5 py-3 font-medium">Author</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {visible.map((r) => (
                  <tr key={r.id} className="border-b border-stone-50 last:border-0 hover:bg-stone-50/60 align-top">
                    <td className="px-5 py-3 whitespace-nowrap text-stone-600">{"★".repeat(r.rating)}</td>
                    <td className="max-w-[22rem] px-5 py-3">
                      {r.title && <p className="font-medium text-stone-900">{r.title}</p>}
                      <p className="line-clamp-2 text-xs text-stone-500">{r.quote}</p>
                    </td>
                    <td className="px-5 py-3 text-stone-600">
                      <ScopeLabel review={r} />
                    </td>
                    <td className="px-5 py-3 text-stone-600">{r.authorName}</td>
                    <td className="px-5 py-3">
                      <Badge status={r.status}>{r.status.charAt(0) + r.status.slice(1).toLowerCase()}</Badge>
                    </td>
                    {canEdit && (
                      <td className="px-5 py-3 text-right whitespace-nowrap">
                        {r.status === "PENDING" && (
                          <>
                            <button
                              onClick={() => handleApprove(r.id)}
                              disabled={actioningId === r.id}
                              className="mr-3 font-medium text-emerald-700 hover:text-emerald-900 disabled:opacity-50"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(r.id)}
                              disabled={actioningId === r.id}
                              className="mr-3 font-medium text-amber-700 hover:text-amber-900 disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        <button onClick={() => startEdit(r)} className="mr-3 text-teal-700 hover:text-teal-900">
                          Edit
                        </button>
                        <button onClick={() => handleDelete(r.id)} className="text-rose-600 hover:text-rose-800">
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
