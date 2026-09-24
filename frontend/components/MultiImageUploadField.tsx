"use client";

import { useState } from "react";
import { adminApi } from "@/lib/adminApi";
import { mediaUrl } from "@/lib/media";
import { inputClass } from "@/components/admin/ui";

/** Gallery upload — several photos per item (as opposed to ImageUploadField's
 *  single card/header image slot). Each file uploads through the same
 *  admin upload endpoint; the resulting URLs are kept as a plain string
 *  array on the parent form's state. Reorder via the ‹ › buttons since
 *  drag-and-drop isn't worth the extra dependency for this. */
export default function MultiImageUploadField({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: string[];
  onChange: (urls: string[]) => void;
  hint?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFilesChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setUploading(true);
    setError(null);
    try {
      const uploaded: string[] = [];
      for (const file of files) {
        const { url } = await adminApi.uploadImage(file);
        uploaded.push(url);
      }
      onChange([...value, ...uploaded]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  function remove(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= value.length) return;
    const next = [...value];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-stone-700">{label}</label>
      {hint && <p className="mb-1.5 text-xs text-stone-400">{hint}</p>}

      {value.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {value.map((url, i) => (
            <div key={url + i} className="group relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={mediaUrl(url) ?? undefined} alt="" className="h-20 w-20 rounded-md border border-stone-200 object-cover" />
              <div className="absolute inset-x-0 -top-1 flex justify-center gap-0.5 opacity-0 transition group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-stone-700 shadow disabled:opacity-30"
                  aria-label="Move earlier"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === value.length - 1}
                  className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-stone-700 shadow disabled:opacity-30"
                  aria-label="Move later"
                >
                  ›
                </button>
              </div>
              <button
                type="button"
                onClick={() => remove(i)}
                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-xs text-white shadow"
                aria-label="Remove image"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={handleFilesChange} disabled={uploading} className={inputClass} />
      {uploading && <p className="mt-1 text-xs text-stone-400">Uploading…</p>}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
