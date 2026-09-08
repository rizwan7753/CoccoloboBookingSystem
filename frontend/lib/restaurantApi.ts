const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

export interface RestaurantMenuItem {
  id: string;
  name: string;
  description?: string | null;
  price?: string | null;
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

export const restaurantApi = {
  listMenus: () => request<RestaurantMenu[]>("/restaurant-menus"),
  getMenu: (slug: string) => request<RestaurantMenu>(`/restaurant-menus/${slug}`),
  createReservation: (payload: CreateReservationInput) =>
    request<{ id: string }>("/restaurant-reservations", { method: "POST", body: JSON.stringify(payload) }),
};
