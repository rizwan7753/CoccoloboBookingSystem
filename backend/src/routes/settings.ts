import { Router } from "express";
import { prisma } from "../lib/prisma";
import { resolveGatewayDomain } from "../services/nmiService";

const router = Router();

// GET /api/settings — public, branding + checkout-relevant fields only (no
// SMTP/credentials). Offline payment instructions are meant to be guest-visible.
router.get("/", async (_req, res) => {
  const location = await prisma.location.findFirst();
  if (!location) return res.status(404).json({ error: "No location configured" });
  res.json({
    name: location.name,
    timezone: location.timezone,
    currency: location.currency,
    stripeEnabled: location.stripeEnabled,
    // A publishable key is meant to be public (it's sent to the browser by
    // design) — safe to expose here, unlike the secret key/webhook secret.
    stripePublishableKey: location.stripePublishableKey,
    nmiEnabled: location.nmiEnabled,
    // A tokenization key is meant to be public (Collect.js loads with it in
    // the browser) — safe to expose here, unlike the security key. The
    // gateway domain (resolved, with its default applied) is needed so the
    // browser loads Collect.js from the right white-label domain too.
    nmiTokenizationKey: location.nmiTokenizationKey,
    nmiGatewayDomain: await resolveGatewayDomain(),
    offlinePaymentEnabled: location.offlinePaymentEnabled,
    offlinePaymentInstructions: location.offlinePaymentInstructions,
    offlinePaymentReceiptEmail: location.offlinePaymentReceiptEmail,
  });
});

export default router;
