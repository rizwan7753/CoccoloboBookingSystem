// Uploaded images are stored on the backend and returned as a relative path
// (e.g. "/uploads/images/xyz.jpg"). The frontend and backend live on
// different origins in production, so this resolves that path against the
// backend's own origin (derived from NEXT_PUBLIC_API_URL) rather than the
// frontend's — a bare relative <img src> would otherwise 404 against the
// wrong domain.
export function mediaUrl(path?: string | null): string | null {
  if (!path) return null;
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
  const origin = apiBase.replace(/\/api\/?$/, "");
  return `${origin}${path}`;
}
