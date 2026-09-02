import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { requireAdmin, AuthedRequest } from "../../middleware/requireAdmin";
import { requireRole } from "../../middleware/requireRole";
import { logAudit } from "../../lib/auditLog";
import { sendEmail, invalidateEmailTransport } from "../../services/emailService";
import { invalidateStripeClient } from "../../services/stripeService";

const router = Router();
router.use(requireAdmin);

// System settings (including SMTP credentials) are Super Admin only —
// stricter than the usual Location Manager+ EDIT_ROLES used elsewhere.
router.use(requireRole("SUPER_ADMIN"));

function serialize(location: NonNullable<Awaited<ReturnType<typeof prisma.location.findFirst>>>) {
  const { smtpPassword, stripeSecretKey, stripeWebhookSecret, nmiSecurityKey, ...rest } = location;
  return {
    ...rest,
    smtpPasswordSet: Boolean(smtpPassword),
    stripeSecretKeySet: Boolean(stripeSecretKey),
    stripeWebhookSecretSet: Boolean(stripeWebhookSecret),
    nmiSecurityKeySet: Boolean(nmiSecurityKey),
  };
}

// GET /api/admin/settings — the single-location MVP's system settings.
// smtpPassword is never echoed back, only whether one is set.
router.get("/", async (_req, res) => {
  const location = await prisma.location.findFirst();
  if (!location) return res.status(404).json({ error: "No location configured" });
  res.json(serialize(location));
});

const settingsSchema = z.object({
  name: z.string().min(1).optional(),
  timezone: z.string().min(1).optional(),
  currency: z.string().min(1).optional(),
  smtpHost: z.string().optional(),
  smtpPort: z.number().int().positive().optional(),
  smtpUsername: z.string().optional(),
  smtpPassword: z.string().optional(), // omitted or blank = keep existing
  smtpFromEmail: z.union([z.string().email(), z.literal("")]).optional(),
  smtpFromName: z.string().optional(),
  smtpSecure: z.boolean().optional(),
  stripeEnabled: z.boolean().optional(),
  offlinePaymentEnabled: z.boolean().optional(),
  offlinePaymentInstructions: z.string().optional(),
  offlinePaymentReceiptEmail: z.union([z.string().email(), z.literal("")]).optional(),
  stripePublishableKey: z.string().optional(),
  stripeSecretKey: z.string().optional(), // omitted or blank = keep existing
  stripeWebhookSecret: z.string().optional(), // omitted or blank = keep existing
  nmiEnabled: z.boolean().optional(),
  nmiTokenizationKey: z.string().optional(),
  nmiSecurityKey: z.string().optional(), // omitted or blank = keep existing
});

// PUT /api/admin/settings
router.put("/", async (req: AuthedRequest, res) => {
  const parsed = settingsSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });

  const existing = await prisma.location.findFirst();
  if (!existing) return res.status(404).json({ error: "No location configured" });

  const { smtpPassword, stripeSecretKey, stripeWebhookSecret, nmiSecurityKey, ...data } = parsed.data;

  const location = await prisma.location.update({
    where: { id: existing.id },
    data: {
      ...data,
      // Blank/omitted secrets keep whatever was there before — the admin UI
      // never has the real value to send back, so an empty field must not be
      // interpreted as "clear it".
      ...(smtpPassword ? { smtpPassword } : {}),
      ...(stripeSecretKey ? { stripeSecretKey } : {}),
      ...(stripeWebhookSecret ? { stripeWebhookSecret } : {}),
      ...(nmiSecurityKey ? { nmiSecurityKey } : {}),
    },
  });

  invalidateEmailTransport();
  invalidateStripeClient();

  await logAudit(
    { adminUserId: req.admin!.sub, actorLabel: req.admin!.email },
    "settings.updated",
    "Location",
    location.id,
    { changedFields: Object.keys(parsed.data) }
  );

  res.json(serialize(location));
});

// POST /api/admin/settings/test-email — send a real test message with the
// currently-saved SMTP config, so an admin can confirm it works before
// relying on it for real guest notifications.
router.post("/test-email", async (req: AuthedRequest, res) => {
  const schema = z.object({ to: z.string().email() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "A valid recipient email is required" });

  const location = await prisma.location.findFirst();
  if (!location?.smtpHost || !location.smtpPort || !location.smtpFromEmail) {
    return res.status(400).json({ error: "SMTP isn't configured yet — fill in and save the fields above first." });
  }

  try {
    await sendEmail({
      to: parsed.data.to,
      subject: "Test email from your booking system",
      text: "This is a test message confirming your SMTP settings are working correctly.",
    });
    res.json({ ok: true });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[settings] Test email failed:", err);
    res.status(502).json({ error: err instanceof Error ? err.message : "Failed to send test email" });
  }
});

export default router;
