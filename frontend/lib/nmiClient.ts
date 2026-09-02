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

export function loadCollectJs(tokenizationKey: string, gatewayDomain: string): Promise<void> {
  if (loadedKey === tokenizationKey && window.CollectJS) return Promise.resolve();

  loadedKey = tokenizationKey;
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://${gatewayDomain}/token/Collect.js`;
    script.setAttribute("data-tokenization-key", tokenizationKey);
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Could not load the payment form"));
    document.head.appendChild(script);
  });
}
