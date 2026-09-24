"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { bookingLookupApi, CONFIRMATION_PATH } from "@/lib/bookingLookupApi";

const inputClass =
  "w-full rounded-lg border border-rule px-3 py-2.5 text-sm text-abyss placeholder:text-abyss/45 focus:border-coral focus:outline-none focus:ring-1 focus:ring-coral";

export default function FindBookingPage() {
  const router = useRouter();
  const [bookingCode, setBookingCode] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const result = await bookingLookupApi.find(bookingCode.trim(), email.trim());
      router.push(`${CONFIRMATION_PATH[result.type]}/${result.bookingId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Booking not found");
      setSubmitting(false);
    }
  }

  return (
    <main className="site-body mx-auto max-w-md px-4 py-20 sm:px-6">
      <h1 className="font-display text-3xl text-abyss">Find my booking</h1>
      <p className="mt-2 text-sm opacity-70">
        Enter the booking reference from your confirmation email along with the email address you booked with.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4 rounded-2xl border border-rule bg-white p-6 shadow-sm">
        <div>
          <label className="mb-1 block text-sm font-medium text-abyss">Booking reference</label>
          <input
            value={bookingCode}
            onChange={(e) => setBookingCode(e.target.value)}
            placeholder="COCO_EXC_20260905_0001"
            required
            className={`${inputClass} font-mono uppercase`}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-abyss">Email address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className={inputClass}
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button type="submit" disabled={submitting} className="btn w-full">
          {submitting ? "Looking up…" : "Find booking"}
        </button>
      </form>
    </main>
  );
}
