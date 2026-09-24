"use client";

import { useState } from "react";
import { restaurantApi } from "@/lib/restaurantApi";

const inputClass =
  "w-full rounded-xl border border-rule bg-white px-3.5 py-2.5 text-sm text-abyss placeholder:opacity-50 transition focus:border-coral focus:outline-none focus:ring-2 focus:ring-coral/20";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

interface MenuOption {
  slug: string;
  title: string;
}

/** Embedded "reserve a table" form, shown directly on every restaurant
 *  page (overview + each menu) instead of linking out to a separate page.
 *  `menuTitle` (when given — i.e. this is a specific menu's page) rides
 *  along with the request so staff can see which menu the guest was
 *  looking at, without needing a dedicated schema field for it. On the
 *  overview page there's no fixed menu, so `menus` lets the guest pick one
 *  themselves via a dropdown instead. */
export default function ReservationForm({ menuTitle, menus }: { menuTitle?: string; menus?: MenuOption[] }) {
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [partySize, setPartySize] = useState(2);
  const [date, setDate] = useState(todayISO());
  const [time, setTime] = useState("19:00");
  const [specialRequests, setSpecialRequests] = useState("");
  const [selectedMenu, setSelectedMenu] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [bookingCode, setBookingCode] = useState<string | null>(null);

  const effectiveMenuTitle = menuTitle || selectedMenu || undefined;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const notes = [effectiveMenuTitle ? `Requested menu: ${effectiveMenuTitle}` : "", specialRequests].filter(Boolean).join("\n");
      const result = await restaurantApi.createReservation({
        guestName,
        guestEmail,
        guestPhone: guestPhone || undefined,
        partySize,
        date,
        time,
        specialRequests: notes || undefined,
      });
      setBookingCode(result.bookingCode ?? null);
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit reservation request");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div id="reserve" className="site-body overflow-hidden rounded-3xl border border-rule bg-white shadow-xl shadow-abyss/5">
      <div className="grid lg:grid-cols-5">
        <div className="relative overflow-hidden bg-gradient-to-br from-abyss via-deep to-abyss px-8 py-10 lg:col-span-2">
          <div
            className="pointer-events-none absolute inset-0 opacity-20"
            style={{ backgroundImage: "radial-gradient(circle at 30% 20%, white 0, transparent 45%)" }}
          />
          <div className="relative flex h-full flex-col">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10">
              <svg className="h-5 w-5 text-shallow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M8 2v6a2 2 0 0 0 2 2v12M8 2a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2M16 2v20M16 2a4 4 0 0 1 4 4v4a2 2 0 0 1-2 2h-2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            {effectiveMenuTitle && (
              <span className="mt-4 inline-flex w-fit items-center gap-1.5 rounded-full bg-coral/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-shallow">
                For the {effectiveMenuTitle}
              </span>
            )}
            <h2 className={`font-display text-2xl text-foam ${effectiveMenuTitle ? "mt-3" : "mt-6"}`}>Reserve a table</h2>
            <p className="mt-3 text-sm leading-relaxed text-foam/80">
              {effectiveMenuTitle
                ? "Send your request below and we'll confirm by phone or email."
                : "Tell us when you'd like to dine — no card needed."}
            </p>
            <ul className="mt-8 space-y-3 text-sm text-foam/80">
              <li className="flex items-start gap-2.5">
                <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-shallow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                No payment or card required
              </li>
              <li className="flex items-start gap-2.5">
                <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-shallow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                We confirm by phone or email
              </li>
              <li className="flex items-start gap-2.5">
                <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-shallow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Usually confirmed within a few hours
              </li>
            </ul>
          </div>
        </div>

        <div className="px-6 py-8 sm:px-10 sm:py-10 lg:col-span-3">
          {submitted ? (
            <div className="flex h-full flex-col items-center justify-center py-8 text-center">
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-foam">
                <svg className="h-8 w-8 text-coral-ink" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h3 className="font-display text-xl text-abyss">Request received</h3>
              <p className="mt-2 max-w-sm text-sm opacity-70">
                Thanks{guestName ? `, ${guestName.split(" ")[0]}` : ""} — we&apos;ve emailed a confirmation that we
                received your request. A member of staff will be in touch shortly to confirm your table.
              </p>
              {bookingCode && (
                <p className="mt-4 rounded-lg bg-foam px-4 py-2 font-mono text-xs opacity-70">
                  Reference: <span className="font-semibold text-abyss">{bookingCode}</span>
                </p>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium opacity-70">Date</label>
                  <input
                    type="date"
                    min={todayISO()}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium opacity-70">Time</label>
                  <input type="time" value={time} onChange={(e) => setTime(e.target.value)} required className={inputClass} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium opacity-70">No of People</label>
                  <input
                    type="number"
                    min={1}
                    value={partySize}
                    onChange={(e) => setPartySize(Math.max(1, Number(e.target.value)))}
                    required
                    className={inputClass}
                  />
                </div>
              </div>

              {!menuTitle && menus && menus.length > 0 && (
                <div>
                  <label className="mb-1 block text-xs font-medium opacity-70">Menu of interest (optional)</label>
                  <select value={selectedMenu} onChange={(e) => setSelectedMenu(e.target.value)} className={inputClass}>
                    <option value="">No preference</option>
                    {menus.map((menu) => (
                      <option key={menu.slug} value={menu.title}>
                        {menu.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium opacity-70">Full name</label>
                  <input value={guestName} onChange={(e) => setGuestName(e.target.value)} required className={inputClass} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium opacity-70">Phone (optional)</label>
                  <input value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} className={inputClass} />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium opacity-70">Email</label>
                <input
                  type="email"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  required
                  className={inputClass}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium opacity-70">Special requests (optional)</label>
                <textarea
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  rows={2}
                  placeholder="Dietary requirements, occasion, seating preference…"
                  className={inputClass}
                />
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-coral py-3 text-sm font-semibold text-abyss shadow-lg shadow-abyss/10 transition hover:-translate-y-0.5 hover:bg-coral-lift hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
              >
                {submitting ? "Sending…" : "Request reservation"}
              </button>
              <p className="text-center text-xs opacity-50">This is a request, not a confirmed booking.</p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
