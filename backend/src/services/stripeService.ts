import Stripe from "stripe";

const key = process.env.STRIPE_SECRET_KEY;

/** True once a real Stripe test/live secret key is configured (not the .env.example placeholder). */
export function isStripeConfigured(): boolean {
  return Boolean(key && key !== "sk_test_xxx" && key.startsWith("sk_"));
}

if (!isStripeConfigured()) {
  // eslint-disable-next-line no-console
  console.warn(
    "[stripe] No real STRIPE_SECRET_KEY configured — bookings will use the local dev payment bypass " +
      "(auto-confirmed, no real charge) instead of Stripe Checkout. Set a real test key in backend/.env to test real payments."
  );
}

export const stripe = new Stripe(key || "sk_test_placeholder", {
  apiVersion: "2024-06-20",
});

export async function createPaymentIntent(amountUsd: number, bookingId: string) {
  return stripe.paymentIntents.create({
    amount: Math.round(amountUsd * 100), // cents
    currency: "usd",
    metadata: { bookingId },
    automatic_payment_methods: { enabled: true },
  });
}

// Separate metadata key (rentalBookingId vs bookingId) so the webhook can
// tell which booking type a given PaymentIntent belongs to.
export async function createRentalPaymentIntent(amountUsd: number, rentalBookingId: string) {
  return stripe.paymentIntents.create({
    amount: Math.round(amountUsd * 100),
    currency: "usd",
    metadata: { rentalBookingId },
    automatic_payment_methods: { enabled: true },
  });
}

export async function createEventPaymentIntent(amountUsd: number, eventBookingId: string) {
  return stripe.paymentIntents.create({
    amount: Math.round(amountUsd * 100),
    currency: "usd",
    metadata: { eventBookingId },
    automatic_payment_methods: { enabled: true },
  });
}
