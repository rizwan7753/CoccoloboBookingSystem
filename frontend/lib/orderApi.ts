import { request } from "./http";
import { Excursion } from "./api";
import { RentalItem } from "./rentalApi";
import { EventItem } from "./eventApi";

export type OrderItemInput =
  | {
      type: "excursion";
      excursionId: string;
      date: string;
      time: string;
      specialRequests?: string;
      adultCount: number;
      childCount?: number;
    }
  | {
      type: "rental";
      rentalItemId: string;
      spotId: string;
      timeSlotId: string;
      date: string;
      adultCount: number;
      childCount?: number;
    }
  | { type: "event"; eventId: string; tierId: string; quantity: number };

export interface Order {
  id: string;
  guestName: string;
  guestEmail: string;
  guestPhone?: string | null;
  roomNumber?: string | null;
  amountTotal: string;
  currency: string;
  status: string;
  paymentStatus: string;
  paymentMethod?: string | null;
  bookingCode?: string | null;
  createdAt: string;
  bookings: {
    id: string;
    excursion?: Excursion;
    slot?: { id: string; date: string; time: string };
    adultCount: number;
    childCount: number;
    totalGuests: number;
    amountTotal: string;
  }[];
  rentalBookings: {
    id: string;
    rentalItem?: RentalItem;
    spot?: { id: string; code: string };
    timeSlot?: { id: string; label: string; startTime: string; endTime: string };
    date: string;
    quantity: number;
    amountTotal: string;
  }[];
  eventBookings: {
    id: string;
    event?: EventItem;
    tier?: { id: string; name: string };
    quantity: number;
    amountTotal: string;
  }[];
}

export const orderApi = {
  createOrder: (payload: {
    items: OrderItemInput[];
    guestName: string;
    guestEmail: string;
    guestPhone?: string;
    roomNumber?: string;
    paymentMethod?: "stripe" | "offline" | "nmi";
  }) =>
    request<{
      orderId: string;
      bookingCode?: string | null;
      amountTotal: string;
      clientSecret: string | null;
      devBypass?: boolean;
      offlinePending?: boolean;
      nmiPending?: boolean;
    }>("/orders", { method: "POST", body: JSON.stringify(payload) }),
  chargeNmi: (orderId: string, paymentToken: string) =>
    request<{ approved: boolean; orderId: string }>(`/orders/${orderId}/nmi-charge`, {
      method: "POST",
      body: JSON.stringify({ paymentToken }),
    }),
  getOrder: (id: string) => request<Order>(`/orders/${id}`),
};
