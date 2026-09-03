"use client";

import { useState } from "react";
import Link from "next/link";

const links = [
  { href: "/", label: "Excursions" },
  { href: "/beach-chairs", label: "Beach Chairs" },
  { href: "/events", label: "Events" },
];

export default function MobileNav() {
  const [open, setOpen] = useState(false);

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
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-3 py-2.5 transition hover:bg-stone-50 hover:text-teal-700"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  );
}
