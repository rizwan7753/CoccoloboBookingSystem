"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { restaurantApi, RestaurantMenu } from "@/lib/restaurantApi";
import ReservationForm from "@/components/site/ReservationForm";

export default function RestaurantReservationsPage() {
  return (
    <Suspense fallback={null}>
      <RestaurantReservationsPageInner />
    </Suspense>
  );
}

function RestaurantReservationsPageInner() {
  const searchParams = useSearchParams();
  const menuSlug = searchParams.get("menu");
  const [menuTitle, setMenuTitle] = useState<string | undefined>(undefined);
  const [menus, setMenus] = useState<RestaurantMenu[]>([]);

  useEffect(() => {
    if (!menuSlug) return;
    restaurantApi
      .getMenu(menuSlug)
      .then((menu) => setMenuTitle(menu.title))
      .catch(() => {});
  }, [menuSlug]);

  useEffect(() => {
    restaurantApi.listMenus().then(setMenus).catch(() => {});
  }, []);

  return (
    <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <ReservationForm menuTitle={menuTitle} menus={menus.map((m) => ({ slug: m.slug, title: m.title }))} />
    </main>
  );
}
