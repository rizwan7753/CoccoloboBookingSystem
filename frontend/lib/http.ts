export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

// Friendlier labels for the zod field names used across the booking/order
// schemas — falls back to a humanized version of the raw field name (e.g.
// "roomNumber" -> "Room number") for anything not listed here.
const FIELD_LABELS: Record<string, string> = {
  guestName: "Full name",
  guestEmail: "Email",
  guestPhone: "Phone",
  roomNumber: "Room / villa number",
};

function humanizeField(field: string): string {
  if (FIELD_LABELS[field]) return FIELD_LABELS[field];
  return field.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, (c) => c.toUpperCase());
}

/**
 * Backend validation failures come back as `{ error: "Invalid input", details:
 * zod's .flatten() }` — surfacing just `error` (as the old behavior did)
 * always shows the same unhelpful "Invalid input" regardless of which field
 * or rule failed. This picks the first field-specific message instead, e.g.
 * "Email: Invalid email" instead of "Invalid input".
 */
function messageFromErrorBody(body: any, fallback: string): string {
  const fieldErrors = body?.details?.fieldErrors;
  if (fieldErrors && typeof fieldErrors === "object") {
    for (const [field, messages] of Object.entries(fieldErrors)) {
      if (Array.isArray(messages) && messages.length > 0) {
        return `${humanizeField(field)}: ${messages[0]}`;
      }
    }
  }
  const formErrors = body?.details?.formErrors;
  if (Array.isArray(formErrors) && formErrors.length > 0) return formErrors[0];
  return body?.error || fallback;
}

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(messageFromErrorBody(body, `Request failed: ${res.status}`));
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}
