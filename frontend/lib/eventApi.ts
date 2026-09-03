const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

export interface EventItem {
  id: string;
  title: string;
  slug: string;
  description: string;
  images?: string[] | null;
  cardImageUrl?: string | null;
  headerImageUrl?: string | null;
  eventDate: string;
  startTime: string;
  endTime?: string | null;
  venue?: string | null;
  mapUrl?: string | null;
  status: string;
  holidayLabel?: string;
}

export interface TierAvailability {
  id: string;
  name: string;
  description: string | null;
  price: string;
  capacity: number;
  booked: number;
  remaining: number;
}

export interface EventBooking {
  id: string;
  bookingCode?: string | null;
  eventId: string;
  tierId: string;
  guestName: string;
  guestEmail: string;
  guestPhone?: string | null;
  roomNumber?: string | null;
  quantity: number;
  amountTotal: string;
  currency: string;
  status: string;
  paymentStatus: string;
  paymentMethod?: string | null;
  source: string;
  createdAt: string;
  event?: EventItem;
  tier?: { id: string; name: string };
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const eventApi = {
  listEvents: () => request<EventItem[]>("/events"),
  getEvent: (slug: string) => request<EventItem>(`/events/${slug}`),
  getAvailability: (eventId: string) => request<TierAvailability[]>(`/events/${eventId}/availability`),
  createBooking: (payload: {
    eventId: string;
    tierId: string;
    quantity: number;
    guestName: string;
    guestEmail: string;
    guestPhone?: string;
    roomNumber?: string;
    paymentMethod?: "stripe" | "offline" | "nmi";
  }) =>
    request<{
      bookingId: string;
      bookingCode?: string | null;
      amountTotal: string;
      clientSecret: string | null;
      devBypass?: boolean;
      offlinePending?: boolean;
      nmiPending?: boolean;
    }>("/event-bookings", { method: "POST", body: JSON.stringify(payload) }),
  chargeNmi: (bookingId: string, paymentToken: string) =>
    request<{ approved: boolean; bookingId: string }>(`/event-bookings/${bookingId}/nmi-charge`, {
      method: "POST",
      body: JSON.stringify({ paymentToken }),
    }),
  getBooking: (id: string) => request<EventBooking>(`/event-bookings/${id}`),
};
