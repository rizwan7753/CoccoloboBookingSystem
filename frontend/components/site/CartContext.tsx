"use client";

import { createContext, useContext, useEffect, useMemo, useReducer, useState } from "react";
import { OrderItemInput } from "@/lib/orderApi";

export interface CartLine {
  id: string; // client-generated, for removal — not a server id
  item: OrderItemInput;
  display: { title: string; subtitle: string; price: number; photo?: string | null };
}

interface CartState {
  lines: CartLine[];
}

type CartAction = { type: "ADD"; line: CartLine } | { type: "REMOVE"; id: string } | { type: "CLEAR" } | { type: "HYDRATE"; lines: CartLine[] };

function reducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD":
      return { lines: [...state.lines, action.line] };
    case "REMOVE":
      return { lines: state.lines.filter((l) => l.id !== action.id) };
    case "CLEAR":
      return { lines: [] };
    case "HYDRATE":
      return { lines: action.lines };
    default:
      return state;
  }
}

const STORAGE_KEY = "coco-cart";

interface CartContextValue {
  lines: CartLine[];
  total: number;
  addItem: (item: OrderItemInput, display: CartLine["display"]) => void;
  removeItem: (id: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { lines: [] });
  // Guards against a write-before-read race: without this, the persist
  // effect below runs on the very first mount with the reducer's initial
  // empty state (before the hydrate effect's dispatch has been applied) and
  // overwrites whatever was actually stored with `[]`. Gating the write on
  // "hydration has run at least once" makes the two effects safe regardless
  // of exact effect-ordering/timing (e.g. React Strict Mode's double-invoke
  // in dev, which this app runs under).
  const [hydrated, setHydrated] = useState(false);

  // Cart is a per-viewer convenience with no guest-account system to store it
  // against server-side — localStorage persistence only, lost if the browser
  // storage is cleared (acceptable trade-off for an abandoned cart).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) dispatch({ type: "HYDRATE", lines: JSON.parse(raw) });
    } catch {
      // ignore — start with an empty cart
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.lines));
    } catch {
      // ignore — cart just won't persist across reloads this session
    }
  }, [state.lines, hydrated]);

  const value = useMemo<CartContextValue>(
    () => ({
      lines: state.lines,
      total: state.lines.reduce((sum, l) => sum + l.display.price, 0),
      addItem: (item, display) => dispatch({ type: "ADD", line: { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, item, display } }),
      removeItem: (id) => dispatch({ type: "REMOVE", id }),
      clear: () => dispatch({ type: "CLEAR" }),
    }),
    [state.lines]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
