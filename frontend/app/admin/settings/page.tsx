"use client";

import { useEffect, useState } from "react";
import { adminApi, AdminSettings } from "@/lib/adminApi";
import { PageHeader, cardClass, inputClass, primaryButtonClass } from "@/components/admin/ui";

const COMMON_TIMEZONES = [
  "America/St_Thomas",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Toronto",
  "America/Puerto_Rico",
  "UTC",
  "Europe/London",
];

const COMMON_CURRENCIES = ["USD", "EUR", "GBP", "CAD", "XCD"];

const TABS = [
  { key: "general", label: "General" },
  { key: "email", label: "Email (SMTP)" },
  { key: "stripe", label: "Stripe" },
  { key: "offline", label: "Offline Payment" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

export default function AdminSettingsPage() {
  const [tab, setTab] = useState<TabKey>("general");

  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [timezone, setTimezone] = useState("");
  const [currency, setCurrency] = useState("");

  const [smtpHost, setSmtpHost] = useState("");
  const [smtpPort, setSmtpPort] = useState(587);
  const [smtpUsername, setSmtpUsername] = useState("");
  const [smtpPassword, setSmtpPassword] = useState("");
  const [smtpFromEmail, setSmtpFromEmail] = useState("");
  const [smtpFromName, setSmtpFromName] = useState("");
  const [smtpSecure, setSmtpSecure] = useState(false);

  const [stripeEnabled, setStripeEnabled] = useState(true);
  const [stripePublishableKey, setStripePublishableKey] = useState("");
  const [stripeSecretKey, setStripeSecretKey] = useState("");
  const [stripeWebhookSecret, setStripeWebhookSecret] = useState("");

  const [offlinePaymentEnabled, setOfflinePaymentEnabled] = useState(false);
  const [offlinePaymentInstructions, setOfflinePaymentInstructions] = useState("");
  const [offlinePaymentReceiptEmail, setOfflinePaymentReceiptEmail] = useState("");

  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [testEmail, setTestEmail] = useState("");
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  function applySettings(s: AdminSettings) {
    setSettings(s);
    setName(s.name);
    setTimezone(s.timezone);
    setCurrency(s.currency);
    setSmtpHost(s.smtpHost ?? "");
    setSmtpPort(s.smtpPort ?? 587);
    setSmtpUsername(s.smtpUsername ?? "");
    setSmtpFromEmail(s.smtpFromEmail ?? "");
    setSmtpFromName(s.smtpFromName ?? "");
    setSmtpSecure(s.smtpSecure);
    setStripeEnabled(s.stripeEnabled);
    setStripePublishableKey(s.stripePublishableKey ?? "");
    setOfflinePaymentEnabled(s.offlinePaymentEnabled);
    setOfflinePaymentInstructions(s.offlinePaymentInstructions ?? "");
    setOfflinePaymentReceiptEmail(s.offlinePaymentReceiptEmail ?? "");
  }

  useEffect(() => {
    adminApi
      .getSettings()
      .then(applySettings)
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveMessage(null);
    setError(null);
    try {
      const updated = await adminApi.updateSettings({
        name,
        timezone,
        currency,
        smtpHost: smtpHost || undefined,
        smtpPort: smtpHost ? Number(smtpPort) : undefined,
        smtpUsername: smtpUsername || undefined,
        smtpPassword: smtpPassword || undefined, // blank = keep existing
        smtpFromEmail: smtpFromEmail || undefined,
        smtpFromName: smtpFromName || undefined,
        smtpSecure,
        stripeEnabled,
        stripePublishableKey: stripePublishableKey || undefined,
        stripeSecretKey: stripeSecretKey || undefined, // blank = keep existing
        stripeWebhookSecret: stripeWebhookSecret || undefined, // blank = keep existing
        offlinePaymentEnabled,
        offlinePaymentInstructions: offlinePaymentInstructions || undefined,
        offlinePaymentReceiptEmail: offlinePaymentReceiptEmail || undefined,
      });
      applySettings(updated);
      setSmtpPassword("");
      setStripeSecretKey("");
      setStripeWebhookSecret("");
      setSaveMessage("Settings saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  async function handleSendTest() {
    setTestSending(true);
    setTestResult(null);
    try {
      await adminApi.sendTestEmail(testEmail);
      setTestResult("Test email sent — check the inbox (and spam folder).");
    } catch (err) {
      setTestResult(err instanceof Error ? err.message : "Failed to send test email");
    } finally {
      setTestSending(false);
    }
  }

  if (loading) return <p className="text-sm text-stone-400">Loading…</p>;
  if (!settings) return <p className="text-sm text-red-600">Settings not found.</p>;

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="System-wide configuration — Super Admin only." />

      <div className="flex gap-1 border-b border-stone-200">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition ${
              tab === t.key
                ? "border-teal-700 text-teal-700"
                : "border-transparent text-stone-500 hover:text-stone-800"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSave} className={`${cardClass} max-w-2xl space-y-4 p-6`}>
        {tab === "general" && (
          <>
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-700">Booking system name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} required />
              <p className="mt-1 text-xs text-stone-400">Shown in the site header, footer, page titles, and admin panel.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">Timezone</label>
                <select value={timezone} onChange={(e) => setTimezone(e.target.value)} className={inputClass}>
                  {!COMMON_TIMEZONES.includes(timezone) && <option value={timezone}>{timezone}</option>}
                  {COMMON_TIMEZONES.map((tz) => (
                    <option key={tz} value={tz}>
                      {tz}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">Currency</label>
                <select value={currency} onChange={(e) => setCurrency(e.target.value)} className={inputClass}>
                  {!COMMON_CURRENCIES.includes(currency) && <option value={currency}>{currency}</option>}
                  {COMMON_CURRENCIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </>
        )}

        {tab === "email" && (
          <>
            <p className="text-xs text-stone-400">
              Used to send booking confirmations and staff notifications. Leave blank to keep notifications logged to
              the server console only (nothing is actually emailed until this is configured).
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">SMTP host</label>
                <input placeholder="smtp.sendgrid.net" value={smtpHost} onChange={(e) => setSmtpHost(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">Port</label>
                <input type="number" value={smtpPort} onChange={(e) => setSmtpPort(Number(e.target.value))} className={inputClass} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">Username</label>
                <input value={smtpUsername} onChange={(e) => setSmtpUsername(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">Password</label>
                <input
                  type="password"
                  placeholder={settings.smtpPasswordSet ? "•••••••• (leave blank to keep)" : "Not set"}
                  value={smtpPassword}
                  onChange={(e) => setSmtpPassword(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">From email</label>
                <input
                  type="email"
                  placeholder="bookings@yourdomain.com"
                  value={smtpFromEmail}
                  onChange={(e) => setSmtpFromEmail(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">From name</label>
                <input placeholder="e.g. Cocolobo Bookings" value={smtpFromName} onChange={(e) => setSmtpFromName(e.target.value)} className={inputClass} />
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-stone-600">
              <input type="checkbox" checked={smtpSecure} onChange={(e) => setSmtpSecure(e.target.checked)} />
              Use TLS (typically on for port 465, off for 587/25)
            </label>

            <div className="border-t border-stone-100 pt-4">
              <h3 className="text-sm font-semibold text-stone-900">Send a test email</h3>
              <p className="mt-1 text-xs text-stone-400">Sends using whatever SMTP settings are currently saved (save first if you just changed them).</p>
              <div className="mt-3 flex gap-2">
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  className={inputClass}
                />
                <button type="button" disabled={testSending || !testEmail} onClick={handleSendTest} className={primaryButtonClass}>
                  {testSending ? "Sending…" : "Send test"}
                </button>
              </div>
              {testResult && <p className="mt-2 text-sm text-stone-600">{testResult}</p>}
            </div>
          </>
        )}

        {tab === "stripe" && (
          <>
            <p className="text-xs text-stone-400">
              Card payments via Stripe. Keys come from your{" "}
              <span className="font-medium text-stone-600">Stripe Dashboard → Developers → API keys</span>. Changes here
              take effect immediately — no redeploy needed.
            </p>

            <label className="flex items-center gap-2 text-sm text-stone-600">
              <input type="checkbox" checked={stripeEnabled} onChange={(e) => setStripeEnabled(e.target.checked)} />
              Accept card payments (Stripe)
            </label>

            <div>
              <label className="mb-1 block text-sm font-medium text-stone-700">Publishable key</label>
              <input
                placeholder="pk_test_... or pk_live_..."
                value={stripePublishableKey}
                onChange={(e) => setStripePublishableKey(e.target.value)}
                className={inputClass}
              />
              <p className="mt-1 text-xs text-stone-400">Sent to the guest&apos;s browser — this one isn&apos;t secret.</p>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-700">Secret key</label>
              <input
                type="password"
                placeholder={settings.stripeSecretKeySet ? "•••••••• (leave blank to keep)" : "sk_test_... or sk_live_..."}
                value={stripeSecretKey}
                onChange={(e) => setStripeSecretKey(e.target.value)}
                className={inputClass}
              />
              <p className="mt-1 text-xs text-stone-400">Never shown once saved — only whether one is set.</p>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-700">Webhook signing secret</label>
              <input
                type="password"
                placeholder={settings.stripeWebhookSecretSet ? "•••••••• (leave blank to keep)" : "whsec_..."}
                value={stripeWebhookSecret}
                onChange={(e) => setStripeWebhookSecret(e.target.value)}
                className={inputClass}
              />
              <p className="mt-1 text-xs text-stone-400">
                From your webhook endpoint in Stripe Dashboard → Developers → Webhooks (point it at{" "}
                <code className="rounded bg-stone-100 px-1 py-0.5 text-[11px]">/api/webhooks/stripe</code>).
              </p>
            </div>
          </>
        )}

        {tab === "offline" && (
          <>
            <p className="text-xs text-stone-400">
              Guests can pay by bank deposit/transfer instead of card. If both Stripe and offline payment are on,
              guests pick one at checkout; if only one is on, it&apos;s used automatically.
            </p>

            <label className="flex items-center gap-2 text-sm text-stone-600">
              <input
                type="checkbox"
                checked={offlinePaymentEnabled}
                onChange={(e) => setOfflinePaymentEnabled(e.target.checked)}
              />
              Accept offline payment (bank deposit / bank transfer)
            </label>
            {offlinePaymentEnabled && (
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">Offline payment instructions</label>
                <textarea
                  value={offlinePaymentInstructions}
                  onChange={(e) => setOfflinePaymentInstructions(e.target.value)}
                  rows={5}
                  placeholder="e.g. Bank: ..., Account name: ..., Account number: ..., Reference: your booking ID"
                  className={inputClass}
                />
                <p className="mt-1 text-xs text-stone-400">
                  Shown to guests who choose offline payment, and included in their booking-received email.
                </p>
              </div>
            )}
            {offlinePaymentEnabled && (
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">Receipt email</label>
                <input
                  type="email"
                  value={offlinePaymentReceiptEmail}
                  onChange={(e) => setOfflinePaymentReceiptEmail(e.target.value)}
                  placeholder="payments@yourdomain.com"
                  className={inputClass}
                />
                <p className="mt-1 text-xs text-stone-400">
                  Guests are told to send their payment receipt here, referencing their booking ID, so staff know
                  when to mark a booking as paid.
                </p>
              </div>
            )}
          </>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}
        {saveMessage && <p className="text-sm text-emerald-700">{saveMessage}</p>}

        <button type="submit" disabled={saving} className={primaryButtonClass}>
          {saving ? "Saving…" : "Save settings"}
        </button>
      </form>
    </div>
  );
}
