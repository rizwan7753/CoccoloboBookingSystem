import { loadStripe, Stripe } from "@stripe/stripe-js";

// The Stripe publishable key now comes from Settings (fetched at runtime),
// not a build-time NEXT_PUBLIC_ env var — changing it in the admin UI takes
// effect immediately, no rebuild/redeploy needed. Cached by key so re-renders
// (or multiple widgets on the same page) don't call loadStripe repeatedly.
let cachedKey: string | null = null;
let cachedPromise: Promise<Stripe | null> | null = null;

export function getStripePromise(publishableKey: string | null | undefined): Promise<Stripe | null> | null {
  if (!publishableKey) return null;
  if (cachedKey !== publishableKey) {
    cachedKey = publishableKey;
    cachedPromise = loadStripe(publishableKey);
  }
  return cachedPromise;
}
