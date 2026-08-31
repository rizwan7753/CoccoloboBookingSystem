"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { eventApi, EventItem, TierAvailability } from "@/lib/eventApi";
import CheckoutForm from "@/components/CheckoutForm";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "");

type Step = "select" | "details" | "payment";
const STEPS: { key: Step; label: string }[] = [
  { key: "select", label: "Tickets" },
  { key: "details", label: "Your details" },
  { key: "payment", label: "Payment" },
];

const inputClass =
  "w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-fuchsia-600 focus:outline-none focus:ring-1 focus:ring-fuchsia-600";

function Stepper({ step }: { step: Step }) {
  const activeIndex = STEPS.findIndex((s) => s.key === step);
  return (
    <div className="mb-5 flex items-center gap-2">
      {STEPS.map((s, i) => (
        <div key={s.key} className="flex flex-1 items-center gap-2">
          <div
            className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
              i <= activeIndex ? "bg-fuchsia-700 text-white" : "bg-stone-100 text-stone-400"
            }`}
          >
            {i < activeIndex ? "✓" : i + 1}
          </div>
          <span className={`hidden text-xs font-medium sm:inline ${i <= activeIndex ? "text-stone-700" : "text-stone-400"}`}>
            {s.label}
          </span>
          {i < STEPS.length - 1 && <div className={`h-px flex-1 ${i < activeIndex ? "bg-fuchsia-700" : "bg-stone-200"}`} />}
        </div>
      ))}
    </div>
  );
}

export default function EventBookingWidget({ event }: { event: EventItem }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("select");
  const [tiers, setTiers] = useState<TierAvailability[]>([]);
  const [loadingTiers, setLoadingTiers] = useState(true);
  const [selectedTierId, setSelectedTierId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [roomNumber, setRoomNumber] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);

  useEffect(() => {
    eventApi
      .getAvailability(event.id)
      .then((data) => {
        setTiers(data);
        if (data[0]) setSelectedTierId(data[0].id);
      })
      .finally(() => setLoadingTiers(false));
  }, [event.id]);

  const selectedTier = tiers.find((t) => t.id === selectedTierId);
  const total = selectedTier ? Number(selectedTier.price) * quantity : 0;
  const exceedsRemaining = Boolean(selectedTier && quantity > selectedTier.remaining);

  async function refreshAvailability() {
    try {
      setTiers(await eventApi.getAvailability(event.id));
    } catch {
      // best-effort refresh; the create-booking error already told the guest what happened
    }
  }

  async function handleCreateBooking() {
    if (!selectedTierId) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await eventApi.createBooking({
        eventId: event.id,
        tierId: selectedTierId,
        quantity,
        guestName,
        guestEmail,
        guestPhone: guestPhone || undefined,
        roomNumber: roomNumber || undefined,
      });
      if (result.devBypass || !result.clientSecret) {
        router.push(`/events/confirmation/${result.bookingId}`);
        return;
      }
      setClientSecret(result.clientSecret);
      setBookingId(result.bookingId);
      setStep("payment");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create booking");
      refreshAvailability();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="sticky top-24 rounded-2xl border border-stone-200 bg-white p-5 shadow-xl shadow-stone-200/50">
      <Stepper step={step} />

      {step === "select" && (
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">Ticket type</label>
            {loadingTiers ? (
              <p className="text-sm text-stone-400">Loading tickets…</p>
            ) : tiers.length === 0 ? (
              <p className="text-sm text-stone-400">No ticket tiers available.</p>
            ) : (
              <div className="space-y-2">
                {tiers.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    disabled={t.remaining <= 0}
                    onClick={() => setSelectedTierId(t.id)}
                    className={`w-full rounded-lg border px-3 py-2.5 text-left text-sm transition ${
                      selectedTierId === t.id
                        ? "border-fuchsia-600 bg-fuchsia-50"
                        : "border-stone-300 hover:border-fuchsia-400"
                    } ${t.remaining <= 0 ? "cursor-not-allowed border-stone-200 bg-stone-50 opacity-70" : ""}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-stone-900">{t.name}</span>
                      <span className="font-semibold text-stone-900">${Number(t.price).toFixed(2)}</span>
                    </div>
                    {t.description && <p className="mt-0.5 text-xs text-stone-500">{t.description}</p>}
                    <p className="mt-0.5 text-xs text-stone-400">
                      {t.remaining <= 0 ? "Sold out" : `${t.remaining} of ${t.capacity} left`}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">Quantity</label>
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
              className={inputClass}
            />
          </div>

          {exceedsRemaining && selectedTier && (
            <p className="text-sm text-rose-600">
              Only {selectedTier.remaining} ticket{selectedTier.remaining === 1 ? "" : "s"} left at {selectedTier.name}.
            </p>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex items-center justify-between border-t border-stone-100 pt-3 text-sm font-semibold text-stone-900">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>

          <button
            type="button"
            disabled={!selectedTierId || quantity < 1 || exceedsRemaining}
            onClick={() => setStep("details")}
            className="w-full rounded-lg bg-fuchsia-700 py-2.5 text-sm font-semibold text-white transition hover:bg-fuchsia-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Continue
          </button>
        </div>
      )}

      {step === "details" && (
        <div className="space-y-3">
          <input placeholder="Full name" value={guestName} onChange={(e) => setGuestName(e.target.value)} className={inputClass} />
          <input placeholder="Email" type="email" value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} className={inputClass} />
          <input placeholder="Phone (optional)" value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} className={inputClass} />
          <input
            placeholder="Room / villa number (optional)"
            value={roomNumber}
            onChange={(e) => setRoomNumber(e.target.value)}
            className={inputClass}
          />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="button"
            disabled={!guestName || !guestEmail || submitting}
            onClick={handleCreateBooking}
            className="w-full rounded-lg bg-fuchsia-700 py-2.5 text-sm font-semibold text-white transition hover:bg-fuchsia-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {submitting ? "Reserving your tickets…" : "Continue to payment"}
          </button>
          <button type="button" onClick={() => setStep("select")} className="w-full py-1 text-sm text-stone-500 hover:text-stone-700">
            Back
          </button>
        </div>
      )}

      {step === "payment" && clientSecret && bookingId && (
        <div>
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <CheckoutForm bookingId={bookingId} confirmationBasePath="/events/confirmation" />
          </Elements>
        </div>
      )}
    </div>
  );
}
