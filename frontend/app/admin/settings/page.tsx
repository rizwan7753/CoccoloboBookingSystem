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

export default function AdminSettingsPage() {
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
      });
      applySettings(updated);
      setSmtpPassword("");
      setSaveMessage("Settings saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  async function handleSendTest(e: React.FormEvent) {
    e.preventDefault();
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
    <div className="space-y-8">
      <PageHeader title="Settings" description="System-wide configuration — Super Admin only." />

      <form onSubmit={handleSave} className={`${cardClass} max-w-2xl space-y-4 p-6`}>
        <h2 className="text-sm font-semibold text-stone-900">General</h2>
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

        <h2 className="pt-2 text-sm font-semibold text-stone-900">Email (SMTP)</h2>
        <p className="text-xs text-stone-400">
          Used to send booking confirmations and staff notifications. Leave blank to keep notifications logged to the
          server console only (nothing is actually emailed until this is configured).
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

        {error && <p className="text-sm text-red-600">{error}</p>}
        {saveMessage && <p className="text-sm text-emerald-700">{saveMessage}</p>}

        <button type="submit" disabled={saving} className={primaryButtonClass}>
          {saving ? "Saving…" : "Save settings"}
        </button>
      </form>

      <div className={`${cardClass} max-w-2xl p-6`}>
        <h2 className="text-sm font-semibold text-stone-900">Send a test email</h2>
        <p className="mt-1 text-xs text-stone-400">Sends using whatever SMTP settings are currently saved (save first if you just changed them).</p>
        <form onSubmit={handleSendTest} className="mt-3 flex gap-2">
          <input
            type="email"
            placeholder="you@example.com"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            className={inputClass}
            required
          />
          <button type="submit" disabled={testSending} className={primaryButtonClass}>
            {testSending ? "Sending…" : "Send test"}
          </button>
        </form>
        {testResult && <p className="mt-2 text-sm text-stone-600">{testResult}</p>}
      </div>
    </div>
  );
}
