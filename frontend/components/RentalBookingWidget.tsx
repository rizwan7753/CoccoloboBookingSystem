"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Elements } from "@stripe/react-stripe-js";
import { rentalApi, RentalItem, RentalAvailability } from "@/lib/rentalApi";
import { settingsApi, PublicSettings } from "@/lib/settingsApi";
import { getStripePromise } from "@/lib/stripeClient";
import CheckoutForm from "@/components/CheckoutForm";
import NmiCardForm from "@/components/NmiCardForm";

type Step = "select" | "details" | "payment";
const STEPS: { key: Step; label: string }[] = [
  { key: "select", label: "Date, time & spot" },
  { key: "details", label: "Your details" },
  { key: "payment", label: "Payment" },
];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

const inputClass =
  "w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600";

function Stepper({ step }: { step: Step }) {
  const activeIndex = STEPS.findIndex((s) => s.key === step);
  return (
    <div className="mb-5 flex items-center gap-2">
      {STEPS.map((s, i) => (
        <div key={s.key} className="flex flex-1 items-center gap-2">
          <div
            className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
              i <= activeIndex ? "bg-amber-600 text-white" : "bg-stone-100 text-stone-400"
            }`}
          >
            {i < activeIndex ? "✓" : i + 1}
          </div>
          <span className={`hidden text-xs font-medium sm:inline ${i <= activeIndex ? "text-stone-700" : "text-stone-400"}`}>
            {s.label}
          </span>
          {i < STEPS.length - 1 && <div className={`h-px flex-1 ${i < activeIndex ? "bg-amber-600" : "bg-stone-200"}`} />}
        </div>
      ))}
    </div>
  );
}

export default function RentalBookingWidget({ item }: { item: RentalItem }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("select");
  const [date, setDate] = useState(todayISO());
  const [selectedTimeSlotId, setSelectedTimeSlotId] = useState<string | null>(item.timeSlots?.[0]?.id ?? null);
  const [availability, setAvailability] = useState<RentalAvailability | null>(null);
  const [loadingSpots, setLoadingSpots] = useState(Boolean(item.timeSlots?.[0]));
  const [selectedSpotId, setSelectedSpotId] = useState<string | null>(null);
  const [adultCount, setAdultCount] = useState(1);
  const [childCount, setChildCount] = useState(0);

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

  const priceAdult = Number(item.priceAdult);
  const priceChild = Number(item.priceChild ?? 0);
  const requestedQuantity = adultCount + childCount;
  const total = priceAdult * adultCount + priceChild * childCount;
  const selectedSpot = availability?.spots.find((s) => s.id === selectedSpotId);
  const exceedsRemaining = Boolean(selectedSpot && requestedQuantity > selectedSpot.remaining);

  // Pure fetch — no synchronous state resets here, so it's safe to call
  // directly from the mount effect below (the only setState calls happen
  // after the `await`, inside the try/catch/finally).
  async function fetchAvailability(forDate: string, timeSlotId: string) {
    try {
      setAvailability(await rentalApi.getAvailability(item.id, forDate, timeSlotId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load availability");
    } finally {
      setLoadingSpots(false);
    }
  }

  // User-triggered date/time-slot changes: reset selection synchronously
  // (fine here — this runs in an event handler, not an effect), then fetch.
  function changeSelection(forDate: string, timeSlotId: string | null) {
    setSelectedSpotId(null);
    setError(null);
    if (!timeSlotId) {
      setAvailability(null);
      setLoadingSpots(false);
      return;
    }
    setLoadingSpots(true);
    fetchAvailability(forDate, timeSlotId);
  }

  useEffect(() => {
    // fetchAvailability's setState calls happen after its internal `await`, not
    // synchronously here — this is a one-time load using the pre-selected time slot.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (selectedTimeSlotId) fetchAvailability(date, selectedTimeSlotId);
    // Intentionally runs once on mount only — later date/time-slot changes go
    // through changeSelection() instead, not this effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCreateBooking() {
    if (!selectedSpotId || !selectedTimeSlotId) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await rentalApi.createBooking({
        rentalItemId: item.id,
        spotId: selectedSpotId,
        timeSlotId: selectedTimeSlotId,
        date,
        guestName,
        guestEmail,
        guestPhone: guestPhone || undefined,
        roomNumber: roomNumber || undefined,
        adultCount,
        childCount,
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
        router.push(`/beach-chairs/confirmation/${result.bookingId}`);
        return;
      }
      setClientSecret(result.clientSecret);
      setBookingId(result.bookingId);
      setStep("payment");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create booking");
      // Availability may have shifted under us (someone else just booked) — refresh it.
      if (selectedTimeSlotId) fetchAvailability(date, selectedTimeSlotId);
    } finally {
      setSubmitting(false);
    }
  }

  const activeTimeSlots = item.timeSlots?.filter((t) => t.isActive) ?? [];

  return (
    <div className="sticky top-24 rounded-2xl border border-stone-200 bg-white p-5 shadow-xl shadow-stone-200/50">
      <Stepper step={step} />

      <div className="mb-4 flex items-baseline gap-1.5">
        <span className="text-2xl font-bold text-stone-900">${priceAdult.toFixed(2)}</span>
        <span className="text-sm text-stone-400">/ adult</span>
      </div>

      {step === "select" && (
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">Date</label>
            <input
              type="date"
              min={todayISO()}
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                changeSelection(e.target.value, selectedTimeSlotId);
              }}
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">Time slot</label>
            {activeTimeSlots.length === 0 ? (
              <p className="text-sm text-stone-400">No time slots configured for this rental.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {activeTimeSlots.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setSelectedTimeSlotId(t.id);
                      changeSelection(date, t.id);
                    }}
                    className={`rounded-lg border px-3 py-1.5 text-sm transition ${
                      selectedTimeSlotId === t.id
                        ? "border-amber-600 bg-amber-600 text-white"
                        : "border-stone-300 text-stone-700 hover:border-amber-500"
                    }`}
                  >
                    {t.label}
                    <span className="ml-1 opacity-75">
                      ({t.startTime}–{t.endTime})
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {availability?.holidayLabel ? (
            <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              <svg className="mt-0.5 h-4 w-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M12 9v4M12 17h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L14.71 3.86a2 2 0 0 0-3.42 0Z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>
                Closed for <strong>{availability.holidayLabel}</strong> — pick another date.
              </span>
            </div>
          ) : (
            availability && (
              <div className="flex items-center justify-between rounded-lg bg-amber-50 px-3 py-2 text-sm">
                <span className="text-amber-900">Remaining in this slot</span>
                <span className="font-semibold text-amber-900">
                  {availability.remainingChairs} of {availability.totalChairs} chairs
                </span>
              </div>
            )
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">Pick a spot</label>
            {loadingSpots ? (
              <p className="text-sm text-stone-400">Checking availability…</p>
            ) : !availability || availability.spots.length === 0 ? (
              <p className="text-sm text-stone-400">Select a time slot to see spots.</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {availability.spots.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    disabled={s.remaining <= 0}
                    onClick={() => setSelectedSpotId(s.id)}
                    className={`rounded-lg border px-3 py-2 text-left text-sm transition ${
                      selectedSpotId === s.id
                        ? "border-amber-600 bg-amber-600 text-white"
                        : "border-stone-300 text-stone-700 hover:border-amber-500"
                    } ${s.remaining <= 0 ? "cursor-not-allowed border-stone-200 bg-stone-50 text-stone-300 opacity-70" : ""}`}
                  >
                    {s.code}
                    <span className="block text-xs opacity-75">
                      {s.remaining <= 0 ? "Fully booked" : `${s.remaining} of ${s.quantity} left`}
                    </span>
                  </button>
                ))}
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
          <p className="text-xs text-stone-400">One chair is reserved per guest — {requestedQuantity} chair{requestedQuantity === 1 ? "" : "s"} total.</p>

          {exceedsRemaining && selectedSpot && (
            <p className="text-sm text-rose-600">
              Only {selectedSpot.remaining} chair{selectedSpot.remaining === 1 ? "" : "s"} left at {selectedSpot.code} — reduce guests or pick another spot.
            </p>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex items-center justify-between border-t border-stone-100 pt-3 text-sm font-semibold text-stone-900">
            <span>Total{selectedSpot ? ` (${selectedSpot.code})` : ""}</span>
            <span>${total.toFixed(2)}</span>
          </div>

          <button
            type="button"
            disabled={!selectedSpotId || !selectedTimeSlotId || requestedQuantity < 1 || exceedsRemaining || Boolean(availability?.holidayLabel)}
            onClick={() => setStep("details")}
            className="w-full rounded-lg bg-amber-600 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-40"
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
            className="w-full rounded-lg bg-amber-600 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {submitting ? "Reserving your spot…" : paymentMethod === "offline" ? "Submit booking" : "Continue to payment"}
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
            onClick={() => router.push(`/beach-chairs/confirmation/${bookingId}`)}
            className="w-full rounded-lg bg-amber-600 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-700"
          >
            View booking
          </button>
        </div>
      )}

      {step === "payment" && nmiPending && bookingId && settings?.nmiTokenizationKey && (
        <NmiCardForm
          tokenizationKey={settings.nmiTokenizationKey}
          onToken={async (token) => {
            await rentalApi.chargeNmi(bookingId, token);
            router.push(`/beach-chairs/confirmation/${bookingId}`);
          }}
        />
      )}

      {step === "payment" && !offlinePending && !nmiPending && clientSecret && bookingId && (
        <div>
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <CheckoutForm bookingId={bookingId} confirmationBasePath="/beach-chairs/confirmation" />
          </Elements>
        </div>
      )}
    </div>
  );
}
