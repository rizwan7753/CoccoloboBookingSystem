"use client";

import { useEffect, useRef, useState } from "react";
import { loadCollectJs } from "@/lib/nmiClient";

const fieldBoxClass = "rounded-lg border border-stone-300 px-3 py-2.5";

export default function NmiCardForm({
  tokenizationKey,
  gatewayDomain,
  amount,
  onToken,
  buttonClassName,
}: {
  tokenizationKey: string;
  gatewayDomain: string;
  /** Booking total, e.g. "42.00" — passed through to Collect.js as `price`. */
  amount: string;
  /** Called with the Collect.js payment token — throw to show an error (e.g. a decline). */
  onToken: (token: string) => Promise<void>;
  buttonClassName?: string;
}) {
  const [ready, setReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const configuredRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    loadCollectJs(tokenizationKey, gatewayDomain)
      .then(() => {
        if (cancelled || configuredRef.current || !window.CollectJS) return;
        configuredRef.current = true;
        window.CollectJS.configure({
          variant: "inline",
          styleSniffer: true,
          // price/currency/country are required by Collect.js even for plain
          // card entry — omitting them left its internal wallet-availability
          // check ("PaymentRequestAbstraction") building an incomplete
          // PaymentRequest and throwing. googlePay/applePay are not real
          // config keys (per NMI's own docs) so they did nothing before.
          price: amount,
          currency: "USD",
          country: "US",
          fields: {
            ccnumber: { selector: "#nmi-ccnumber", placeholder: "Card number" },
            ccexp: { selector: "#nmi-ccexp", placeholder: "MM / YY" },
            cvv: { selector: "#nmi-cvv", placeholder: "CVV" },
          },
          callback: async (response: { token?: string }) => {
            if (!response.token) {
              setError("Could not process card — check the details and try again.");
              setSubmitting(false);
              return;
            }
            try {
              await onToken(response.token);
            } catch (err) {
              setError(err instanceof Error ? err.message : "Payment failed");
            } finally {
              setSubmitting(false);
            }
          },
        });
        setReady(true);
      })
      .catch(() => setError("Could not load the payment form — please refresh and try again."));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenizationKey, gatewayDomain]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!ready || submitting || !window.CollectJS) return;
    setSubmitting(true);
    setError(null);
    window.CollectJS.startPaymentRequest();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div id="nmi-ccnumber" className={`${fieldBoxClass} h-11`} />
      <div className="flex gap-3">
        <div id="nmi-ccexp" className={`${fieldBoxClass} h-11 flex-1`} />
        <div id="nmi-cvv" className={`${fieldBoxClass} h-11 w-24`} />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={!ready || submitting}
        className={buttonClassName ?? "w-full rounded-lg bg-stone-900 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"}
      >
        {submitting ? "Processing…" : ready ? "Pay now" : "Loading payment form…"}
      </button>
    </form>
  );
}
