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
    return <span className="text-admin-faint">General (homepage)</span>;
  }
  return (
    <span>
      <span className="text-admin-faint">{ITEM_TYPE_LABELS[review.itemType] ?? review.itemType}:</span> {review.itemTitle}
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

      <div className="mb-4 flex gap-1 border-b border-admin-line">
        <button
          onClick={() => setTab("pending")}
          className={`px-4 py-2 text-sm font-medium ${tab === "pending" ? "border-b-2 border-admin-primary text-admin-primary-ink" : "text-admin-muted hover:text-admin-ink"}`}
        >
          Pending {pending.length > 0 && <span className="ml-1 rounded-full bg-admin-warning-tint px-1.5 py-0.5 text-xs text-admin-cat-rental-ink">{pending.length}</span>}
        </button>
        <button
          onClick={() => setTab("all")}
          className={`px-4 py-2 text-sm font-medium ${tab === "all" ? "border-b-2 border-admin-primary text-admin-primary-ink" : "text-admin-muted hover:text-admin-ink"}`}
        >
          All reviews
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className={`${cardClass} mb-6 max-w-2xl space-y-4 p-5`}>
          <p className="text-xs text-admin-faint">
            This adds a general testimonial shown on the homepage. Reviews scoped to a specific excursion/chair/event come from guests via that
            item&apos;s page — approve or reject those instead of creating them here.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-admin-ink-soft">Rating</label>
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
              <label className="mb-1 block text-sm font-medium text-admin-ink-soft">Status</label>
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
            <label className="mb-1 block text-sm font-medium text-admin-ink-soft">Title (optional)</label>
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Worth every dollar of the cabana"
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-admin-ink-soft">Quote</label>
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
              <label className="mb-1 block text-sm font-medium text-admin-ink-soft">Author name</label>
              <input
                value={form.authorName}
                onChange={(e) => setForm((f) => ({ ...f, authorName: e.target.value }))}
                placeholder="Marcus D."
                required
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-admin-ink-soft">Initials (optional)</label>
              <input
                value={form.authorInitials}
                onChange={(e) => setForm((f) => ({ ...f, authorInitials: e.target.value }))}
                placeholder="MD"
                maxLength={3}
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-admin-ink-soft">Meta (optional)</label>
              <input
                value={form.authorMeta}
                onChange={(e) => setForm((f) => ({ ...f, authorMeta: e.target.value }))}
                placeholder="Tampa, FL · August 2026"
                className={inputClass}
              />
            </div>
          </div>

          {error && <p className="text-sm text-admin-danger-ink">{error}</p>}

          <div className="flex gap-2">
            <button type="submit" disabled={submitting} className={primaryButtonClass}>
              {submitting ? "Saving…" : editingId ? "Save changes" : "Add review"}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="rounded-lg px-4 py-2 text-sm font-medium text-admin-muted hover:bg-admin-surface-sunk">
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className={`${cardClass} overflow-hidden`}>
        {loading ? (
          <p className="p-6 text-sm text-admin-faint">Loading…</p>
        ) : visible.length === 0 ? (
          <p className="p-6 text-sm text-admin-faint">
            {tab === "pending" ? "No reviews waiting on approval." : "No reviews yet."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[750px] text-left text-sm">
              <thead className="border-b border-admin-line-soft text-xs uppercase tracking-wide text-admin-faint">
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
                  <tr key={r.id} className="border-b border-admin-line-soft last:border-0 hover:bg-admin-surface-soft align-top">
                    <td className="px-5 py-3 whitespace-nowrap text-admin-muted">{"★".repeat(r.rating)}</td>
                    <td className="max-w-[22rem] px-5 py-3">
                      {r.title && <p className="font-medium text-admin-ink">{r.title}</p>}
                      <p className="line-clamp-2 text-xs text-admin-muted">{r.quote}</p>
                    </td>
                    <td className="px-5 py-3 text-admin-muted">
                      <ScopeLabel review={r} />
                    </td>
                    <td className="px-5 py-3 text-admin-muted">{r.authorName}</td>
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
                              className="mr-3 font-medium text-admin-success-ink hover:text-admin-success-ink disabled:opacity-50"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(r.id)}
                              disabled={actioningId === r.id}
                              className="mr-3 font-medium text-admin-warning-ink hover:text-admin-warning-ink disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        <button onClick={() => startEdit(r)} className="mr-3 text-admin-primary-ink hover:text-admin-primary-ink">
                          Edit
                        </button>
                        <button onClick={() => handleDelete(r.id)} className="text-admin-danger-ink hover:text-admin-danger-ink">
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
