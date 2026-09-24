"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Elements } from "@stripe/react-stripe-js";
import { api, AvailabilityDay, Excursion } from "@/lib/api";
import { formatTimeRange } from "@/lib/time";
import { settingsApi, PublicSettings } from "@/lib/settingsApi";
import { getStripePromise } from "@/lib/stripeClient";
import CheckoutForm from "@/components/CheckoutForm";
import NmiCardForm from "@/components/NmiCardForm";
import { useCart } from "@/components/site/CartContext";
import { mediaUrl } from "@/lib/media";

type Step = "select" | "details" | "payment";
const STEPS: { key: Step; label: string }[] = [
  { key: "select", label: "Date & time" },
  { key: "details", label: "Your details" },
  { key: "payment", label: "Payment" },
];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

/** Tomorrow, not today — every excursion closes for booking the evening
 *  before, so today is always past cutoff and shouldn't be the default a
 *  first-time visitor sees. */
function tomorrowISO() {
  return new Date(Date.now() + 86400000).toISOString().slice(0, 10);
}

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

export default function BookingWidget({ excursion }: { excursion: Excursion }) {
  const router = useRouter();
  const cart = useCart();
  const [addedToCart, setAddedToCart] = useState(false);
  const [step, setStep] = useState<Step>("select");
  const [date, setDate] = useState(tomorrowISO());
  const [slots, setSlots] = useState<AvailabilityDay[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [adultCount, setAdultCount] = useState(2);
  const [childCount, setChildCount] = useState(0);

  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [roomNumber, setRoomNumber] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [bookingCode, setBookingCode] = useState<string | null>(null);
  const [offlinePending, setOfflinePending] = useState(false);
  const [nmiPending, setNmiPending] = useState(false);

  const [settings, setSettings] = useState<PublicSettings | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"stripe" | "offline" | "nmi">("stripe");

  useEffect(() => {
    settingsApi.getSettings().then((s) => {
      setSettings(s);
      setPaymentMethod(s.stripeEnabled ? "stripe" : s.nmiEnabled ? "nmi" : "offline");
    });
  }, []);

  const availablePaymentMethodCount = [settings?.stripeEnabled, settings?.nmiEnabled, settings?.offlinePaymentEnabled].filter(
    Boolean
  ).length;

  const stripePromise = getStripePromise(settings?.stripePublishableKey);

  const isFlatRate = excursion.pricingType === "FLAT_RATE";
  const priceAdult = Number(excursion.priceAdult);
  const priceChild = Number(excursion.priceChild ?? 0);
  const total = isFlatRate ? priceAdult : priceAdult * adultCount + priceChild * childCount;
  const totalGuests = adultCount + childCount;
  const selectedSlot = slots.find((s) => s.time === selectedTime);
  const exceedsRemaining = Boolean(selectedSlot && totalGuests > selectedSlot.remaining);
  const belowMinimum = totalGuests > 0 && totalGuests < excursion.minGuests;
  const canProceed = Boolean(selectedTime) && totalGuests >= 1 && !exceedsRemaining && !belowMinimum;

  async function loadAvailability(newDate: string, preselectTime?: string) {
    setDate(newDate);
    setSelectedTime(null);
    setLoadingSlots(true);
    setError(null);
    try {
      const days = await api.getAvailability(excursion.id, newDate, newDate);
      setSlots(days);
      if (preselectTime && days.some((d) => d.time === preselectTime && !d.bookingClosed && d.remaining > 0)) {
        setSelectedTime(preselectTime);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load availability");
    } finally {
      setLoadingSlots(false);
    }
  }

  // Load availability for the default (or link-provided) date as soon as the
  // widget mounts — without this, a first-time visitor sees "No departures
  // on this date" until they manually touch the date field, since nothing
  // ever fetches for the pre-filled value. Also honors ?date=&time= carried
  // over from the homepage "Check availability" widget's Book link, so the
  // slot a guest already confirmed is available doesn't get silently reset.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const linkedDate = params.get("date");
    const linkedTime = params.get("time");
    const initialDate = linkedDate && linkedDate >= todayISO() ? linkedDate : tomorrowISO();
    loadAvailability(initialDate, linkedTime ?? undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCreateBooking() {
    if (!selectedTime) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await api.createBooking({
        excursionId: excursion.id,
        date,
        time: selectedTime,
        guestName,
        guestEmail,
        guestPhone: guestPhone || undefined,
        roomNumber: roomNumber || undefined,
        specialRequests: specialRequests || undefined,
        adultCount,
        childCount,
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
        // Local dev without a real Stripe key: booking is already auto-confirmed server-side.
        router.push(`/booking/confirmation/${result.bookingId}`);
        return;
      }
      setClientSecret(result.clientSecret);
      setBookingId(result.bookingId);
      setStep("payment");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create booking");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="sticky top-24 rounded-2xl border border-rule bg-white p-5 shadow-xl shadow-abyss/10">
      <Stepper step={step} />

      <div className="mb-4 flex items-baseline gap-1.5">
        <span className="text-2xl font-bold text-abyss">${priceAdult.toFixed(2)}</span>
        <span className="text-sm text-abyss/45">
          {isFlatRate ? `flat rate for up to ${excursion.capacityDefault} guests` : "/ adult"}
        </span>
        {!isFlatRate && priceChild > 0 && (
          <span className="ml-2 text-sm text-abyss/45">· ${priceChild.toFixed(2)} / child</span>
        )}
      </div>

      {step === "select" && (
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-abyss">Date</label>
            <input type="date" min={todayISO()} value={date} onChange={(e) => loadAvailability(e.target.value)} className={inputClass} />
          </div>

          {(() => {
            const holidayLabel = slots.find((s) => s.holidayLabel)?.holidayLabel;
            return holidayLabel ? (
              <div className="flex items-start gap-2 rounded-lg border border-rule bg-sand px-3 py-2 text-sm text-abyss">
                <svg className="mt-0.5 h-4 w-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M12 9v4M12 17h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L14.71 3.86a2 2 0 0 0-3.42 0Z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>
                  Closed for <strong>{holidayLabel}</strong> — pick another date.
                </span>
              </div>
            ) : null;
          })()}

          <div>
            <label className="mb-1 block text-sm font-medium text-abyss">Departure time</label>
            {loadingSlots ? (
              <p className="text-sm text-abyss/45">Checking availability…</p>
            ) : slots.length === 0 ? (
              <p className="text-sm text-abyss/45">No departures on this date.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {slots.map((s) => {
                  const disabled = s.bookingClosed || s.remaining <= 0;
                  return (
                    <button
                      key={s.time}
                      type="button"
                      disabled={disabled}
                      onClick={() => setSelectedTime(s.time)}
                      className={`rounded-lg border px-3 py-1.5 text-sm transition ${
                        selectedTime === s.time
                          ? "border-coral bg-coral text-abyss"
                          : "border-rule text-abyss hover:border-coral"
                      } ${disabled ? "cursor-not-allowed opacity-40 hover:border-rule" : ""}`}
                    >
                      {formatTimeRange(s.time, excursion.durationMinutes)}{" "}
                      <span className="opacity-75">
                        {s.holidayLabel ? "(closed)" : disabled ? (s.bookingClosed ? "(closed)" : "(sold out)") : `(${s.remaining} left)`}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium text-abyss">Adults</label>
              <input
                type="number"
                min={0}
                value={adultCount}
                onChange={(e) => setAdultCount(Math.max(0, Number(e.target.value) || 0))}
                className={inputClass}
              />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium text-abyss">Children</label>
              <input
                type="number"
                min={0}
                value={childCount}
                onChange={(e) => setChildCount(Math.max(0, Number(e.target.value) || 0))}
                className={inputClass}
              />
            </div>
          </div>

          {excursion.minGuests > 1 && (
            <p className="text-xs text-abyss/45">Minimum {excursion.minGuests} guests for this excursion.</p>
          )}
          {belowMinimum && (
            <p className="text-sm text-red-600">
              This excursion requires at least {excursion.minGuests} guests — add {excursion.minGuests - totalGuests} more.
            </p>
          )}
          {exceedsRemaining && selectedSlot && (
            <p className="text-sm text-red-600">
              Only {selectedSlot.remaining} spot{selectedSlot.remaining === 1 ? "" : "s"} left on this departure — reduce guests or pick another time.
            </p>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex items-center justify-between border-t border-rule pt-3 text-sm font-semibold text-abyss">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>

          <button
            type="button"
            disabled={!canProceed}
            onClick={() => {
              cart.addItem(
                { type: "excursion", excursionId: excursion.id, date, time: selectedTime!, adultCount, childCount },
                {
                  title: excursion.title,
                  subtitle: `${date} · ${selectedTime}`,
                  price: total,
                  photo: mediaUrl(excursion.cardImageUrl),
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
            disabled={!canProceed}
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
          <textarea
            placeholder="Special requirements / dietary / medical notes (optional)"
            value={specialRequests}
            onChange={(e) => setSpecialRequests(e.target.value)}
            className={inputClass}
            rows={2}
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
            {submitting
              ? "Holding your spot…"
              : paymentMethod === "offline"
                ? "Submit booking"
                : "Continue to payment"}
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
            <p className="mt-1">We&apos;ve held your spot. Pay to the below details, then send your receipt to confirm.</p>
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
            onClick={() => router.push(`/booking/confirmation/${bookingId}`)}
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
            await api.chargeNmi(bookingId, token);
            router.push(`/booking/confirmation/${bookingId}`);
          }}
        />
      )}

      {step === "payment" && !offlinePending && !nmiPending && clientSecret && bookingId && (
        <div>
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <CheckoutForm bookingId={bookingId} />
          </Elements>
        </div>
      )}
    </div>
  );
}
