const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

export type BookingLookupType = "excursion" | "rental" | "event";

export const CONFIRMATION_PATH: Record<BookingLookupType, string> = {
  excursion: "/booking/confirmation",
  rental: "/beach-chairs/confirmation",
  event: "/events/confirmation",
};

export const bookingLookupApi = {
  find: async (bookingCode: string, email: string): Promise<{ type: BookingLookupType; bookingId: string }> => {
    const res = await fetch(`${API_URL}/booking-lookup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingCode, email }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.error || "Booking not found");
    return body;
  },
};
