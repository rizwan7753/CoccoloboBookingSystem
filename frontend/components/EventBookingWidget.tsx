"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Elements } from "@stripe/react-stripe-js";
import { eventApi, EventItem, TierAvailability } from "@/lib/eventApi";
import { settingsApi, PublicSettings } from "@/lib/settingsApi";
import { getStripePromise } from "@/lib/stripeClient";
import CheckoutForm from "@/components/CheckoutForm";
import NmiCardForm from "@/components/NmiCardForm";

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
  const [offlinePending, setOfflinePending] = useState(false);
  const [nmiPending, setNmiPending] = useState(false);

  const [settings, setSettings] = useState<PublicSettings | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"stripe" | "offline" | "nmi">("stripe");

  const availablePaymentMethodCount = [settings?.stripeEnabled, settings?.nmiEnabled, settings?.offlinePaymentEnabled].filter(
    Boolean
  ).length;

  useEffect(() => {
    eventApi
      .getAvailability(event.id)
      .then((data) => {
        setTiers(data);
        if (data[0]) setSelectedTierId(data[0].id);
      })
      .finally(() => setLoadingTiers(false));
  }, [event.id]);

  useEffect(() => {
    settingsApi.getSettings().then((s) => {
      setSettings(s);
      setPaymentMethod(s.stripeEnabled ? "stripe" : s.nmiEnabled ? "nmi" : "offline");
    });
  }, []);

  const stripePromise = getStripePromise(settings?.stripePublishableKey);

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
        paymentMethod,
      });
      if (result.offlinePending) {
        setOfflinePending(true);
        setBookingId(result.bookingId);
        setStep("payment");
        return;
      }
      if (result.nmiPending) {
        setNmiPending(true);
        setBookingId(result.bookingId);
        setStep("payment");
        return;
      }
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

          {availablePaymentMethodCount > 1 && (
            <div className="space-y-2 rounded-lg border border-stone-200 p-3">
              <p className="text-sm font-medium text-stone-700">Payment method</p>
              {settings?.stripeEnabled && (
                <label className="flex items-center gap-2 text-sm text-stone-600">
                  <input type="radio" checked={paymentMethod === "stripe"} onChange={() => setPaymentMethod("stripe")} />
                  Pay by card
                </label>
              )}
              {settings?.nmiEnabled && (
                <label className="flex items-center gap-2 text-sm text-stone-600">
                  <input type="radio" checked={paymentMethod === "nmi"} onChange={() => setPaymentMethod("nmi")} />
                  Pay by card (alternate)
                </label>
              )}
              {settings?.offlinePaymentEnabled && (
                <label className="flex items-center gap-2 text-sm text-stone-600">
                  <input type="radio" checked={paymentMethod === "offline"} onChange={() => setPaymentMethod("offline")} />
                  Pay by bank transfer
                </label>
              )}
            </div>
          )}

          {paymentMethod === "offline" && settings?.offlinePaymentInstructions && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
              <p className="font-medium">Pay to the below details:</p>
              <p className="mt-1 whitespace-pre-line">{settings.offlinePaymentInstructions}</p>
              {settings.offlinePaymentReceiptEmail && (
                <p className="mt-2">
                  After paying, send your receipt (with the booking ID we&apos;ll give you) to{" "}
                  <span className="font-medium">{settings.offlinePaymentReceiptEmail}</span>.
                </p>
              )}
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="button"
            disabled={!guestName || !guestEmail || submitting}
            onClick={handleCreateBooking}
            className="w-full rounded-lg bg-fuchsia-700 py-2.5 text-sm font-semibold text-white transition hover:bg-fuchsia-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {submitting ? "Reserving your tickets…" : paymentMethod === "offline" ? "Submit booking" : "Continue to payment"}
          </button>
          <button type="button" onClick={() => setStep("select")} className="w-full py-1 text-sm text-stone-500 hover:text-stone-700">
            Back
          </button>
        </div>
      )}

      {step === "payment" && offlinePending && bookingId && (
        <div className="space-y-3">
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
            <p className="font-semibold">Booking received — pending payment</p>
            <p className="mt-1">We&apos;ve held your tickets. Pay to the below details, then send your receipt to confirm.</p>
            {settings?.offlinePaymentInstructions && (
              <p className="mt-2 whitespace-pre-line text-amber-800">{settings.offlinePaymentInstructions}</p>
            )}
            {settings?.offlinePaymentReceiptEmail && (
              <p className="mt-2">
                Send your payment receipt — referencing booking ID <span className="font-semibold">{bookingId}</span> —
                to{" "}
                <a href={`mailto:${settings.offlinePaymentReceiptEmail}`} className="font-semibold underline">
                  {settings.offlinePaymentReceiptEmail}
                </a>
                .
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => router.push(`/events/confirmation/${bookingId}`)}
            className="w-full rounded-lg bg-fuchsia-700 py-2.5 text-sm font-semibold text-white transition hover:bg-fuchsia-800"
          >
            View booking
          </button>
        </div>
      )}

      {step === "payment" && nmiPending && bookingId && settings?.nmiTokenizationKey && (
        <NmiCardForm
          tokenizationKey={settings.nmiTokenizationKey}
          gatewayDomain={settings.nmiGatewayDomain ?? "secure.nmi.com"}
          amount={total.toFixed(2)}
          onToken={async (token) => {
            await eventApi.chargeNmi(bookingId, token);
            router.push(`/events/confirmation/${bookingId}`);
          }}
        />
      )}

      {step === "payment" && !offlinePending && !nmiPending && clientSecret && bookingId && (
        <div>
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <CheckoutForm bookingId={bookingId} confirmationBasePath="/events/confirmation" />
          </Elements>
        </div>
      )}
    </div>
  );
}
