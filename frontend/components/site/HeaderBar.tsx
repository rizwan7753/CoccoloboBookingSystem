"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import MobileNav from "./MobileNav";
import CartButton from "./CartButton";

/** Client wrapper for the sticky nav bar — tracks scroll position so the
 *  bar can shrink (less vertical padding) and fade slightly (lower
 *  opacity) once the page has scrolled past the announcement bar, giving
 *  it a more compact, unobtrusive feel while pinned at the top. */
export default function HeaderBar({
  name,
  menuLinks,
}: {
  name: string;
  menuLinks: { title: string; slug: string }[];
}) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 24);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    // No backdrop-filter/transform here: either creates a new containing
    // block for position:fixed descendants (the cart drawer, rendered via
    // CartButton below), trapping it inside this short header box instead
    // of the full viewport — same class of bug fixed earlier for the
    // QuickAddToCart modal.
    // Light bar (not the Deep Ocean one used before the rebrand): the logo
    // artwork is on an opaque off-white background, so it only sits cleanly
    // on Shell White — the palette's own "background" colour.
    <header
      className={`sticky top-0 z-20 border-b border-rule text-abyss transition-all duration-300 ${
        scrolled ? "bg-shell/95 shadow-md" : "bg-shell"
      }`}
    >
      {/* Flex + justify-between below lg: only the logo and the icon/CTA
          group are ever visible on mobile (the desktop link row is
          display:none, so it takes no grid track), so a 3-column grid
          there just squeezed logo + "Book now" pill + cart + hamburger
          into competing fixed tracks with no room to shrink, overflowing
          on narrow phones. Flex pushes the logo and the button group to
          opposite edges instead; lg: switches to the original
          1fr/auto/1fr grid so the logo stays mathematically centered
          against the full desktop link row. */}
      <div
        className={`mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 transition-all duration-300 sm:gap-4 sm:px-6 lg:grid lg:grid-cols-[1fr_auto_1fr] lg:gap-6 ${
          scrolled ? "py-1.5" : "py-2"
        }`}
      >
        <nav className="hidden gap-6 text-[.96rem] lg:flex" aria-label="Main">
          <Link href="/excursions" className="opacity-90 transition hover:opacity-100 hover:underline hover:underline-offset-5">
            Excursions
          </Link>
          <Link href="/beach-chairs" className="opacity-90 transition hover:opacity-100 hover:underline hover:underline-offset-5">
            Beach chairs
          </Link>
          <Link href="/coco-grill" className="opacity-90 transition hover:opacity-100 hover:underline hover:underline-offset-5">
            Coco Grill
          </Link>
          <Link href="/events" className="opacity-90 transition hover:opacity-100 hover:underline hover:underline-offset-5">
            Events
          </Link>
        </nav>

        <Link href="/" aria-label={`${name} — home`} className="flex-shrink-0 lg:justify-self-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/logo-header.png"
            alt={name}
            width={239}
            height={168}
            className={`w-auto transition-all duration-300 ${scrolled ? "h-10 sm:h-11" : "h-12 sm:h-14"}`}
          />
        </Link>

        <nav className="flex flex-shrink-0 items-center justify-end gap-2 text-[.96rem] sm:gap-4 lg:gap-6">
          <Link
            href="/find-booking"
            className="hidden opacity-90 transition hover:opacity-100 hover:underline hover:underline-offset-5 min-[34rem]:inline"
          >
            Find my booking
          </Link>
          <Link href="/#book" className="pill whitespace-nowrap !px-2.5 !py-1.5 text-xs sm:!px-[1.15rem] sm:!py-2 sm:text-sm">
            BOOK NOW
          </Link>
          <CartButton />
          <div className="lg:hidden">
            <MobileNav restaurantMenus={menuLinks} />
          </div>
        </nav>
      </div>
    </header>
  );
}
