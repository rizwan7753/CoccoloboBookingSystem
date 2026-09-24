"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Elements } from "@stripe/react-stripe-js";
import { eventApi, EventItem, TierAvailability } from "@/lib/eventApi";
import { settingsApi, PublicSettings } from "@/lib/settingsApi";
import { getStripePromise } from "@/lib/stripeClient";
import CheckoutForm from "@/components/CheckoutForm";
import NmiCardForm from "@/components/NmiCardForm";
import { useCart } from "@/components/site/CartContext";
import { mediaUrl } from "@/lib/media";

type Step = "select" | "details" | "payment";
const STEPS: { key: Step; label: string }[] = [
  { key: "select", label: "Tickets" },
  { key: "details", label: "Your details" },
  { key: "payment", label: "Payment" },
];

const inputClass =
  "w-full rounded-lg border border-rule px-3 py-2.5 text-sm text-abyss placeholder:text-abyss/45 focus:border-coral focus:outline-none focus:ring-1 focus:ring-coral";

function Stepper({ step }: { step: Step }) {
  const activeIndex = STEPS.findIndex((s) => s.key === step);
  return (
    <div className="mb-5 flex items-center gap-2">
      {STEPS.map((s, i) => (
        <div key={s.key} className="flex flex-1 items-center gap-2">
          <div
            className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
              i <= activeIndex ? "bg-coral text-abyss" : "bg-foam text-abyss/45"
            }`}
          >
            {i < activeIndex ? "✓" : i + 1}
          </div>
          <span className={`hidden text-xs font-medium sm:inline ${i <= activeIndex ? "text-abyss" : "text-abyss/45"}`}>
            {s.label}
          </span>
          {i < STEPS.length - 1 && <div className={`h-px flex-1 ${i < activeIndex ? "bg-coral" : "bg-rule"}`} />}
        </div>
      ))}
    </div>
  );
}

export default function EventBookingWidget({ event }: { event: EventItem }) {
  const router = useRouter();
  const cart = useCart();
  const [addedToCart, setAddedToCart] = useState(false);
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
  const [bookingCode, setBookingCode] = useState<string | null>(null);
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
        setBookingCode(result.bookingCode ?? null);
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
    <div className="sticky top-24 rounded-2xl border border-rule bg-white p-5 shadow-xl shadow-abyss/10">
      <Stepper step={step} />

      {step === "select" && (
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-abyss">Ticket type</label>
            {loadingTiers ? (
              <p className="text-sm text-abyss/45">Loading tickets…</p>
            ) : tiers.length === 0 ? (
              <p className="text-sm text-abyss/45">No ticket tiers available.</p>
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
                        ? "border-coral bg-foam"
                        : "border-rule hover:border-coral"
                    } ${t.remaining <= 0 ? "cursor-not-allowed border-rule bg-shell opacity-70" : ""}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-abyss">{t.name}</span>
                      <span className="font-semibold text-abyss">${Number(t.price).toFixed(2)}</span>
                    </div>
                    {t.description && <p className="mt-0.5 text-xs text-abyss/60">{t.description}</p>}
                    <p className="mt-0.5 text-xs text-abyss/45">
                      {t.remaining <= 0 ? "Sold out" : `${t.remaining} of ${t.capacity} left`}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-abyss">Quantity</label>
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

          <div className="flex items-center justify-between border-t border-rule pt-3 text-sm font-semibold text-abyss">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>

          <button
            type="button"
            disabled={!selectedTierId || quantity < 1 || exceedsRemaining}
            onClick={() => {
              cart.addItem(
                { type: "event", eventId: event.id, tierId: selectedTierId!, quantity },
                {
                  title: event.title,
                  subtitle: `${selectedTier?.name ?? ""} x${quantity}`,
                  price: total,
                  photo: mediaUrl(event.cardImageUrl),
                }
              );
              setAddedToCart(true);
              setTimeout(() => setAddedToCart(false), 2500);
            }}
            className="w-full rounded-lg bg-aqua py-2.5 text-sm font-semibold text-abyss transition hover:bg-aqua-lift disabled:cursor-not-allowed disabled:opacity-40"
          >
            {addedToCart ? "Added to cart ✓" : "Add to cart (combine with other bookings)"}
          </button>
          <button
            type="button"
            disabled={!selectedTierId || quantity < 1 || exceedsRemaining}
            onClick={() => setStep("details")}
            className="w-full rounded-lg bg-coral py-2.5 text-sm font-semibold text-abyss transition hover:bg-coral-lift disabled:cursor-not-allowed disabled:opacity-40"
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
            <div className="space-y-2 rounded-lg border border-rule p-3">
              <p className="text-sm font-medium text-abyss">Payment method</p>
              {settings?.stripeEnabled && (
                <label className="flex items-center gap-2 text-sm text-abyss/70">
                  <input type="radio" checked={paymentMethod === "stripe"} onChange={() => setPaymentMethod("stripe")} />
                  Pay by card
                </label>
              )}
              {settings?.nmiEnabled && (
                <label className="flex items-center gap-2 text-sm text-abyss/70">
                  <input type="radio" checked={paymentMethod === "nmi"} onChange={() => setPaymentMethod("nmi")} />
                  Pay by card (alternate)
                </label>
              )}
              {settings?.offlinePaymentEnabled && (
                <label className="flex items-center gap-2 text-sm text-abyss/70">
                  <input type="radio" checked={paymentMethod === "offline"} onChange={() => setPaymentMethod("offline")} />
                  Pay by bank transfer
                </label>
              )}
            </div>
          )}

          {paymentMethod === "offline" && settings?.offlinePaymentInstructions && (
            <div className="rounded-lg border border-rule bg-sand px-3 py-2.5 text-sm text-abyss">
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
            className="w-full rounded-lg bg-coral py-2.5 text-sm font-semibold text-abyss transition hover:bg-coral-lift disabled:cursor-not-allowed disabled:opacity-40"
          >
            {submitting ? "Reserving your tickets…" : paymentMethod === "offline" ? "Submit booking" : "Continue to payment"}
          </button>
          <button type="button" onClick={() => setStep("select")} className="w-full py-1 text-sm text-abyss/60 hover:text-abyss">
            Back
          </button>
        </div>
      )}

      {step === "payment" && offlinePending && bookingId && (
        <div className="space-y-3">
          <div className="rounded-lg border border-rule bg-sand px-3 py-2.5 text-sm text-abyss">
            <p className="font-semibold">Booking received — pending payment</p>
            <p className="mt-1">We&apos;ve held your tickets. Pay to the below details, then send your receipt to confirm.</p>
            {settings?.offlinePaymentInstructions && (
              <p className="mt-2 whitespace-pre-line text-abyss/80">{settings.offlinePaymentInstructions}</p>
            )}
            {settings?.offlinePaymentReceiptEmail && (
              <p className="mt-2">
                Send your payment receipt — referencing booking ID{" "}
                <span className="font-semibold">{bookingCode ?? bookingId}</span> —
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
            className="w-full rounded-lg bg-coral py-2.5 text-sm font-semibold text-abyss transition hover:bg-coral-lift"
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
