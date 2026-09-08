"use client";

import { useEffect, useState } from "react";
import { adminApi, AdminRestaurantMenu, getStoredAdmin, canEditExcursions } from "@/lib/adminApi";
import { PageHeader, cardClass, inputClass, primaryButtonClass, Badge } from "@/components/admin/ui";
import ImageUploadField from "@/components/ImageUploadField";

const DEFAULT_LOCATION_ID = "carambola-main"; // MVP: single location, seeded in prisma/seed.ts

interface ItemDraft {
  name: string;
  description: string;
  price: string;
}

interface SectionDraft {
  heading: string;
  subheading: string;
  items: ItemDraft[];
}

const emptyItem = (): ItemDraft => ({ name: "", description: "", price: "" });
const emptySection = (): SectionDraft => ({ heading: "", subheading: "", items: [emptyItem()] });
const emptyForm = {
  title: "",
  slug: "",
  description: "",
  timings: "",
  imageUrl: "",
  sortOrder: 0,
  isActive: true,
  sections: [emptySection()],
};

export default function AdminRestaurantMenusPage() {
  const [menus, setMenus] = useState<AdminRestaurantMenu[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const canEdit = canEditExcursions(getStoredAdmin()?.role);

  function load() {
    adminApi
      .listRestaurantMenus()
      .then(setMenus)
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  function startCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
    setShowForm(true);
  }

  function startEdit(menu: AdminRestaurantMenu) {
    setEditingId(menu.id);
    setForm({
      title: menu.title,
      slug: menu.slug,
      description: menu.description ?? "",
      timings: menu.timings ?? "",
      imageUrl: menu.imageUrl ?? "",
      sortOrder: menu.sortOrder,
      isActive: menu.isActive,
      sections:
        menu.sections.length > 0
          ? menu.sections.map((s) => ({
              heading: s.heading,
              subheading: s.subheading ?? "",
              items:
                s.items.length > 0
                  ? s.items.map((it) => ({
                      name: it.name,
                      description: it.description ?? "",
                      price: it.price ?? "",
                    }))
                  : [emptyItem()],
            }))
          : [emptySection()],
    });
    setError(null);
    setShowForm(true);
  }

  function updateSection(index: number, patch: Partial<SectionDraft>) {
    setForm((f) => ({ ...f, sections: f.sections.map((s, i) => (i === index ? { ...s, ...patch } : s)) }));
  }

  function addSection() {
    setForm((f) => ({ ...f, sections: [...f.sections, emptySection()] }));
  }

  function removeSection(index: number) {
    setForm((f) => ({ ...f, sections: f.sections.filter((_, i) => i !== index) }));
  }

  function updateItem(sectionIndex: number, itemIndex: number, patch: Partial<ItemDraft>) {
    setForm((f) => ({
      ...f,
      sections: f.sections.map((s, i) =>
        i === sectionIndex ? { ...s, items: s.items.map((it, j) => (j === itemIndex ? { ...it, ...patch } : it)) } : s
      ),
    }));
  }

  function addItem(sectionIndex: number) {
    setForm((f) => ({
      ...f,
      sections: f.sections.map((s, i) => (i === sectionIndex ? { ...s, items: [...s.items, emptyItem()] } : s)),
    }));
  }

  function removeItem(sectionIndex: number, itemIndex: number) {
    setForm((f) => ({
      ...f,
      sections: f.sections.map((s, i) => (i === sectionIndex ? { ...s, items: s.items.filter((_, j) => j !== itemIndex) } : s)),
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const sections = form.sections
        .filter((s) => s.heading.trim())
        .map((s) => ({
          heading: s.heading.trim(),
          subheading: s.subheading.trim() || undefined,
          items: s.items
            .filter((it) => it.name.trim())
            .map((it) => ({
              name: it.name.trim(),
              description: it.description.trim() || undefined,
              price: it.price.trim() ? Number(it.price) : undefined,
            })),
        }));
      const payload = {
        title: form.title,
        slug: form.slug,
        description: form.description || undefined,
        timings: form.timings || undefined,
        imageUrl: form.imageUrl || undefined,
        sortOrder: form.sortOrder,
        isActive: form.isActive,
        sections,
      };
      if (editingId) {
        await adminApi.updateRestaurantMenu(editingId, payload);
      } else {
        await adminApi.createRestaurantMenu({ ...payload, locationId: DEFAULT_LOCATION_ID });
      }
      setShowForm(false);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save menu");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleActive(menu: AdminRestaurantMenu) {
    await adminApi.updateRestaurantMenu(menu.id, { isActive: !menu.isActive });
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this menu? This cannot be undone.")) return;
    await adminApi.deleteRestaurantMenu(id);
    load();
  }

  return (
    <div>
      <PageHeader
        title="Restaurant menus"
        description="Menus shown under the site's Restaurant dropdown — Dinner Menu, Lunch Menu, Children's Menu, Seasonal Specials, and so on. Each menu is made of sections (Seafood, Desserts…), and each section holds its own items."
        actions={
          canEdit && (
            <button onClick={showForm ? () => setShowForm(false) : startCreate} className={primaryButtonClass}>
              {showForm ? "Cancel" : "+ New menu"}
            </button>
          )
        }
      />

      {showForm && (
        <form onSubmit={handleSubmit} className={`${cardClass} mb-6 max-w-3xl space-y-5 p-5`}>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-700">Title</label>
              <input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Dinner Menu"
                required
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-700">Slug (URL)</label>
              <input
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                placeholder="dinner-menu"
                required
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-700">Description (optional)</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={2}
                placeholder="A short overview shown at the top of the menu page."
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-700">Timings (optional)</label>
              <input
                value={form.timings}
                onChange={(e) => setForm((f) => ({ ...f, timings: e.target.value }))}
                placeholder="7:00 AM – 11:00 AM"
                className={inputClass}
              />
            </div>
          </div>

          <ImageUploadField
            label="Photo (optional)"
            value={form.imageUrl}
            onChange={(url) => setForm((f) => ({ ...f, imageUrl: url }))}
            hint="Shown on the menu card and its detail page header. Landscape, at least 800x400px, works best."
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-700">Sort order</label>
              <input
                type="number"
                value={form.sortOrder}
                onChange={(e) => setForm((f) => ({ ...f, sortOrder: Number(e.target.value) }))}
                className={inputClass}
              />
              <p className="mt-1 text-xs text-stone-400">Lower numbers show first.</p>
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 text-sm text-stone-700">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                />
                Visible on the site
              </label>
            </div>
          </div>

          <div className="space-y-4 border-t border-stone-100 pt-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-stone-900">Sections</h3>
              <button type="button" onClick={addSection} className="text-sm font-medium text-teal-700 hover:text-teal-900">
                + Add section
              </button>
            </div>

            {form.sections.map((section, sectionIndex) => (
              <div key={sectionIndex} className="rounded-xl border border-stone-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="grid flex-1 grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-stone-500">Heading</label>
                      <input
                        value={section.heading}
                        onChange={(e) => updateSection(sectionIndex, { heading: e.target.value })}
                        placeholder="Seafood"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-stone-500">Subheading (optional)</label>
                      <input
                        value={section.subheading}
                        onChange={(e) => updateSection(sectionIndex, { subheading: e.target.value })}
                        placeholder="Fresh from the ocean"
                        className={inputClass}
                      />
                    </div>
                  </div>
                  {form.sections.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSection(sectionIndex)}
                      className="mt-5 text-xs font-medium text-rose-600 hover:text-rose-800"
                    >
                      Remove section
                    </button>
                  )}
                </div>

                <div className="mt-4 space-y-3">
                  {section.items.map((item, itemIndex) => (
                    <div key={itemIndex} className="grid grid-cols-12 items-start gap-2 rounded-lg bg-stone-50 p-3">
                      <div className="col-span-4">
                        <label className="mb-1 block text-xs font-medium text-stone-500">Item name</label>
                        <input
                          value={item.name}
                          onChange={(e) => updateItem(sectionIndex, itemIndex, { name: e.target.value })}
                          placeholder="Tender Octopus and Fennel"
                          className={inputClass}
                        />
                      </div>
                      <div className="col-span-5">
                        <label className="mb-1 block text-xs font-medium text-stone-500">Description (optional)</label>
                        <input
                          value={item.description}
                          onChange={(e) => updateItem(sectionIndex, itemIndex, { description: e.target.value })}
                          placeholder="Citrus, wild rocket condiment."
                          className={inputClass}
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="mb-1 block text-xs font-medium text-stone-500">Price (optional)</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.price}
                          onChange={(e) => updateItem(sectionIndex, itemIndex, { price: e.target.value })}
                          placeholder="25"
                          className={inputClass}
                        />
                      </div>
                      <div className="col-span-1 flex items-end pb-1.5">
                        {section.items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItem(sectionIndex, itemIndex)}
                            aria-label="Remove item"
                            className="text-rose-500 hover:text-rose-700"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addItem(sectionIndex)}
                    className="text-xs font-medium text-teal-700 hover:text-teal-900"
                  >
                    + Add item
                  </button>
                </div>
              </div>
            ))}
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button type="submit" disabled={submitting} className={primaryButtonClass}>
            {submitting ? "Saving…" : editingId ? "Save changes" : "Create menu"}
          </button>
        </form>
      )}

      <div className={`${cardClass} overflow-hidden`}>
        {loading ? (
          <p className="p-6 text-sm text-stone-400">Loading…</p>
        ) : menus.length === 0 ? (
          <p className="p-6 text-sm text-stone-400">No menus yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-left text-sm">
              <thead className="border-b border-stone-100 text-xs uppercase tracking-wide text-stone-400">
                <tr>
                  <th className="px-5 py-3 font-medium">Title</th>
                  <th className="px-5 py-3 font-medium">Slug</th>
                  <th className="px-5 py-3 font-medium">Sections</th>
                  <th className="px-5 py-3 font-medium">Order</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  {canEdit && <th className="px-5 py-3"></th>}
                </tr>
              </thead>
              <tbody>
                {menus.map((menu) => (
                  <tr key={menu.id} className="border-b border-stone-50 last:border-0 hover:bg-stone-50/60">
                    <td className="px-5 py-3 font-medium text-stone-900">{menu.title}</td>
                    <td className="px-5 py-3 font-mono text-xs text-stone-500">{menu.slug}</td>
                    <td className="px-5 py-3 text-stone-600">
                      {menu.sections.length === 0 ? "—" : menu.sections.map((s) => s.heading).join(", ")}
                    </td>
                    <td className="px-5 py-3 text-stone-600">{menu.sortOrder}</td>
                    <td className="px-5 py-3">
                      <button onClick={() => canEdit && handleToggleActive(menu)} disabled={!canEdit}>
                        <Badge status={menu.isActive ? "ACTIVE" : "INACTIVE"} />
                      </button>
                    </td>
                    {canEdit && (
                      <td className="px-5 py-3 text-right">
                        <button onClick={() => startEdit(menu)} className="mr-3 text-teal-700 hover:text-teal-900">
                          Edit
                        </button>
                        <button onClick={() => handleDelete(menu.id)} className="text-rose-600 hover:text-rose-800">
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
