// NMI's Collect.js tokenizes card details client-side (PCI SAQ-A, same role
// as Stripe Elements) — the tokenization key has to be present on the
// <script> tag's data attribute at load time, so this can't be a static
// import; it's injected once the key is known (fetched from /api/settings).
// NMI is white-label: sandbox accounts and many resellers serve Collect.js
// from their own domain rather than secure.nmi.com, so that's configurable too.
declare global {
  interface Window {
    CollectJS?: {
      configure: (options: Record<string, unknown>) => void;
      startPaymentRequest: () => void;
    };
  }
}

let loadedKey: string | null = null;
let loadPromise: Promise<void> | null = null;

// Collect.js reads country/currency off the <script> tag's own data
// attributes (not just the configure() call) to run its automatic Google Pay
// availability check at load time — omitting them here left that check
// building an invalid PaymentRequest and throwing "Could not create
// PaymentRequestAbstraction", independent of anything passed to configure().
export function loadCollectJs(tokenizationKey: string, gatewayDomain: string): Promise<void> {
  if (loadedKey === tokenizationKey && window.CollectJS) return Promise.resolve();

  // React (dev Strict Mode) invokes effects twice in quick succession — without
  // caching the in-flight promise, the second call would slip past the guard
  // above (window.CollectJS isn't set yet) and inject a second <script> tag,
  // giving two competing Collect.js instances fighting over the same iframes.
  if (loadedKey === tokenizationKey && loadPromise) return loadPromise;

  loadedKey = tokenizationKey;
  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://${gatewayDomain}/token/Collect.js`;
    script.setAttribute("data-tokenization-key", tokenizationKey);
    script.setAttribute("data-country", "US");
    script.setAttribute("data-currency", "USD");
    script.onload = () => resolve();
    script.onerror = () => {
      loadedKey = null;
      loadPromise = null;
      reject(new Error("Could not load the payment form"));
    };
    document.head.appendChild(script);
  });
  return loadPromise;
}
