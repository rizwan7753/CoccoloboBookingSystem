"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart, CartLine } from "@/components/site/CartContext";
import CheckoutDetailsAndPayment from "@/components/site/CheckoutDetailsAndPayment";
import Medal from "@/components/site/Medal";

export default function CheckoutPage() {
  const cart = useCart();
  // Once an order is placed the cart is emptied (its items are now reserved
  // in the order), but the payment step — bank-transfer instructions, or the
  // card form still waiting for payment — must stay on screen. Show a
  // snapshot of what was ordered from then on, instead of the live cart.
  const [placedLines, setPlacedLines] = useState<CartLine[] | null>(null);
  const lines = placedLines ?? cart.lines;
  const total = placedLines ? placedLines.reduce((sum, l) => sum + l.display.price, 0) : cart.total;

  return (
    <main className="site-body wrap py-12">
      <h1 className="font-display mb-8 text-3xl text-abyss">Checkout</h1>

      {lines.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-rule py-16 text-center opacity-60">
          Your cart is empty.{" "}
          <Link href="/excursions" className="text-coral-ink underline underline-offset-2">
            Browse excursions
          </Link>{" "}
          to get started.
        </div>
      ) : (
        <div className="grid gap-10 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <h2 className="font-display mb-4 text-lg text-abyss">Your items</h2>
            <ul className="flex flex-col gap-3">
              {lines.map((line) => (
                <li key={line.id} className="flex items-center gap-4 rounded-xl border border-rule bg-shell p-4">
                  <Medal photo={line.display.photo ?? undefined} size="3.25rem" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-abyss">{line.display.title}</span>
                    <span className="block text-xs opacity-60">{line.display.subtitle}</span>
                  </span>
                  <span className="text-sm font-semibold text-coral-ink">${line.display.price.toFixed(2)}</span>
                  {!placedLines && (
                  <button
                    type="button"
                    onClick={() => cart.removeItem(line.id)}
                    aria-label={`Remove ${line.display.title}`}
                    className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-abyss/50 hover:bg-foam hover:text-abyss"
                  >
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  )}
                </li>
              ))}
            </ul>
            <div className="mt-4 flex items-center justify-between border-t border-rule pt-4 text-lg font-semibold text-abyss">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-24 rounded-2xl border border-rule bg-white p-5 shadow-xl shadow-abyss/10">
              <h2 className="font-display mb-4 text-lg text-abyss">Your details</h2>
              <CheckoutDetailsAndPayment total={total} onOrderPlaced={setPlacedLines} />
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
