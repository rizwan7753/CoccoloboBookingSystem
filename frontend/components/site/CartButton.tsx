"use client";

import { useState } from "react";
import { useCart } from "./CartContext";
import CartDrawer from "./CartDrawer";

export default function CartButton() {
  const { lines } = useCart();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Cart, ${lines.length} item${lines.length === 1 ? "" : "s"}`}
        className="relative flex h-9 w-9 items-center justify-center rounded-full opacity-90 transition hover:bg-abyss/5 hover:opacity-100"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M3 3h2l2.4 12.2a2 2 0 0 0 2 1.8h8.2a2 2 0 0 0 2-1.6L21 8H6" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="9" cy="20" r="1.4" fill="currentColor" stroke="none" />
          <circle cx="17" cy="20" r="1.4" fill="currentColor" stroke="none" />
        </svg>
        {lines.length > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-coral text-[.65rem] font-semibold text-abyss">
            {lines.length}
          </span>
        )}
      </button>
      <CartDrawer open={open} onClose={() => setOpen(false)} />
    </>
  );
}
