"use client";

import { useState } from "react";
import { adminApi } from "@/lib/adminApi";
import { mediaUrl } from "@/lib/media";
import { inputClass } from "@/components/admin/ui";

export default function ImageUploadField({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: string | undefined;
  onChange: (url: string) => void;
  /** Recommended size/ratio for this slot — images are cropped to fill, not resized, so this matters. */
  hint?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const { url } = await adminApi.uploadImage(file);
      onChange(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-stone-700">{label}</label>
      {hint && <p className="mb-1.5 text-xs text-stone-400">{hint}</p>}
      <div className="flex items-center gap-3">
        {value && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={mediaUrl(value) ?? undefined} alt={label} className="h-16 w-24 rounded-md border border-stone-200 object-cover" />
        )}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          disabled={uploading}
          className={inputClass}
        />
      </div>
      {uploading && <p className="mt-1 text-xs text-stone-400">Uploading…</p>}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
