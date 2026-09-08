"use client";

import { useState } from "react";
import Link from "next/link";

const links = [
  { href: "/", label: "Excursions" },
  { href: "/beach-chairs", label: "Beach Chairs" },
  { href: "/events", label: "Events" },
];

export default function MobileNav({ restaurantMenus = [] }: { restaurantMenus?: { title: string; slug: string }[] }) {
  const [open, setOpen] = useState(false);
  const [restaurantOpen, setRestaurantOpen] = useState(false);

  function closeAll() {
    setOpen(false);
    setRestaurantOpen(false);
  }

  return (
    <div className="sm:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Toggle menu"
        className="flex h-9 w-9 items-center justify-center rounded-lg text-stone-600 transition hover:bg-stone-100 hover:text-teal-700"
      >
        {open ? (
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      {open && (
        <nav className="absolute inset-x-0 top-full border-b border-stone-200 bg-white px-4 py-3 shadow-lg">
          <ul className="flex flex-col gap-1 text-sm font-medium text-stone-600">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={closeAll}
                  className="block rounded-lg px-3 py-2.5 transition hover:bg-stone-50 hover:text-teal-700"
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <button
                type="button"
                onClick={() => setRestaurantOpen((v) => !v)}
                aria-expanded={restaurantOpen}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left transition hover:bg-stone-50 hover:text-teal-700"
              >
                Restaurant
                <svg
                  className={`h-4 w-4 transition-transform ${restaurantOpen ? "rotate-180" : ""}`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              {restaurantOpen && (
                <ul className="ml-3 mt-1 flex flex-col gap-1 border-l border-stone-100 pl-3">
                  {restaurantMenus.map((menu) => (
                    <li key={menu.slug}>
                      <Link
                        href={`/restaurant/${menu.slug}`}
                        onClick={closeAll}
                        className="block rounded-lg px-3 py-2 text-sm text-stone-600 transition hover:bg-stone-50 hover:text-teal-700"
                      >
                        {menu.title}
                      </Link>
                    </li>
                  ))}
                  <li>
                    <Link
                      href="/restaurant/reservations"
                      onClick={closeAll}
                      className="block rounded-lg px-3 py-2 text-sm font-semibold text-teal-700 transition hover:bg-teal-50"
                    >
                      Reservations
                    </Link>
                  </li>
                </ul>
              )}
            </li>
          </ul>
        </nav>
      )}
    </div>
  );
}
