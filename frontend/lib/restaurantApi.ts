import { request } from "./http";

export interface RestaurantMenuItem {
  id: string;
  name: string;
  description?: string | null;
  price?: string | null;
  images?: string[] | null;
  sortOrder: number;
}

export interface RestaurantMenuSection {
  id: string;
  heading: string;
  subheading?: string | null;
  sortOrder: number;
  items: RestaurantMenuItem[];
}

export interface RestaurantMenu {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  timings?: string | null;
  imageUrl?: string | null;
  sortOrder: number;
  isActive: boolean;
  sections: RestaurantMenuSection[];
}

export interface CreateReservationInput {
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  partySize: number;
  date: string;
  time: string;
  specialRequests?: string;
}

export const restaurantApi = {
  listMenus: () => request<RestaurantMenu[]>("/restaurant-menus"),
  getMenu: (slug: string) => request<RestaurantMenu>(`/restaurant-menus/${slug}`),
  createReservation: (payload: CreateReservationInput) =>
    request<{ id: string; bookingCode?: string | null }>("/restaurant-reservations", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};
