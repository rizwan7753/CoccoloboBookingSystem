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

type Step = "select" | "details" | "payment";
const STEPS: { key: Step; label: string }[] = [
  { key: "select", label: "Date & time" },
  { key: "details", label: "Your details" },
  { key: "payment", label: "Payment" },
];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

const inputClass =
  "w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600";

function Stepper({ step }: { step: Step }) {
  const activeIndex = STEPS.findIndex((s) => s.key === step);
  return (
    <div className="mb-5 flex items-center gap-2">
      {STEPS.map((s, i) => (
        <div key={s.key} className="flex flex-1 items-center gap-2">
          <div
            className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
              i <= activeIndex ? "bg-teal-700 text-white" : "bg-stone-100 text-stone-400"
            }`}
          >
            {i < activeIndex ? "✓" : i + 1}
          </div>
          <span className={`hidden text-xs font-medium sm:inline ${i <= activeIndex ? "text-stone-700" : "text-stone-400"}`}>
            {s.label}
          </span>
          {i < STEPS.length - 1 && <div className={`h-px flex-1 ${i < activeIndex ? "bg-teal-700" : "bg-stone-200"}`} />}
        </div>
      ))}
    </div>
  );
}

export default function BookingWidget({ excursion }: { excursion: Excursion }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("select");
  const [date, setDate] = useState(todayISO());
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

  async function loadAvailability(newDate: string) {
    setDate(newDate);
    setSelectedTime(null);
    setLoadingSlots(true);
    setError(null);
    try {
      const days = await api.getAvailability(excursion.id, newDate, newDate);
      setSlots(days);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load availability");
    } finally {
      setLoadingSlots(false);
    }
  }

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
    <div className="sticky top-24 rounded-2xl border border-stone-200 bg-white p-5 shadow-xl shadow-stone-200/50">
      <Stepper step={step} />

      <div className="mb-4 flex items-baseline gap-1.5">
        <span className="text-2xl font-bold text-stone-900">${priceAdult.toFixed(2)}</span>
        <span className="text-sm text-stone-400">
          {isFlatRate ? `flat rate for up to ${excursion.capacityDefault} guests` : "/ adult"}
        </span>
        {!isFlatRate && priceChild > 0 && (
          <span className="ml-2 text-sm text-stone-400">· ${priceChild.toFixed(2)} / child</span>
        )}
      </div>

      {step === "select" && (
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">Date</label>
            <input type="date" min={todayISO()} value={date} onChange={(e) => loadAvailability(e.target.value)} className={inputClass} />
          </div>

          {(() => {
            const holidayLabel = slots.find((s) => s.holidayLabel)?.holidayLabel;
            return holidayLabel ? (
              <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
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
            <label className="mb-1 block text-sm font-medium text-stone-700">Departure time</label>
            {loadingSlots ? (
              <p className="text-sm text-stone-400">Checking availability…</p>
            ) : slots.length === 0 ? (
              <p className="text-sm text-stone-400">No departures on this date.</p>
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
                          ? "border-teal-700 bg-teal-700 text-white"
                          : "border-stone-300 text-stone-700 hover:border-teal-600"
                      } ${disabled ? "cursor-not-allowed opacity-40 hover:border-stone-300" : ""}`}
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
              <label className="mb-1 block text-sm font-medium text-stone-700">Adults</label>
              <input
                type="number"
                min={0}
                value={adultCount}
                onChange={(e) => setAdultCount(Math.max(0, Number(e.target.value)))}
                className={inputClass}
              />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium text-stone-700">Children</label>
              <input
                type="number"
                min={0}
                value={childCount}
                onChange={(e) => setChildCount(Math.max(0, Number(e.target.value)))}
                className={inputClass}
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex items-center justify-between border-t border-stone-100 pt-3 text-sm font-semibold text-stone-900">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>

          <button
            type="button"
            disabled={!selectedTime || adultCount + childCount < 1}
            onClick={() => setStep("details")}
            className="w-full rounded-lg bg-teal-700 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-40"
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
            className="w-full rounded-lg bg-teal-700 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {submitting
              ? "Holding your spot…"
              : paymentMethod === "offline"
                ? "Submit booking"
                : "Continue to payment"}
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
            <p className="mt-1">We&apos;ve held your spot. Pay to the below details, then send your receipt to confirm.</p>
            {settings?.offlinePaymentInstructions && (
              <p className="mt-2 whitespace-pre-line text-amber-800">{settings.offlinePaymentInstructions}</p>
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
            className="w-full rounded-lg bg-teal-700 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800"
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
