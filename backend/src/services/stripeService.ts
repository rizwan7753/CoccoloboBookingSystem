import Stripe from "stripe";
import { prisma } from "../lib/prisma";

function isRealSecretKey(key?: string | null): key is string {
  return Boolean(key && key !== "sk_test_xxx" && key.startsWith("sk_"));
}

// Cached like emailService's SMTP transporter — rebuilt automatically when
// the resolved key changes (e.g. after an admin saves a new key in Settings,
// which calls invalidateStripeClient()).
let cached: { secretKey: string; client: Stripe } | null = null;

export function invalidateStripeClient() {
  cached = null;
}

/** DB (Settings page) takes priority over the .env fallback, so changing the
 *  key via the admin UI takes effect immediately — no restart/redeploy needed. */
async function resolveSecretKey(): Promise<string | null> {
  const location = await prisma.location.findFirst();
  if (isRealSecretKey(location?.stripeSecretKey)) return location!.stripeSecretKey!;
  if (isRealSecretKey(process.env.STRIPE_SECRET_KEY)) return process.env.STRIPE_SECRET_KEY!;
  return null;
}

async function getClient(): Promise<Stripe | null> {
  const key = await resolveSecretKey();
  if (!key) {
    cached = null;
    return null;
  }
  if (!cached || cached.secretKey !== key) {
    cached = { secretKey: key, client: new Stripe(key, { apiVersion: "2024-06-20" }) };
  }
  return cached.client;
}

/** True once a real Stripe secret key is configured (DB or .env) — not the placeholder. */
export async function isStripeConfigured(): Promise<boolean> {
  return (await getClient()) !== null;
}

async function requireClient(): Promise<Stripe> {
  const client = await getClient();
  if (!client) throw new Error("Stripe is not configured");
  return client;
}

/** Webhook signature secret — DB takes priority over .env, same as the secret key. */
export async function getWebhookSecret(): Promise<string | undefined> {
  const location = await prisma.location.findFirst();
  return location?.stripeWebhookSecret || process.env.STRIPE_WEBHOOK_SECRET || undefined;
}

/** Used by the webhook route to verify signatures — returns null rather than
 *  throwing when unconfigured, since the webhook route has its own fallback. */
export async function getStripeClient(): Promise<Stripe | null> {
  return getClient();
}

export async function createPaymentIntent(amountUsd: number, bookingId: string) {
  const client = await requireClient();
  return client.paymentIntents.create({
    amount: Math.round(amountUsd * 100), // cents
    currency: "usd",
    metadata: { bookingId },
    automatic_payment_methods: { enabled: true },
  });
}

// Separate metadata key (rentalBookingId vs bookingId) so the webhook can
// tell which booking type a given PaymentIntent belongs to.
export async function createRentalPaymentIntent(amountUsd: number, rentalBookingId: string) {
  const client = await requireClient();
  return client.paymentIntents.create({
    amount: Math.round(amountUsd * 100),
    currency: "usd",
    metadata: { rentalBookingId },
    automatic_payment_methods: { enabled: true },
  });
}

export async function createEventPaymentIntent(amountUsd: number, eventBookingId: string) {
  const client = await requireClient();
  return client.paymentIntents.create({
    amount: Math.round(amountUsd * 100),
    currency: "usd",
    metadata: { eventBookingId },
    automatic_payment_methods: { enabled: true },
  });
}

// Startup-only informational warning (was previously synchronous/env-only;
// now async since the key can come from the DB) — never blocks server boot.
isStripeConfigured().then((configured) => {
  if (!configured) {
    // eslint-disable-next-line no-console
    console.warn(
      "[stripe] No real Stripe secret key configured (Settings page or .env) — bookings will use the " +
        "local dev payment bypass (auto-confirmed, no real charge) instead of Stripe Checkout."
    );
  }
});
