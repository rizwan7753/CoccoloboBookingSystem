const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

export interface RentalTimeSlot {
  id: string;
  rentalItemId: string;
  label: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

export interface RentalItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  images?: string[] | null;
  durationMinutes: number;
  priceAdult: string;
  priceChild?: string | null;
  status: string;
  timeSlots?: RentalTimeSlot[];
}

export interface SpotAvailability {
  id: string;
  code: string;
  quantity: number;
  booked: number;
  remaining: number;
}

export interface RentalAvailability {
  spots: SpotAvailability[];
  totalChairs: number;
  remainingChairs: number;
  holidayLabel?: string;
}

export interface RentalBooking {
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
  currency: string;
  status: string;
  paymentStatus: string;
  source: string;
  createdAt: string;
  rentalItem?: RentalItem;
  spot?: { id: string; code: string };
  timeSlot?: { id: string; label: string; startTime: string; endTime: string };
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

export const rentalApi = {
  listRentals: () => request<RentalItem[]>("/rentals"),
  getRental: (slug: string) => request<RentalItem>(`/rentals/${slug}`),
  getAvailability: (rentalItemId: string, date: string, timeSlotId: string) =>
    request<RentalAvailability>(
      `/rentals/${rentalItemId}/availability?${new URLSearchParams({ date, timeSlotId })}`
    ),
  createBooking: (payload: {
    rentalItemId: string;
    spotId: string;
    timeSlotId: string;
    date: string;
    guestName: string;
    guestEmail: string;
    guestPhone?: string;
    roomNumber?: string;
    adultCount: number;
    childCount?: number;
  }) =>
    request<{ bookingId: string; amountTotal: string; clientSecret: string | null; devBypass?: boolean }>(
      "/rental-bookings",
      { method: "POST", body: JSON.stringify(payload) }
    ),
  getBooking: (id: string) => request<RentalBooking>(`/rental-bookings/${id}`),
};
