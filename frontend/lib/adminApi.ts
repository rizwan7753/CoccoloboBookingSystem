import { Excursion, Booking } from "./api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

export const ADMIN_ROLES = ["SUPER_ADMIN", "LOCATION_MANAGER", "BOOKING_STAFF", "FINANCE", "TRAVEL_AGENT"] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

export const ROLE_LABELS: Record<AdminRole, string> = {
  SUPER_ADMIN: "Super Admin",
  LOCATION_MANAGER: "Location Manager",
  BOOKING_STAFF: "Booking Staff / Concierge",
  FINANCE: "Finance / Reporting",
  TRAVEL_AGENT: "Travel Agent (external)",
};

export interface AdminSession {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  locationId: string | null;
}

export interface AdminExcursionInput {
  locationId: string;
  title: string;
  slug: string;
  description: string;
  included?: string;
  excluded?: string;
  whatToBring?: string;
  meetingPoint?: string;
  durationMinutes: number;
  pricingType?: "PER_GUEST" | "FLAT_RATE";
  priceAdult: number;
  priceChild?: number;
  capacityDefault: number;
  cutoffTime: string;
  status: string;
  departureTimes: { time: string; daysOfWeek: number[] }[];
  cardImageUrl?: string;
  headerImageUrl?: string;
}

export interface AdminRentalSpot {
  id: string;
  rentalItemId: string;
  code: string;
  quantity: number;
  isActive: boolean;
}

export interface AdminRentalTimeSlot {
  id: string;
  rentalItemId: string;
  label: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

export interface AdminRentalItem {
  id: string;
  locationId: string;
  name: string;
  slug: string;
  description: string;
  durationMinutes: number;
  priceAdult: string;
  priceChild?: string | null;
  status: string;
  cardImageUrl?: string | null;
  headerImageUrl?: string | null;
  spots?: AdminRentalSpot[];
  timeSlots?: AdminRentalTimeSlot[];
  _count?: { bookings: number };
}

export interface AdminRentalItemInput {
  locationId: string;
  name: string;
  slug: string;
  description: string;
  durationMinutes?: number;
  priceAdult: number;
  priceChild?: number;
  status: string;
  cardImageUrl?: string;
  headerImageUrl?: string;
}

export interface AdminRentalBooking {
  id: string;
  rentalItemId: string;
  spotId: string;
  timeSlotId: string;
  date: string;
  guestName: string;
  guestEmail: string;
  guestPhone?: string | null;
  roomNumber?: string | null;
  adultCount: number;
  childCount: number;
  quantity: number;
  amountTotal: string;
  status: string;
  paymentStatus: string;
  paymentMethod?: string | null;
  spot: AdminRentalSpot;
  timeSlot: AdminRentalTimeSlot;
  rentalItem: { id: string; name: string };
}

export interface AdminEventTier {
  id: string;
  eventId: string;
  name: string;
  description?: string | null;
  price: string;
  capacity: number;
  isActive: boolean;
}

export interface AdminEvent {
  id: string;
  locationId: string;
  title: string;
  slug: string;
  description: string;
  eventDate: string;
  startTime: string;
  endTime?: string | null;
  venue?: string | null;
  mapUrl?: string | null;
  status: string;
  cardImageUrl?: string | null;
  headerImageUrl?: string | null;
  ticketTiers?: AdminEventTier[];
  _count?: { bookings: number };
}

export interface AdminEventInput {
  locationId: string;
  title: string;
  slug: string;
  description: string;
  eventDate: string;
  startTime: string;
  endTime?: string;
  venue?: string;
  mapUrl?: string;
  status: string;
  cardImageUrl?: string;
  headerImageUrl?: string;
}

export interface AdminEventBooking {
  id: string;
  eventId: string;
  tierId: string;
  guestName: string;
  guestEmail: string;
  guestPhone?: string | null;
  roomNumber?: string | null;
  quantity: number;
  amountTotal: string;
  status: string;
  paymentStatus: string;
  paymentMethod?: string | null;
  tier: AdminEventTier;
  event: { id: string; title: string; eventDate: string };
}

export interface AdminHoliday {
  id: string;
  locationId: string;
  date: string;
  label: string;
  appliesToExcursions: boolean;
  appliesToRentals: boolean;
  appliesToEvents: boolean;
}

export interface AdminHolidayInput {
  locationId: string;
  date: string;
  label: string;
  appliesToExcursions?: boolean;
  appliesToRentals?: boolean;
  appliesToEvents?: boolean;
}

export interface AdminSettings {
  id: string;
  name: string;
  timezone: string;
  currency: string;
  smtpHost?: string | null;
  smtpPort?: number | null;
  smtpUsername?: string | null;
  smtpFromEmail?: string | null;
  smtpFromName?: string | null;
  smtpSecure: boolean;
  smtpPasswordSet: boolean;
  stripeEnabled: boolean;
  offlinePaymentEnabled: boolean;
  offlinePaymentInstructions?: string | null;
  offlinePaymentReceiptEmail?: string | null;
  stripePublishableKey?: string | null;
  stripeSecretKeySet: boolean;
  stripeWebhookSecretSet: boolean;
}

export interface AdminSettingsInput {
  name?: string;
  timezone?: string;
  currency?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUsername?: string;
  smtpPassword?: string; // blank/omitted = keep existing password
  smtpFromEmail?: string;
  smtpFromName?: string;
  smtpSecure?: boolean;
  stripeEnabled?: boolean;
  offlinePaymentEnabled?: boolean;
  offlinePaymentInstructions?: string;
  offlinePaymentReceiptEmail?: string;
  stripePublishableKey?: string;
  stripeSecretKey?: string; // blank/omitted = keep existing
  stripeWebhookSecret?: string; // blank/omitted = keep existing
}

export interface AdminUserSummary {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  locationId: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface AdminUserInput {
  name: string;
  email: string;
  password: string;
  role: AdminRole;
  locationId?: string | null;
}

export interface AdminUserUpdateInput {
  name?: string;
  role?: AdminRole;
  locationId?: string | null;
  isActive?: boolean;
  password?: string;
}

export interface Location {
  id: string;
  name: string;
  timezone: string;
  currency: string;
}

export interface AuditLogEntry {
  id: string;
  adminUserId: string | null;
  actorLabel: string;
  action: string;
  entityType: string;
  entityId: string;
  detail: unknown;
  createdAt: string;
}

export interface DashboardDay {
  date: string;
  bookingCount: number;
  guestCount: number;
  revenue: number;
  departures: number;
  excursionBookings: number;
  rentalBookings: number;
  eventBookings: number;
}

export interface DashboardSummary {
  kpis: {
    activeExcursions: number;
    activeRentalItems: number;
    scheduledToday: number;
    upcomingBookings: number;
    upcomingGuests: number;
    upcomingRevenuePaid: number;
  };
  days: DashboardDay[];
}

interface LoginResponse {
  token: string;
  admin: AdminSession;
}

interface ManifestResponse {
  slot: { id: string; date: string; time: string; capacity: number; bookedCount: number } | null;
  bookings: Booking[];
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("admin_token");
}

export function getStoredAdmin(): AdminSession | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("admin_user");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AdminSession;
  } catch {
    return null;
  }
}

export function setSession(token: string, admin: AdminSession) {
  localStorage.setItem("admin_token", token);
  localStorage.setItem("admin_user", JSON.stringify(admin));
}

export function clearSession() {
  localStorage.removeItem("admin_token");
  localStorage.removeItem("admin_user");
}

/** Roles allowed to edit excursions/schedule/capacity (spec §14). */
export function canEditExcursions(role: AdminRole | undefined): boolean {
  return role === "SUPER_ADMIN" || role === "LOCATION_MANAGER";
}

/** Roles allowed to cancel bookings — Finance is view-only (spec §14). */
export function canCancelBookings(role: AdminRole | undefined): boolean {
  return role === "SUPER_ADMIN" || role === "LOCATION_MANAGER" || role === "BOOKING_STAFF";
}

/** Staff/role management is Super Admin only (spec §14). */
export function canManageUsers(role: AdminRole | undefined): boolean {
  return role === "SUPER_ADMIN";
}

async function authedRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers || {}),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    // Expired/invalid token: bounce to login instead of letting the error
    // surface as an unhandled-rejection crash on whatever page called this.
    if (res.status === 401 && typeof window !== "undefined") {
      clearSession();
      if (window.location.pathname !== "/admin/login") {
        window.location.href = "/admin/login";
        // Navigation is in flight — return a promise that never resolves so
        // the calling page's .then()/setState never runs against stale data.
        return new Promise<T>(() => {});
      }
    }
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// Separate from authedRequest — a FormData body must NOT get an explicit
// Content-Type header (the browser generates the multipart boundary itself),
// but authedRequest always sets "Content-Type: application/json".
async function authedUpload(file: File): Promise<{ url: string }> {
  const token = getToken();
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(`${API_URL}/admin/uploads`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: fd,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Upload failed: ${res.status}`);
  }
  return res.json();
}

// Export endpoints require the Bearer token, so a plain <a href> download
// won't work (the browser navigation carries no auth header) — fetch the
// file as a blob instead and trigger the download via a temporary object URL.
async function authedDownload(path: string, params: Record<string, string | undefined>) {
  const token = getToken();
  const query = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== "")) as Record<
      string,
      string
    >
  );
  const res = await fetch(`${API_URL}${path}?${query}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Export failed: ${res.status}`);
  }
  const disposition = res.headers.get("Content-Disposition") || "";
  const filename = /filename="([^"]+)"/.exec(disposition)?.[1] || "export.xlsx";
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export const adminApi = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || "Login failed");
    }
    return res.json();
  },
  listExcursions: () => authedRequest<Excursion[]>("/admin/excursions"),
  getExcursion: (id: string) => authedRequest<Excursion>(`/admin/excursions/${id}`),
  createExcursion: (data: AdminExcursionInput) =>
    authedRequest<Excursion>("/admin/excursions", { method: "POST", body: JSON.stringify(data) }),
  updateExcursion: (id: string, data: Partial<AdminExcursionInput>) =>
    authedRequest<Excursion>(`/admin/excursions/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteExcursion: (id: string) => authedRequest<void>(`/admin/excursions/${id}`, { method: "DELETE" }),
  listBookings: (params: Record<string, string>) =>
    authedRequest<Booking[]>(`/admin/bookings?${new URLSearchParams(params)}`),
  getManifest: (excursionId: string, date: string, time: string) =>
    authedRequest<ManifestResponse>(
      `/admin/bookings/manifest?${new URLSearchParams({ excursionId, date, time })}`
    ),
  cancelBooking: (id: string, reason?: string) =>
    authedRequest<void>(`/admin/bookings/${id}/cancel`, { method: "POST", body: JSON.stringify({ reason }) }),
  markBookingPaid: (id: string) => authedRequest<Booking>(`/admin/bookings/${id}/mark-paid`, { method: "POST" }),
  exportBookings: (params: { excursionId?: string; from: string; to?: string; status?: string }) =>
    authedDownload("/admin/bookings/export", params),

  listLocations: () => authedRequest<Location[]>("/admin/locations"),
  uploadImage: (file: File) => authedUpload(file),

  listRentals: () => authedRequest<AdminRentalItem[]>("/admin/rentals"),
  getRental: (id: string) => authedRequest<AdminRentalItem>(`/admin/rentals/${id}`),
  createRental: (data: AdminRentalItemInput) =>
    authedRequest<AdminRentalItem>("/admin/rentals", { method: "POST", body: JSON.stringify(data) }),
  updateRental: (id: string, data: Partial<AdminRentalItemInput>) =>
    authedRequest<AdminRentalItem>(`/admin/rentals/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteRental: (id: string) => authedRequest<void>(`/admin/rentals/${id}`, { method: "DELETE" }),
  addRentalSpot: (rentalId: string, code: string, quantity: number) =>
    authedRequest<AdminRentalSpot>(`/admin/rentals/${rentalId}/spots`, {
      method: "POST",
      body: JSON.stringify({ code, quantity }),
    }),
  updateRentalSpot: (spotId: string, data: { code?: string; quantity?: number; isActive?: boolean }) =>
    authedRequest<AdminRentalSpot>(`/admin/rentals/spots/${spotId}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteRentalSpot: (spotId: string) => authedRequest<void>(`/admin/rentals/spots/${spotId}`, { method: "DELETE" }),

  addRentalTimeSlot: (rentalId: string, data: { label: string; startTime: string; endTime: string }) =>
    authedRequest<AdminRentalTimeSlot>(`/admin/rentals/${rentalId}/time-slots`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  generateRentalTimeSlots: (rentalId: string, data: { operatingStart: string; operatingEnd: string }) =>
    authedRequest<{ created: AdminRentalTimeSlot[]; skipped: string[] }>(
      `/admin/rentals/${rentalId}/time-slots/generate`,
      { method: "POST", body: JSON.stringify(data) }
    ),
  updateRentalTimeSlot: (
    timeSlotId: string,
    data: { label?: string; startTime?: string; endTime?: string; isActive?: boolean }
  ) =>
    authedRequest<AdminRentalTimeSlot>(`/admin/rentals/time-slots/${timeSlotId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteRentalTimeSlot: (timeSlotId: string) =>
    authedRequest<void>(`/admin/rentals/time-slots/${timeSlotId}`, { method: "DELETE" }),

  listRentalBookings: (params: { rentalItemId?: string; from: string; to?: string; timeSlotId?: string }) =>
    authedRequest<AdminRentalBooking[]>(
      `/admin/rental-bookings?${new URLSearchParams(
        Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== "")) as Record<
          string,
          string
        >
      )}`
    ),
  cancelRentalBooking: (id: string, reason?: string) =>
    authedRequest<void>(`/admin/rental-bookings/${id}/cancel`, { method: "POST", body: JSON.stringify({ reason }) }),
  markRentalBookingPaid: (id: string) =>
    authedRequest<AdminRentalBooking>(`/admin/rental-bookings/${id}/mark-paid`, { method: "POST" }),
  exportRentalBookings: (params: { rentalItemId?: string; from: string; to?: string; timeSlotId?: string }) =>
    authedDownload("/admin/rental-bookings/export", params),

  listEvents: () => authedRequest<AdminEvent[]>("/admin/events"),
  getEvent: (id: string) => authedRequest<AdminEvent>(`/admin/events/${id}`),
  createEvent: (data: AdminEventInput) =>
    authedRequest<AdminEvent>("/admin/events", { method: "POST", body: JSON.stringify(data) }),
  updateEvent: (id: string, data: Partial<AdminEventInput>) =>
    authedRequest<AdminEvent>(`/admin/events/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteEvent: (id: string) => authedRequest<void>(`/admin/events/${id}`, { method: "DELETE" }),
  addEventTier: (eventId: string, data: { name: string; description?: string; price: number; capacity: number }) =>
    authedRequest<AdminEventTier>(`/admin/events/${eventId}/tiers`, { method: "POST", body: JSON.stringify(data) }),
  updateEventTier: (
    tierId: string,
    data: { name?: string; description?: string; price?: number; capacity?: number; isActive?: boolean }
  ) => authedRequest<AdminEventTier>(`/admin/events/tiers/${tierId}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteEventTier: (tierId: string) => authedRequest<void>(`/admin/events/tiers/${tierId}`, { method: "DELETE" }),

  listEventBookings: (params: { eventId?: string; from: string; to?: string }) =>
    authedRequest<AdminEventBooking[]>(
      `/admin/event-bookings?${new URLSearchParams(
        Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== "")) as Record<
          string,
          string
        >
      )}`
    ),
  cancelEventBooking: (id: string, reason?: string) =>
    authedRequest<void>(`/admin/event-bookings/${id}/cancel`, { method: "POST", body: JSON.stringify({ reason }) }),
  markEventBookingPaid: (id: string) =>
    authedRequest<AdminEventBooking>(`/admin/event-bookings/${id}/mark-paid`, { method: "POST" }),
  exportEventBookings: (params: { eventId?: string; from: string; to?: string }) =>
    authedDownload("/admin/event-bookings/export", params),

  listHolidays: () => authedRequest<AdminHoliday[]>("/admin/holidays"),
  createHoliday: (data: AdminHolidayInput) =>
    authedRequest<AdminHoliday>("/admin/holidays", { method: "POST", body: JSON.stringify(data) }),
  updateHoliday: (
    id: string,
    data: { label?: string; appliesToExcursions?: boolean; appliesToRentals?: boolean; appliesToEvents?: boolean }
  ) => authedRequest<AdminHoliday>(`/admin/holidays/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteHoliday: (id: string) => authedRequest<void>(`/admin/holidays/${id}`, { method: "DELETE" }),

  getSettings: () => authedRequest<AdminSettings>("/admin/settings"),
  updateSettings: (data: AdminSettingsInput) =>
    authedRequest<AdminSettings>("/admin/settings", { method: "PUT", body: JSON.stringify(data) }),
  sendTestEmail: (to: string) =>
    authedRequest<{ ok: true }>("/admin/settings/test-email", { method: "POST", body: JSON.stringify({ to }) }),

  listUsers: () => authedRequest<AdminUserSummary[]>("/admin/users"),
  createUser: (data: AdminUserInput) =>
    authedRequest<AdminUserSummary>("/admin/users", { method: "POST", body: JSON.stringify(data) }),
  updateUser: (id: string, data: AdminUserUpdateInput) =>
    authedRequest<AdminUserSummary>(`/admin/users/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteUser: (id: string) => authedRequest<void>(`/admin/users/${id}`, { method: "DELETE" }),

  getAuditLog: (params: Record<string, string> = {}) =>
    authedRequest<AuditLogEntry[]>(`/admin/audit-log?${new URLSearchParams(params)}`),

  getDashboardSummary: (from: string, to: string) =>
    authedRequest<DashboardSummary>(`/admin/dashboard/summary?${new URLSearchParams({ from, to })}`),
};
