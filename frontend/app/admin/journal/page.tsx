"use client";

import { useEffect, useState } from "react";
import { adminApi, AdminBlogPost, getStoredAdmin, canManageContent } from "@/lib/adminApi";
import { PageHeader, cardClass, inputClass, primaryButtonClass, Badge } from "@/components/admin/ui";
import ImageUploadField from "@/components/ImageUploadField";
import { slugify } from "@/lib/slugify";

const emptyForm = {
  title: "",
  slug: "",
  excerpt: "",
  body: "",
  imageUrl: "",
  readMinutes: "",
  status: "DRAFT" as "DRAFT" | "PUBLISHED",
};

export default function AdminJournalPage() {
  const [posts, setPosts] = useState<AdminBlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [slugTouched, setSlugTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const canEdit = canManageContent(getStoredAdmin()?.permissions);

  function load() {
    adminApi
      .listBlogPosts()
      .then(setPosts)
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  function handleTitleChange(value: string) {
    setForm((f) => ({ ...f, title: value, slug: slugTouched ? f.slug : slugify(value) }));
  }

  function startCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setSlugTouched(false);
    setError(null);
    setShowForm(true);
  }

  function startEdit(post: AdminBlogPost) {
    setEditingId(post.id);
    setSlugTouched(true);
    setForm({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      body: post.body ?? "",
      imageUrl: post.imageUrl ?? "",
      readMinutes: post.readMinutes?.toString() ?? "",
      status: post.status,
    });
    setError(null);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const payload = {
      title: form.title.trim(),
      slug: form.slug.trim(),
      excerpt: form.excerpt.trim(),
      body: form.body.trim() || undefined,
      imageUrl: form.imageUrl || undefined,
      readMinutes: form.readMinutes.trim() ? Number(form.readMinutes) : undefined,
      status: form.status,
    };
    try {
      if (editingId) {
        await adminApi.updateBlogPost(editingId, payload);
      } else {
        await adminApi.createBlogPost(payload);
      }
      setShowForm(false);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save post");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this journal post? This can't be undone.")) return;
    await adminApi.deleteBlogPost(id);
    setPosts((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <div>
      <PageHeader
        title="Journal posts"
        description="Articles shown in the homepage 'From the journal' section, each with its own page at /journal/:slug. Draft posts are saved but not shown to guests."
        actions={
          canEdit && !showForm ? (
            <button onClick={startCreate} className={primaryButtonClass}>
              Add post
            </button>
          ) : undefined
        }
      />

      {showForm && (
        <form onSubmit={handleSubmit} className={`${cardClass} mb-6 max-w-2xl space-y-4 p-5`}>
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">Title</label>
            <input value={form.title} onChange={(e) => handleTitleChange(e.target.value)} required className={inputClass} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">Slug (URL)</label>
            <input
              value={form.slug}
              onChange={(e) => {
                setForm((f) => ({ ...f, slug: e.target.value }));
                setSlugTouched(true);
              }}
              required
              className={inputClass}
            />
            <p className="mt-1 text-xs text-stone-400">Auto-generated from the title — edit if you want a different URL.</p>
          </div>

          <ImageUploadField
            label="Cover image"
            value={form.imageUrl}
            onChange={(url) => setForm((f) => ({ ...f, imageUrl: url }))}
            hint="Recommended: 1200×800px landscape (3:2), under 500KB."
          />

          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">Excerpt</label>
            <textarea
              value={form.excerpt}
              onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
              rows={3}
              required
              className={inputClass}
              placeholder="Shown on the homepage card and at the top of the full post."
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">Body (optional)</label>
            <textarea
              value={form.body}
              onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
              rows={8}
              className={inputClass}
              placeholder="Full article text, shown below the excerpt on the post's own page. Leave blank for an excerpt-only post."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-700">Read time, minutes (optional)</label>
              <input
                type="number"
                min={1}
                value={form.readMinutes}
                onChange={(e) => setForm((f) => ({ ...f, readMinutes: e.target.value }))}
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-700">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as "DRAFT" | "PUBLISHED" }))}
                className={inputClass}
              >
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
              </select>
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-2">
            <button type="submit" disabled={submitting} className={primaryButtonClass}>
              {submitting ? "Saving…" : editingId ? "Save changes" : "Add post"}
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
        ) : posts.length === 0 ? (
          <p className="p-6 text-sm text-stone-400">No journal posts yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-left text-sm">
              <thead className="border-b border-stone-100 text-xs uppercase tracking-wide text-stone-400">
                <tr>
                  <th className="px-5 py-3 font-medium">Title</th>
                  <th className="px-5 py-3 font-medium">Slug</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  {canEdit && <th className="px-5 py-3"></th>}
                </tr>
              </thead>
              <tbody>
                {posts.map((p) => (
                  <tr key={p.id} className="border-b border-stone-50 last:border-0 hover:bg-stone-50/60">
                    <td className="px-5 py-3 font-medium text-stone-900">{p.title}</td>
                    <td className="px-5 py-3 font-mono text-xs text-stone-500">{p.slug}</td>
                    <td className="px-5 py-3">
                      <Badge status={p.status}>{p.status === "PUBLISHED" ? "Published" : "Draft"}</Badge>
                    </td>
                    {canEdit && (
                      <td className="px-5 py-3 text-right">
                        <button onClick={() => startEdit(p)} className="mr-3 text-teal-700 hover:text-teal-900">
                          Edit
                        </button>
                        <button onClick={() => handleDelete(p.id)} className="text-rose-600 hover:text-rose-800">
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
