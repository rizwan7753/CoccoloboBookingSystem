"use client";

import { useState } from "react";
import Link from "next/link";
import { restaurantApi } from "@/lib/restaurantApi";

const inputClass =
  "w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-rose-700 focus:outline-none focus:ring-1 focus:ring-rose-700";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function RestaurantReservationsPage() {
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [partySize, setPartySize] = useState(2);
  const [date, setDate] = useState(todayISO());
  const [time, setTime] = useState("19:00");
  const [specialRequests, setSpecialRequests] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await restaurantApi.createReservation({
        guestName,
        guestEmail,
        guestPhone: guestPhone || undefined,
        partySize,
        date,
        time,
        specialRequests: specialRequests || undefined,
      });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit reservation request");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <main className="mx-auto max-w-md px-4 py-20 text-center sm:px-6">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-rose-100">
          <svg className="h-8 w-8 text-rose-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 className="font-display text-3xl font-bold text-stone-900">Request received</h1>
        <p className="mt-2 text-stone-500">
          Thanks, {guestName.split(" ")[0]} — we&apos;ve emailed you a confirmation that we received your request. A member
          of staff will be in touch shortly to confirm your table.
        </p>
        <Link href="/restaurant" className="mt-8 inline-block text-sm font-medium text-rose-800 hover:text-rose-900">
          ← Back to Restaurant
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-16 sm:px-6">
      <h1 className="font-display text-3xl font-bold text-stone-900">Reserve a table</h1>
      <p className="mt-2 text-sm text-stone-500">
        This is a request, not a confirmed booking — no card needed. We&apos;ll follow up by phone or email to confirm
        your table.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">Date</label>
            <input type="date" min={todayISO()} value={date} onChange={(e) => setDate(e.target.value)} required className={inputClass} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">Time</label>
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} required className={inputClass} />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">Party size</label>
          <input
            type="number"
            min={1}
            value={partySize}
            onChange={(e) => setPartySize(Math.max(1, Number(e.target.value)))}
            required
            className={inputClass}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">Full name</label>
          <input value={guestName} onChange={(e) => setGuestName(e.target.value)} required className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">Email</label>
          <input type="email" value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} required className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">Phone (optional)</label>
          <input value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">Special requests (optional)</label>
          <textarea
            value={specialRequests}
            onChange={(e) => setSpecialRequests(e.target.value)}
            rows={3}
            placeholder="Dietary requirements, occasion, seating preference…"
            className={inputClass}
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-stone-900 py-2.5 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Sending…" : "Request reservation"}
        </button>
      </form>
    </main>
  );
}
