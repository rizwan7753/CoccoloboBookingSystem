const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

export interface Excursion {
  id: string;
  title: string;
  slug: string;
  description: string;
  included?: string | null;
  excluded?: string | null;
  durationMinutes: number;
  meetingPoint?: string | null;
  mapUrl?: string | null;
  whatToBring?: string | null;
  images?: string[] | null;
  cardImageUrl?: string | null;
  headerImageUrl?: string | null;
  pricingType: "PER_GUEST" | "FLAT_RATE";
  priceAdult: string;
  priceChild?: string | null;
  capacityDefault: number;
  cutoffTime: string;
  status: string;
  departureTimes?: { id: string; time: string; daysOfWeek: number[] }[];
  /** Soonest bookable departure (after the cut-off), computed server-side. Null if nothing is bookable in the lookahead window. */
  nextDeparture?: { date: string; time: string } | null;
}

export interface AvailabilityDay {
  date: string;
  time: string;
  capacity: number;
  remaining: number;
  status: string;
  bookingClosed: boolean;
  holidayLabel?: string;
}

export interface Booking {
  id: string;
  bookingCode?: string | null;
  excursionId: string;
  slotId: string;
  guestName: string;
  guestEmail: string;
  guestPhone?: string | null;
  roomNumber?: string | null;
  specialRequests?: string | null;
  adultCount: number;
  childCount: number;
  totalGuests: number;
  amountTotal: string;
  currency: string;
  status: string;
  paymentStatus: string;
  paymentMethod?: string | null;
  source: string;
  createdAt: string;
  excursion?: Excursion;
  slot?: { id: string; date: string; time: string; capacity: number; bookedCount: number };
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

export const api = {
  listExcursions: () => request<Excursion[]>("/excursions"),
  getExcursion: (slug: string) => request<Excursion>(`/excursions/${slug}`),
  getAvailability: (excursionId: string, from: string, to: string) =>
    request<AvailabilityDay[]>(`/excursions/${excursionId}/availability?from=${from}&to=${to}`),
  createBooking: (payload: {
    excursionId: string;
    date: string;
    time: string;
    guestName: string;
    guestEmail: string;
    guestPhone?: string;
    roomNumber?: string;
    specialRequests?: string;
    adultCount: number;
    childCount?: number;
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
    }>("/bookings", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  chargeNmi: (bookingId: string, paymentToken: string) =>
    request<{ approved: boolean; bookingId: string }>(`/bookings/${bookingId}/nmi-charge`, {
      method: "POST",
      body: JSON.stringify({ paymentToken }),
    }),
  getBooking: (id: string) => request<Booking>(`/bookings/${id}`),
};
