"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "coco-announcement-dismissed";

/** Closeable top announcement bar — dismissal is remembered per-browser via
 *  localStorage, so it stays closed across page loads until cleared. */
export default function AnnouncementBar({ children }: { children: React.ReactNode }) {
  // Default visible (matches server render, since localStorage isn't available
  // during SSR) — only flips to hidden after mount, for returning visitors who
  // dismissed it before. That's a much rarer case than "never dismissed", so
  // this ordering avoids a pop-in flash for most visitors.
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDismissed(localStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      // localStorage unavailable (private mode, etc.) — just show the bar.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDismissed(false);
    }
  }, []);

  function close() {
    setDismissed(true);
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore — worst case it reappears next visit
    }
  }

  if (dismissed) return null;

  return (
    <div className="relative bg-coral px-10 py-[.6rem] text-center text-[.88rem] text-abyss sm:px-12">
      {children}
      <button
        type="button"
        onClick={close}
        aria-label="Dismiss announcement"
        className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-abyss/70 transition hover:bg-abyss/10 hover:text-abyss sm:right-4"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
          <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}
