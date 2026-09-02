// NMI's Collect.js tokenizes card details client-side (PCI SAQ-A, same role
// as Stripe Elements) — the tokenization key has to be present on the
// <script> tag's data attribute at load time, so this can't be a static
// import; it's injected once the key is known (fetched from /api/settings).
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

export function loadCollectJs(tokenizationKey: string): Promise<void> {
  if (loadedKey === tokenizationKey && window.CollectJS) return Promise.resolve();

  loadedKey = tokenizationKey;
  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://secure.nmi.com/token/Collect.js";
    script.setAttribute("data-tokenization-key", tokenizationKey);
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Could not load the payment form"));
    document.head.appendChild(script);
  });
  return loadPromise;
}
