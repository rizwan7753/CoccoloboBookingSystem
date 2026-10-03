"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "coco-announcement-dismissed";

/** Closeable top announcement bar — dismissal is remembered per-browser via
 *  localStorage, so it stays closed across page loads. What's stored is the
 *  dismissed announcement's `id`, not just "dismissed": give each new
 *  message a new id and it shows again, even to visitors who closed an
 *  earlier one. */
export default function AnnouncementBar({ id, children }: { id: string; children: React.ReactNode }) {
  // Default visible (matches server render, since localStorage isn't available
  // during SSR) — only flips to hidden after mount, for returning visitors who
  // dismissed it before. That's a much rarer case than "never dismissed", so
  // this ordering avoids a pop-in flash for most visitors.
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDismissed(localStorage.getItem(STORAGE_KEY) === id);
    } catch {
      // localStorage unavailable (private mode, etc.) — just show the bar.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDismissed(false);
    }
  }, [id]);

  function close() {
    setDismissed(true);
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      // ignore — worst case it reappears next visit
    }
  }

  if (dismissed) return null;

  return (
    // #0e3540 (a deeper Deep Ocean) rather than white or the regular
    // Deep Ocean: on #04bada white is ~2.3:1 and #164a59 ~4.2:1, both below
    // the 4.5:1 needed for text this size; #0e3540 is ~5.6:1.
    <div className="relative bg-[#04bada] px-10 py-[.6rem] text-center text-[.88rem] font-medium text-[#0e3540] sm:px-12">
      {children}
      <button
        type="button"
        onClick={close}
        aria-label="Dismiss announcement"
        className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-[#0e3540]/75 transition hover:bg-[#0e3540]/10 hover:text-[#0e3540] sm:right-4"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
          <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}
