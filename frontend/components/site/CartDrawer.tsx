"use client";

import Link from "next/link";
import { useCart } from "./CartContext";
import Medal from "./Medal";

export default function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { lines, total, removeItem } = useCart();

  return (
    <>
      <div
        onClick={onClose}
        aria-hidden="true"
        className={`fixed inset-0 z-40 bg-abyss/50 transition-opacity ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
      />
      <aside
        className={`site-body fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col bg-shell shadow-2xl transition-transform ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        aria-label="Cart"
      >
        <div className="flex items-center justify-between border-b border-rule px-5 py-4">
          <h2 className="font-display text-lg text-abyss">Your cart</h2>
          <button type="button" onClick={onClose} aria-label="Close cart" className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-foam">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {lines.length === 0 ? (
            <p className="text-sm opacity-60">
              Your cart is empty. Add an excursion, beach chair, or event ticket from its booking page to combine them into one checkout.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {lines.map((line) => (
                <li key={line.id} className="flex items-center gap-3 rounded-xl border border-rule bg-white p-3">
                  <Medal photo={line.display.photo ?? undefined} size="2.75rem" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-abyss">{line.display.title}</span>
                    <span className="block text-xs opacity-60">{line.display.subtitle}</span>
                    <span className="block text-sm font-semibold text-coral-ink">${line.display.price.toFixed(2)}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => removeItem(line.id)}
                    aria-label={`Remove ${line.display.title} from cart`}
                    className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-abyss/50 hover:bg-foam hover:text-abyss"
                  >
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {lines.length > 0 && (
          <div className="border-t border-rule px-5 py-4">
            <div className="mb-3 flex items-center justify-between text-sm font-semibold text-abyss">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
            <Link href="/checkout" onClick={onClose} className="btn w-full justify-center">
              Checkout
            </Link>
          </div>
        )}
      </aside>
    </>
  );
}
