"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Elements } from "@stripe/react-stripe-js";
import { orderApi } from "@/lib/orderApi";
import { settingsApi, PublicSettings } from "@/lib/settingsApi";
import { getStripePromise } from "@/lib/stripeClient";
import CheckoutForm from "@/components/CheckoutForm";
import NmiCardForm from "@/components/NmiCardForm";
import { useCart, CartLine } from "./CartContext";

type Step = "details" | "payment";

const inputClass =
  "w-full rounded-lg border border-rule px-3 py-2.5 text-sm text-abyss placeholder:text-abyss/45 focus:border-coral focus:outline-none focus:ring-1 focus:ring-coral";

/**
 * The one real shared implementation of the guest-details + payment-method
 * step that BookingWidget/RentalBookingWidget/EventBookingWidget each
 * duplicate for their own single-item flow — used here for the order-level
 * checkout instead. Same offline/nmi/devBypass/stripe branching, same
 * CheckoutForm/NmiCardForm reuse (bookingId is just orderId here).
 */
export default function CheckoutDetailsAndPayment({
  total,
  onOrderPlaced,
}: {
  total: number;
  /** Called with the ordered items just before the cart is emptied, so the page can keep showing them (and this component) during the payment step. */
  onOrderPlaced?: (placedLines: CartLine[]) => void;
}) {
  const router = useRouter();
  const { lines, clear } = useCart();
  const [step, setStep] = useState<Step>("details");

  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [roomNumber, setRoomNumber] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [orderCode, setOrderCode] = useState<string | null>(null);
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

  const availablePaymentMethodCount = [settings?.stripeEnabled, settings?.nmiEnabled, settings?.offlinePaymentEnabled].filter(Boolean).length;
  const stripePromise = getStripePromise(settings?.stripePublishableKey);

  function finishOrder() {
    onOrderPlaced?.(lines);
    clear();
  }

  async function handleCreateOrder() {
    setSubmitting(true);
    setError(null);
    try {
      const result = await orderApi.createOrder({
        items: lines.map((l) => l.item),
        guestName,
        guestEmail,
        guestPhone: guestPhone || undefined,
        roomNumber: roomNumber || undefined,
        paymentMethod,
      });
      if (result.offlinePending) {
        setOfflinePending(true);
        setOrderId(result.orderId);
        setOrderCode(result.bookingCode ?? null);
        setStep("payment");
        finishOrder();
        return;
      }
      if (result.nmiPending) {
        setNmiPending(true);
        setOrderId(result.orderId);
        setStep("payment");
        finishOrder();
        return;
      }
      if (result.devBypass || !result.clientSecret) {
        finishOrder();
        router.push(`/order/confirmation/${result.orderId}`);
        return;
      }
      setClientSecret(result.clientSecret);
      setOrderId(result.orderId);
      setStep("payment");
      finishOrder();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create order");
    } finally {
      setSubmitting(false);
    }
  }

  if (step === "payment" && offlinePending && orderId) {
    return (
      <div className="space-y-3">
        <div className="rounded-lg border border-rule bg-sand px-3 py-2.5 text-sm text-abyss">
          <p className="font-semibold">Order received — pending payment</p>
          <p className="mt-1">We&apos;ve held your spots. Pay to the below details, then send your receipt to confirm.</p>
          {settings?.offlinePaymentInstructions && <p className="mt-2 whitespace-pre-line opacity-80">{settings.offlinePaymentInstructions}</p>}
          {settings?.offlinePaymentReceiptEmail && (
            <p className="mt-2">
              Send your payment receipt — referencing booking ID <span className="font-semibold">{orderCode ?? orderId}</span> — to{" "}
              <a href={`mailto:${settings.offlinePaymentReceiptEmail}`} className="font-semibold underline">
                {settings.offlinePaymentReceiptEmail}
              </a>
              .
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => router.push(`/order/confirmation/${orderId}`)}
          className="w-full rounded-lg bg-coral py-2.5 text-sm font-semibold text-abyss transition hover:bg-coral-lift"
        >
          View order
        </button>
      </div>
    );
  }

  if (step === "payment" && nmiPending && orderId && settings?.nmiTokenizationKey) {
    return (
      <NmiCardForm
        tokenizationKey={settings.nmiTokenizationKey}
        gatewayDomain={settings.nmiGatewayDomain ?? "secure.nmi.com"}
        amount={total.toFixed(2)}
        onToken={async (token) => {
          await orderApi.chargeNmi(orderId, token);
          router.push(`/order/confirmation/${orderId}`);
        }}
      />
    );
  }

  if (step === "payment" && !offlinePending && !nmiPending && clientSecret && orderId) {
    return (
      <Elements stripe={stripePromise} options={{ clientSecret }}>
        <CheckoutForm bookingId={orderId} confirmationBasePath="/order/confirmation" />
      </Elements>
    );
  }

  return (
    <div className="space-y-3">
      <input placeholder="Full name" value={guestName} onChange={(e) => setGuestName(e.target.value)} className={inputClass} />
      <input placeholder="Email" type="email" value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} className={inputClass} />
      <input placeholder="Phone (optional)" value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} className={inputClass} />
      <input placeholder="Room / villa number (optional)" value={roomNumber} onChange={(e) => setRoomNumber(e.target.value)} className={inputClass} />

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
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="button"
        disabled={!guestName || !guestEmail || submitting || lines.length === 0}
        onClick={handleCreateOrder}
        className="w-full rounded-lg bg-coral py-2.5 text-sm font-semibold text-abyss transition hover:bg-coral-lift disabled:cursor-not-allowed disabled:opacity-40"
      >
        {submitting ? "Placing your order…" : paymentMethod === "offline" ? "Submit order" : "Continue to payment"}
      </button>
    </div>
  );
}
